
import fs from 'fs';

const content = fs.readFileSync('c:\\MAMP\\htdocs\\The-Base\\src\\pages\\Dashboard.tsx', 'utf8');
const lines = content.split('\n');

let stackDepth = 0;
const stack = [];

const regex = /<(\/)?([a-zA-Z0-9]+)([^>]*?)(\/)?>/g;

lines.forEach((line, i) => {
    let match;
    while ((match = regex.exec(line)) !== null) {
        const isClosing = !!match[1];
        const tagName = match[2];
        const isSelfClosing = !!match[4];

        if (tagName === 'div') {
            if (isSelfClosing) continue;
            if (isClosing) {
                stackDepth--;
            } else {
                stackDepth++;
            }
        }
    }
    if (stackDepth < 0) {
        console.log(`NEGATIVE DEPTH at line ${i + 1}: ${line.trim()}`);
    }
});

console.log(`Final stack depth for <div>: ${stackDepth}`);
