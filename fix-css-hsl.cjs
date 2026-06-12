const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'index.css');
let content = fs.readFileSync(cssPath, 'utf8');

// Replace hsl(var(--container-low)) with var(--container-low)
content = content.replace(/hsl\(var\(--container-low\)\)/g, 'var(--container-low)');
content = content.replace(/hsl\(var\(--container-hi\)\)/g, 'var(--container-hi)');
content = content.replace(/hsl\(var\(--container\)\)/g, 'var(--container)');

fs.writeFileSync(cssPath, content, 'utf8');
console.log('Fixed hsl wrappers in index.css');
