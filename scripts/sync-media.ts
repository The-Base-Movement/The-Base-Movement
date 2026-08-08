/**
 * Supabase Storage Media Synchronizer
 * -------------------------------------------------------------
 * Uploads/synchronizes local media assets (e.g. logos, favicons, banners)
 * from the public/ directory to the Supabase Storage 'media' bucket.
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables (SUPABASE_URL, SUPABASE_ANON_KEY)')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Uploads a local file to a specified path in the Supabase 'media' storage bucket
async function uploadFile(localPath: string, bucketPath: string) {
  const fileBuffer = fs.readFileSync(localPath)
  const { error } = await supabase.storage.from('media').upload(bucketPath, fileBuffer, {
    upsert: true,
    contentType: getContentType(localPath),
  })

  if (error) {
    console.error(`  [ERROR] ${localPath}:`, error.message)
  } else {
    console.log(`  [SUCCESS] ${localPath} -> ${bucketPath}`)
  }
}

// Helper function to resolve the Content-Type header based on the file extension
function getContentType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase()
  switch (ext) {
    case '.png':
      return 'image/png'
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.webp':
      return 'image/webp'
    case '.svg':
      return 'image/svg+xml'
    case '.ico':
      return 'image/x-icon'
    default:
      return 'application/octet-stream'
  }
}

// Scans local directories and syncs all static assets to Supabase Storage
async function sync() {
  console.log('🚀 Starting Media Sync...')

  // 1. Sync Favicons -> logos-favicons/
  const faviconDir = 'public/favicons'
  if (fs.existsSync(faviconDir)) {
    console.log('\n📂 Syncing Favicons...')
    const files = fs.readdirSync(faviconDir)
    for (const file of files) {
      if (fs.lstatSync(path.join(faviconDir, file)).isFile()) {
        await uploadFile(path.join(faviconDir, file), `logos-favicons/${file}`)
      }
    }
  }

  // 2. Sync Branding Directory -> branding/
  const brandingDir = 'public/branding'
  if (fs.existsSync(brandingDir)) {
    console.log('\n📂 Syncing Branding Assets...')
    const files = fs.readdirSync(brandingDir)
    for (const file of files) {
      const fullPath = path.join(brandingDir, file)
      if (fs.lstatSync(fullPath).isFile()) {
        await uploadFile(fullPath, `branding/${file}`)
        await uploadFile(fullPath, `logos-favicons/${file}`)
      }
    }
  }

  // 3. Sync Party Affiliations -> party-affiliations/
  const partyDir = 'public/party-affiliations'
  if (fs.existsSync(partyDir)) {
    console.log('\n📂 Syncing Party Affiliations Assets...')
    const files = fs.readdirSync(partyDir)
    for (const file of files) {
      const fullPath = path.join(partyDir, file)
      if (fs.lstatSync(fullPath).isFile()) {
        await uploadFile(fullPath, `party-affiliations/${file}`)
      }
    }
  }

  console.log('\n✨ Sync Complete!')
}

sync()
