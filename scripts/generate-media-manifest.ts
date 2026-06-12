import fs from 'fs'
import path from 'path'

const publicDir = path.join(process.cwd(), 'public')
const manifestPath = path.join(process.cwd(), 'src/data/media-manifest.json')

function getFiles(dir: string, baseDir: string): string[] {
  let results: string[] = []
  const list = fs.readdirSync(dir)
  list.forEach((file) => {
    file = path.join(dir, file)
    const stat = fs.statSync(file)
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(file, baseDir))
    } else {
      // Get relative path from public dir
      const relativePath = path.relative(baseDir, file).replace(/\\/g, '/')
      // Exclude system files
      if (!file.endsWith('.xml') && !file.endsWith('.json') && !file.endsWith('.ico')) {
        results.push('/' + relativePath)
      }
    }
  })
  return results
}

try {
  console.log('🔍 Scanning public directory...')
  const files = getFiles(publicDir, publicDir)
  
  const data = {
    lastUpdated: new Date().toISOString(),
    files: files
  }

  // Ensure directory exists
  const dataDir = path.dirname(manifestPath)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  fs.writeFileSync(manifestPath, JSON.stringify(data, null, 2))
  console.log(`✅ Manifest generated with ${files.length} files at ${manifestPath}`)
} catch (error) {
  console.error('❌ Failed to generate media manifest:', error)
}
