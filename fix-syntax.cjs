const fs = require('fs');

console.log('[INFO] Fixing syntax error in main.js...\n');

let content = fs.readFileSync('src/main.js', 'utf8');

// Fix the apostrophe in Murang'a
content = content.replace(/Murang'a/g, "Murang\\'a");

fs.writeFileSync('src/main.js', content);
console.log('[SUCCESS] Fixed apostrophe escaping in counties array');