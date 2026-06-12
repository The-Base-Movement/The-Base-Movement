const fs = require('fs');

function findAndReplace(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = dir + '/' + file;
    if (fs.statSync(fullPath).isDirectory()) {
      findAndReplace(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      let originalContent = content;
      
      content = content.replace(/background:\s*'hsl\(var\(--on-surface\)\)'/g, "background: 'hsl(var(--container-low))'");
      
      if (content !== originalContent) {
        content = content.replace(/color:\s*'#fff'/g, "color: 'hsl(var(--on-surface))'");
        content = content.replace(/color:\s*'#ffffff'/g, "color: 'hsl(var(--on-surface))'");
        content = content.replace(/color:\s*'rgba\(255,\s*255,\s*255,\s*0\.55\)'/g, "color: 'hsl(var(--on-surface-muted))'");
        content = content.replace(/color:\s*'rgba\(255,\s*255,\s*255,\s*0\.6\)'/g, "color: 'hsl(var(--on-surface-muted))'");
        fs.writeFileSync(fullPath, content);
        console.log('Fixed:', fullPath);
      }
    }
  }
}

findAndReplace('src');
