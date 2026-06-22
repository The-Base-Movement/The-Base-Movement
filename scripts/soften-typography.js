/**
 * Typography Softening Script
 * -------------------------------------------------------------
 * Recursively scans components in src/pages/admin and refactors excessive
 * font weights (700, 800, 900) to conform to the design system's
 * typography tokens (medium 500, semibold 600).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Recursively walks a directory and triggers a callback for every file found
function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

const targetDir = path.resolve(__dirname, '../src/pages/admin');
let changedFiles = 0;

walkDir(targetDir, (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    const originalContent = fs.readFileSync(filePath, 'utf8');
    let newContent = originalContent;

    // Inline JS/React Styles
    newContent = newContent.replace(/fontWeight:\s*900/g, "fontWeight: 'var(--font-weight-semibold, 600)'");
    newContent = newContent.replace(/fontWeight:\s*['"]900['"]/g, "fontWeight: 'var(--font-weight-semibold, 600)'");

    newContent = newContent.replace(/fontWeight:\s*800/g, "fontWeight: 'var(--font-weight-semibold, 600)'");
    newContent = newContent.replace(/fontWeight:\s*['"]800['"]/g, "fontWeight: 'var(--font-weight-semibold, 600)'");

    newContent = newContent.replace(/fontWeight:\s*700/g, "fontWeight: 'var(--font-weight-medium, 500)'");
    newContent = newContent.replace(/fontWeight:\s*['"]700['"]/g, "fontWeight: 'var(--font-weight-medium, 500)'");

    // Tailwind Classes
    newContent = newContent.replace(/\bfont-black\b/g, "font-bold");
    newContent = newContent.replace(/\bfont-extrabold\b/g, "font-semibold");
    
    // Explicit arbitrary values in Tailwind
    newContent = newContent.replace(/font-\[900\]/g, "font-semibold");
    newContent = newContent.replace(/font-\[800\]/g, "font-semibold");
    newContent = newContent.replace(/font-\[700\]/g, "font-medium");

    if (newContent !== originalContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Updated: ${path.relative(targetDir, filePath)}`);
      changedFiles++;
    }
  }
});

console.log(`\nComplete! Modified ${changedFiles} files.`);
