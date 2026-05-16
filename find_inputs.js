const fs = require('fs');
const path = require('path');

function walk(dir, files = []) {
  for (const f of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, f);
    if (fs.statSync(fullPath).isDirectory()) walk(fullPath, files);
    else if (fullPath.endsWith('.tsx')) files.push(fullPath);
  }
  return files;
}

const files = walk('c:/MAMP/htdocs/The-Base/src');
let issues = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const tagRegex = /<(input|select|textarea)\b([^>]*)>/g;
  let match;
  while ((match = tagRegex.exec(content)) !== null) {
    const tag = match[1];
    const attrs = match[2];
    
    if (attrs.includes('type="hidden"') || attrs.includes("type='hidden'")) continue;
    if (attrs.includes("display: 'none'")) continue; // file inputs often hidden
    if (attrs.includes("type=\"file\"")) continue;
    if (attrs.includes("type='radio'") || attrs.includes("type=\"radio\"") || attrs.includes("type=\"checkbox\"")) {
       const hasIdRadio = /\bid=['{]/.test(attrs) || /\bid=/.test(attrs);
       const hasNameRadio = /\bname=['{]/.test(attrs) || /\bname=/.test(attrs);
       if (!hasIdRadio || !hasNameRadio) {
          issues.push({ file: file, tag, attrs: attrs.trim().substring(0, 100) });
       }
       continue;
    }
    
    const hasId = /\bid=['{]/.test(attrs) || /\bid=/.test(attrs);
    const hasName = /\bname=['{]/.test(attrs) || /\bname=/.test(attrs);
    
    if (!hasId || !hasName) {
      issues.push({ file: file, tag, attrs: attrs.trim().substring(0, 100) });
    }
  }
});

console.log('Total issues found:', issues.length);
if (issues.length > 0) {
  console.log(issues.slice(0, 30).map(i => i.file.replace('c:\\MAMP\\htdocs\\The-Base\\', '') + ' : ' + i.tag + ' -> ' + i.attrs).join('\n'));
}
