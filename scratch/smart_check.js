
import fs from 'fs';

const content = fs.readFileSync('c:\\MAMP\\htdocs\\The-Base\\src\\pages\\Dashboard.tsx', 'utf8');

// Simplified parser that handles basic JSX structure
let pos = 0;
const stack = [];

while (pos < content.length) {
    if (content[pos] === '<') {
        if (content[pos + 1] === '!' || content[pos + 1] === '?') {
            pos++; continue;
        }
        
        const isClosing = content[pos + 1] === '/';
        const start = isClosing ? pos + 2 : pos + 1;
        let end = start;
        while (end < content.length && /[a-zA-Z0-9]/.test(content[end])) end++;
        const tagName = content.substring(start, end);
        
        // Skip tags that are just types or fragments
        if (!tagName || /^[A-Z]/.test(tagName) && content.substring(pos, pos+10).includes('|')) {
            pos = end; continue;
        }

        // Find end of tag
        let tagEnd = end;
        let inQuotes = false;
        let braceDepth = 0;
        let isSelfClosing = false;

        while (tagEnd < content.length) {
            const char = content[tagEnd];
            if (char === '"' || char === "'") {
                if (!inQuotes) inQuotes = char;
                else if (inQuotes === char) inQuotes = false;
            } else if (!inQuotes) {
                if (char === '{') braceDepth++;
                else if (char === '}') braceDepth--;
                else if (braceDepth === 0) {
                    if (char === '/' && content[tagEnd + 1] === '>') {
                        isSelfClosing = true;
                        tagEnd++;
                        break;
                    } else if (char === '>') {
                        break;
                    }
                }
            }
            tagEnd++;
        }

        if (tagName === 'div' || tagName === 'section' || tagName === 'h3') {
            if (isClosing) {
                if (stack.length === 0) {
                    console.log(`Extra closing </${tagName}> at index ${pos}`);
                } else {
                    const last = stack.pop();
                    if (last.name !== tagName) {
                        console.log(`Mismatched: expected </${last.name}> (from index ${last.index}), found </${tagName}> at index ${pos}`);
                    }
                }
            } else if (!isSelfClosing) {
                stack.push({ name: tagName, index: pos });
            }
        }
        pos = tagEnd + 1;
    } else {
        pos++;
    }
}

if (stack.length > 0) {
    console.log('Unclosed tags:');
    stack.forEach(tag => {
        const line = content.substring(0, tag.index).split('\n').length;
        console.log(`- <${tag.name}> at line ${line}`);
    });
} else {
    console.log('All divs, sections, and h3s balanced!');
}
