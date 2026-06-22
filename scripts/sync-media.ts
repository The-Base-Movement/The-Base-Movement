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

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for bypass RLS

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    'Missing Supabase environment variables (VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)'
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

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

  // 2. Sync Root Logos/Images -> logos-favicons/ or public-assets/
  console.log('\n📂 Syncing Root Assets...')
  const rootAssets = [
    'logo.png',
    'hero-bg.png',
    'og-image.png',
    'founder.jpg',
    'the-base-banner-1.png',
  ]
  for (const asset of rootAssets) {
    const localPath = path.join('public', asset)
    if (fs.existsSync(localPath)) {
      const category = asset.includes('logo') ? 'logos-favicons' : 'public-assets'
      await uploadFile(localPath, `${category}/${asset}`)
    }
  }

  console.log('\n✨ Sync Complete!')
}

sync()
