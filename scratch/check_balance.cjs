
const fs = require('fs');
const content = fs.readFileSync('c:/MAMP/htdocs/The-Base/src/pages/admin/Settings.tsx', 'utf8');

const blocks = [
    { name: 'profile', start: 460 },
    { name: 'roles', start: 557 },
    { name: 'system', start: 594 },
    { name: 'movement', start: 655 },
    { name: 'buttons', start: 998 },
    { name: 'security', start: 1157 },
    { name: 'audit', start: 1330 }
];

const lines = content.split('\n');

blocks.forEach(block => {
    let pCount = 0;
    let bCount = 0;
    let started = false;
    let endLine = -1;

    for (let i = block.start - 1; i < lines.length; i++) {
        const line = lines[i];
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '(') pCount++;
            if (char === ')') pCount--;
            if (char === '{') bCount++;
            if (char === '}') bCount--;

            if (pCount === 0 && bCount === 0 && started) {
                endLine = i + 1;
                break;
            }
            if (pCount > 0 || bCount > 0) started = true;
        }
        if (endLine !== -1) break;
    }
    console.log(`Block ${block.name}: starts at ${block.start}, ends at ${endLine}, balance p=${pCount} b=${bCount}`);
});
