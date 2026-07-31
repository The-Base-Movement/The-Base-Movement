import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const sourceDir = path.join(rootDir, 'node_modules', 'tinymce')
const targetDir = path.join(rootDir, 'public', 'tinymce')

if (!existsSync(sourceDir)) {
  console.warn('[tinymce] source package not found, skipping asset copy')
  process.exit(0)
}

mkdirSync(path.dirname(targetDir), { recursive: true })
rmSync(targetDir, { recursive: true, force: true })
cpSync(sourceDir, targetDir, { recursive: true })
console.log('[tinymce] copied self-hosted assets to public/tinymce')
