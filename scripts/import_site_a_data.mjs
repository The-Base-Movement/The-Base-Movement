/**
 * Script: import_site_a_data.mjs
 * Description: Imports processed Site A datasets into Supabase PostgreSQL database
 * Usage: node scripts/import_site_a_data.mjs [--passwords-only | --members-only | --all]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://vhlyekyxutwbxlvktnzd.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required to run this import.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const KNOWN_INVALID_MEMBER_EMAILS = new Set(['morgangroupgh100hj8@gmail.com']);

function importEmailOrNull(email) {
  const normalizedEmail = email?.trim().toLowerCase() || '';
  if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) return null;
  return KNOWN_INVALID_MEMBER_EMAILS.has(normalizedEmail) ? null : normalizedEmail;
}

// Mirrors supabase/functions/_shared/phone.ts — keep in sync.
function normalizePhoneNumber(input) {
  const cleaned = (input || '').trim();
  const digits = cleaned.replace(/\D/g, '');
  if (!digits) return null;

  let local9 = null;
  if (digits.length === 9) local9 = digits;
  else if (digits.length === 10 && digits.startsWith('0')) local9 = digits.slice(1);
  else if (digits.length === 12 && digits.startsWith('233')) local9 = digits.slice(3);

  if (local9 && /^\d{9}$/.test(local9)) return `+233${local9}`;

  if (cleaned.startsWith('+')) {
    const plusDigits = cleaned.slice(1).replace(/\D/g, '');
    if (plusDigits.length >= 7 && plusDigits.length <= 15) return `+${plusDigits}`;
  }
  return null;
}

function randomPassword(length = 24) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, b => chars[b % chars.length]).join('');
}

// Create the Supabase Auth account for a member first: prefer phone, fall back to email.
// public.users.id is a strict (non-deferrable) FK to auth.users.id, so the auth account
// must exist before the profile row can be inserted.
async function createAuthUser(id, normalizedPhone, email) {
  let lastError = null;
  if (normalizedPhone) {
    const res = await supabase.auth.admin.createUser({
      id,
      phone: normalizedPhone,
      phone_confirm: true,
      password: randomPassword(),
    });
    if (!res.error) return { ok: true };
    lastError = res.error;
  }
  if (email) {
    const res = await supabase.auth.admin.createUser({
      id,
      email,
      email_confirm: true,
      password: randomPassword(),
    });
    if (!res.error) return { ok: true };
    lastError = res.error;
  }
  return { ok: false, error: lastError?.message ?? 'no usable phone or email' };
}

async function runPooled(items, size, fn) {
  const out = [];
  for (let i = 0; i < items.length; i += size) {
    const chunk = items.slice(i, i + size);
    out.push(...(await Promise.all(chunk.map(fn))));
  }
  return out;
}

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];
  
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = values[idx];
      });
      rows.push(obj);
    }
  }
  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur);
  return result;
}

async function importLegacyPasswords() {
  const file = path.join(ROOT_DIR, 'docs', 'data-from-site-A', 'legacy_passwords_import.csv');
  console.log(`\nReading ${file}...`);
  const rows = parseCSV(file);
  console.log(`Loaded ${rows.length} legacy password records.`);
  
  const payload = rows.map(r => ({
    email: importEmailOrNull(r.email),
    phone_number: r.phone_number || null,
    registration_number: r.registration_number || null,
    legacy_hash: r.legacy_hash,
    legacy_salt: r.legacy_salt,
    is_upgraded: false
  }));
  
  const BATCH_SIZE = 500;
  let inserted = 0;
  
  for (let i = 0; i < payload.length; i += BATCH_SIZE) {
    const batch = payload.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('legacy_passwords').insert(batch);
    if (error) {
      console.error(`Error importing batch ${i} - ${i + batch.length}:`, error.message);
    } else {
      inserted += batch.length;
      console.log(`[OK] Imported legacy passwords ${inserted}/${payload.length}`);
    }
  }
  console.log(`[SUCCESS] Completed importing ${inserted} legacy passwords.`);
}

async function importReadyMembers() {
  const file = path.join(ROOT_DIR, 'docs', 'data-from-site-A', 'members_import_ready.csv');
  console.log(`\nReading ${file}...`);
  const rows = parseCSV(file);
  console.log(`Loaded ${rows.length} ready member records.`);

  const candidates = rows.map(r => {
    const clean = { ...r, email: importEmailOrNull(r.email) };
    clean.id = crypto.randomUUID();

    Object.keys(clean).forEach(k => {
      if (clean[k] === '') clean[k] = null;
    });
    return clean;
  });

  console.log(`Provisioning ${candidates.length} Auth accounts (phone first, email fallback)...`);
  const authResults = await runPooled(candidates, 8, async row => {
    const normalizedPhone = normalizePhoneNumber(row.phone_number);
    const res = await createAuthUser(row.id, normalizedPhone, row.email);
    return { row, ...res };
  });

  const payload = authResults.filter(r => r.ok).map(r => r.row);
  const authFailed = authResults.filter(r => !r.ok);

  console.log(`[OK] Auth accounts created: ${payload.length}/${candidates.length}`);
  if (authFailed.length > 0) {
    console.warn(`[SKIP] ${authFailed.length} rows had no usable auth account and will not be imported:`);
    authFailed.slice(0, 20).forEach(r => console.warn(`  - ${r.row.full_name} (${r.row.id}): ${r.error}`));
    if (authFailed.length > 20) console.warn(`  ...and ${authFailed.length - 20} more`);
  }

  const BATCH_SIZE = 250;
  let inserted = 0;

  for (let i = 0; i < payload.length; i += BATCH_SIZE) {
    const batch = payload.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('users').insert(batch);
    if (error) {
      console.error(`Error importing batch ${i} - ${i + batch.length}:`, error.message);
    } else {
      inserted += batch.length;
      console.log(`[OK] Imported member profiles ${inserted}/${payload.length}`);
    }
  }
  console.log(`[SUCCESS] Completed importing ${inserted} member profiles.`);
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || '--all';
  
  console.log('=== SITE A DATA IMPORT TOOL ===');
  
  if (mode === '--passwords-only' || mode === '--all') {
    await importLegacyPasswords();
  }
  
  if (mode === '--members-only' || mode === '--all') {
    await importReadyMembers();
  }
  
  console.log('\n[ALL DONE] Data import process completed!');
}

main().catch(err => {
  console.error('Fatal import error:', err);
  process.exit(1);
});
