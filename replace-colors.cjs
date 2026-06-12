const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src', 'pages', 'admin');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        const dirPath = path.join(dir, f);
        if (f === 'node_modules' || f === '.git') return;
        const isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

function processFile(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Background replacements
    content = content.replace(/background:\s*['"](?:#fff|#ffffff|white|#FFF|#FFFFFF)['"]/g, "background: 'hsl(var(--surface))'");
    content = content.replace(/backgroundColor:\s*['"](?:#fff|#ffffff|white|#FFF|#FFFFFF)['"]/g, "backgroundColor: 'hsl(var(--surface))'");
    
    // Additional panels/cards
    content = content.replace(/background:\s*['"](?:#f5f5f5|#f9f9f9|#fafafa)['"]/g, "background: 'hsl(var(--surface-variant))'");

    // Text color replacements
    content = content.replace(/color:\s*['"](?:#000|#000000|black|#111|#111111|#222|#222222)['"]/g, "color: 'hsl(var(--on-surface))'");
    content = content.replace(/color:\s*['"](?:#333|#333333|#444|#444444|#555|#555555)['"]/g, "color: 'hsl(var(--on-surface-muted))'");

    // Border replacements
    content = content.replace(/border(?:Color)?:\s*['"](?:#eaeaea|#e2e8f0|#e5e7eb|#d1d5db|#1c221e|#181d19|#bec9bf)['"]/g, "borderColor: 'hsl(var(--border))'");
    content = content.replace(/border(?:Top|Bottom|Left|Right)?:\s*['"]1px solid (?:#eaeaea|#e2e8f0|#e5e7eb|#d1d5db|#1c221e|#181d19|#bec9bf)['"]/g, "border: '1px solid hsl(var(--border))'");
    content = content.replace(/borderBottom:\s*['"]1px solid (?:#eaeaea|#e2e8f0|#e5e7eb|#d1d5db|#1c221e|#181d19|#bec9bf)['"]/g, "borderBottom: '1px solid hsl(var(--border))'");
    content = content.replace(/borderTop:\s*['"]1px solid (?:#eaeaea|#e2e8f0|#e5e7eb|#d1d5db|#1c221e|#181d19|#bec9bf)['"]/g, "borderTop: '1px solid hsl(var(--border))'");

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated:', filePath);
    }
}

walkDir(directoryPath, processFile);
console.log('Color replacement script finished.');
