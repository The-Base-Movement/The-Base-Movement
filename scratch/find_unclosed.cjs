
const fs = require('fs');
const content = fs.readFileSync('c:/MAMP/htdocs/The-Base/src/pages/admin/Settings.tsx', 'utf8');
const lines = content.split('\n');

let stack = [];
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Find all <div> tags that are NOT self-closing
    // A simplified regex for <div>
    const tokens = line.match(/<div(\s[^>]*[^/]>|>)|<\/div>/g) || [];
    
    for (const token of tokens) {
        if (token.startsWith('</')) {
            if (stack.length === 0) {
                console.log(`Extra closing div at line ${i + 1}`);
            } else {
                stack.pop();
            }
        } else {
            stack.push({ line: i + 1, text: token });
        }
    }
}

while (stack.length > 0) {
    const tag = stack.pop();
    console.log(`Unclosed div starting at line ${tag.line}: ${tag.text}`);
}
