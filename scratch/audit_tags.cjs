const fs = require('fs');
const path = require('path');

function checkTags(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let stack = [];
    
    // Improved regex to handle various tags, not just div
    // Matches <tag ... > (not self-closing) or </tag>
    const tagRegex = /<([a-zA-Z1-6]+)(?:\s[^>]*[^/]>|>)|<\/([a-zA-Z1-6]+)>/g;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let match;
        while ((match = tagRegex.exec(line)) !== null) {
            const [fullMatch, openTagName, closeTagName] = match;
            
            if (closeTagName) {
                if (stack.length === 0) {
                    console.log(`[${filePath}] Extra closing tag </${closeTagName}> at line ${i + 1}`);
                } else {
                    const lastOpen = stack.pop();
                    if (lastOpen.name !== closeTagName) {
                        console.log(`[${filePath}] Mismatched tag at line ${i + 1}: expected </${lastOpen.name}>, found </${closeTagName}> (opened at line ${lastOpen.line})`);
                    }
                }
            } else if (openTagName) {
                // Ignore self-closing tags like <img />, <br />, etc. if not caught by regex
                const selfClosing = ['img', 'br', 'hr', 'input', 'link', 'meta'].includes(openTagName.toLowerCase());
                if (!selfClosing) {
                    stack.push({ name: openTagName, line: i + 1, text: fullMatch });
                }
            }
        }
    }

    while (stack.length > 0) {
        const tag = stack.pop();
        console.log(`[${filePath}] Unclosed tag <${tag.name}> starting at line ${tag.line}`);
    }
}

const filesToCheck = [
    'src/pages/Register.tsx',
    'src/pages/Dashboard.tsx',
    'src/pages/admin/Settings.tsx',
    'src/pages/admin/Store.tsx',
    'src/pages/admin/Members.tsx',
    'src/pages/admin/MemberVerification.tsx',
    'src/pages/ProfileSettings.tsx'
];

filesToCheck.forEach(file => {
    const fullPath = path.resolve(file);
    if (fs.existsSync(fullPath)) {
        checkTags(fullPath);
    } else {
        console.log(`File not found: ${file}`);
    }
});
