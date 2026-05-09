
const fs = require('fs');
const content = fs.readFileSync('c:/MAMP/htdocs/The-Base/src/pages/admin/Settings.tsx', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('activeTab ===')) {
        console.log(`Line ${i + 1}: ${lines[i].trim()}`);
    }
}
