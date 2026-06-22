/**
 * Media Manifest Generator (CommonJS)
 * -------------------------------------------------------------
 * Scans the public directory for static media assets (excluding system files)
 * and generates a JSON manifest file containing a list of asset paths.
 */

const fs = require('fs');
const path = require('path');

const publicDir = path.join(process.cwd(), 'public');
const manifestPath = path.join(process.cwd(), 'src/data/media-manifest.json');

// Recursively scans a directory to find all media file paths relative to the base directory
function getFiles(dir, baseDir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath, baseDir));
    } else {
      const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      if (!file.endsWith('.xml') && !file.endsWith('.json') && !file.endsWith('.ico')) {
        results.push('/' + relativePath);
      }
    }
  });
  return results;
}

try {
  console.log('🔍 Scanning public directory...');
  const files = getFiles(publicDir, publicDir);
  
  const data = {
    lastUpdated: new Date().toISOString(),
    files: files
  };

  const dataDir = path.dirname(manifestPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(manifestPath, JSON.stringify(data, null, 2));
  console.log(`✅ Manifest generated with ${files.length} files at ${manifestPath}`);
} catch (error) {
  console.error('❌ Failed to generate media manifest:', error);
}
