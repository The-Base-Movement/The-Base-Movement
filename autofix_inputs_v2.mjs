import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

function walk(dir, files = []) {
  for (const f of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, f);
    if (fs.statSync(fullPath).isDirectory()) walk(fullPath, files);
    else if (fullPath.endsWith('.tsx')) files.push(fullPath);
  }
  return files;
}

const files = walk('c:/MAMP/htdocs/The-Base/src');
let filesModified = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  const tagRegex = /<(input|select|textarea)\b([^>]*)>/g;
  
  content = content.replace(tagRegex, (match, tag, attrs) => {
    if (attrs.includes('type="hidden"') || attrs.includes("type='hidden'")) return match;
    if (attrs.includes("display: 'none'") || attrs.includes('display:"none"')) return match;
    if (attrs.includes('type="file"') || attrs.includes("type='file'")) return match;
    
    const hasId = /\bid=['"{]/.test(attrs) || /\bid=/.test(attrs);
    const hasName = /\bname=['"{]/.test(attrs) || /\bname=/.test(attrs);
    const hasAria = /aria-label=['"{]/.test(attrs) || /aria-labelledby=['"{]/.test(attrs);
    
    let newAttrs = attrs;
    let modified = false;
    
    const randomHex = crypto.randomBytes(3).toString('hex');
    
    // Add ID if missing
    if (!hasId) {
      newAttrs = ` id="${tag}-${randomHex}"` + newAttrs;
      modified = true;
    }
    
    // Add Name if missing
    if (!hasName) {
      let autoName = `name-${randomHex}`;
      const valueMatch = /value=\{([^}]+)\}/.exec(attrs);
      if (valueMatch && !valueMatch[1].includes('.') && !valueMatch[1].includes('[')) {
         autoName = valueMatch[1].trim();
      }
      newAttrs = ` name="${autoName}"` + newAttrs;
      modified = true;
    }
    
    // Add aria-label if missing and placeholder exists
    if (!hasAria) {
      const placeholderMatch = /placeholder=["']([^"']+)["']/.exec(attrs);
      if (placeholderMatch) {
        const ariaLabel = placeholderMatch[1].replace('...', '').trim();
        newAttrs = ` aria-label="${ariaLabel}"` + newAttrs;
        modified = true;
      }
    }
    
    if (modified) {
      return `<${tag}${newAttrs}>`;
    }
    return match;
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    filesModified++;
  }
});

console.log(`Modified ${filesModified} files with enhanced accessibility attributes.`);
