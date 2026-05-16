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
  
  // Match the opening tag of input, select, textarea
  // Note: this regex might not perfectly handle tags with '>' inside attribute values,
  // but it's usually safe for most React code.
  const tagRegex = /<(input|select|textarea)\b([^>]*)>/g;
  
  content = content.replace(tagRegex, (match, tag, attrs) => {
    // skip hidden and file
    if (attrs.includes('type="hidden"') || attrs.includes("type='hidden'")) return match;
    if (attrs.includes("display: 'none'") || attrs.includes('display:"none"')) return match;
    if (attrs.includes('type="file"') || attrs.includes("type='file'")) return match;
    
    // For radio/checkbox, we need BOTH id and name, but let's just make sure both exist
    const isRadioOrCheckbox = attrs.includes('type="radio"') || attrs.includes("type='radio'") || attrs.includes('type="checkbox"') || attrs.includes("type='checkbox'");
    
    const hasId = /\bid=['"{]/.test(attrs) || /\bid=/.test(attrs);
    const hasName = /\bname=['"{]/.test(attrs) || /\bname=/.test(attrs);
    
    if (hasId && hasName) return match;
    
    let newAttrs = attrs;
    let modified = false;
    
    const randomHex = crypto.randomBytes(3).toString('hex');
    const autoId = `${tag}-${randomHex}`;
    
    if (!hasId) {
      // insert id right after the tag name
      newAttrs = ` id="${autoId}"` + newAttrs;
      modified = true;
    }
    
    if (!hasName) {
      // try to extract name from value={xyz} or onChange={e => setXyz(e...)}
      let autoName = `name-${randomHex}`;
      
      const valueMatch = /value=\{([^}]+)\}/.exec(attrs);
      if (valueMatch && !valueMatch[1].includes('.')) {
         autoName = valueMatch[1].trim();
      } else {
         const nameMatch = /name=["']([^"']+)["']/.exec(attrs);
         if (nameMatch) autoName = nameMatch[1];
      }
      
      newAttrs = ` name="${autoName}"` + newAttrs;
      modified = true;
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

console.log(`Modified ${filesModified} files.`);
