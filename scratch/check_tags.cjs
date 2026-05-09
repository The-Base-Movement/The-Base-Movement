
const fs = require('fs');
const content = fs.readFileSync('c:/MAMP/htdocs/The-Base/src/pages/admin/Settings.tsx', 'utf8');

function countTags(tagName) {
    const openRegex = new RegExp('<' + tagName + '(\\s|>)', 'g');
    const closeRegex = new RegExp('</' + tagName + '>', 'g');
    const openCount = (content.match(openRegex) || []).length;
    const closeCount = (content.match(closeRegex) || []).length;
    return { openCount, closeCount };
}

console.log('div:', countTags('div'));
console.log('Card:', countTags('Card'));
console.log('CardContent:', countTags('CardContent'));
console.log('Button:', countTags('Button'));
console.log('Label:', countTags('Label'));
console.log('Input:', countTags('Input'));
console.log('Dialog:', countTags('Dialog'));
