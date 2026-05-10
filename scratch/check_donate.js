
import fs from 'fs';

const content = fs.readFileSync('src/pages/Donate.tsx', 'utf8');

const stack = [];
const regex = /<(\/)?([a-zA-Z0-9]+)([^>]*?)(\/)?>/g;

let match;
while ((match = regex.exec(content)) !== null) {
    const isClosing = !!match[1];
    const tagName = match[2];
    const isSelfClosing = !!match[4];

    if (isSelfClosing) continue;

    if (isClosing) {
        if (stack.length === 0) {
            console.log(`Extra closing tag: </${tagName}> at index ${match.index}`);
        } else {
            const last = stack.pop();
            if (last.name !== tagName) {
                console.log(`Mismatched: expected </${last.name}> (from index ${last.index}), found </${tagName}> at index ${match.index}`);
            }
        }
    } else {
        stack.push({ name: tagName, index: match.index });
    }
}

if (stack.length > 0) {
    console.log('Unclosed tags:');
    stack.forEach(tag => {
        const line = content.substring(0, tag.index).split('\n').length;
        console.log(`- <${tag.name}> at line ${line}`);
    });
}
