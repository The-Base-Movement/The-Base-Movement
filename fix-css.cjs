const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'index.css');
let content = fs.readFileSync(cssPath, 'utf8');

// 1. Add --surface mapping
if (!content.includes('--surface: var(--background);')) {
    content = content.replace(
        '--background: 103 47% 97%; /* #f6fbf4 */',
        '--background: 103 47% 97%; /* #f6fbf4 */\n    --surface: var(--background);\n    --surface-foreground: var(--foreground);'
    );
    
    content = content.replace(
        '--background: 132 9% 6%;',
        '--background: 132 9% 6%;\n    --surface: var(--background);\n    --surface-foreground: var(--foreground);'
    );
}

// 2. Replace background: #fff; with background: hsl(var(--card));
content = content.replace(/background:\s*#fff\s*;/g, 'background: hsl(var(--card));');

// 3. Replace background: #181d19; in buttons or dark contexts to primary or appropriate if needed.
// Wait, the user specifically mentioned white backgrounds, so #fff is the main issue.

fs.writeFileSync(cssPath, content, 'utf8');
console.log('Fixed index.css');
