const fs = require('fs');

console.log('[INFO] Cleaning up icons and console logs...\n');

let mainJs = fs.readFileSync('src/main.js', 'utf8');

// 1. Replace emojis in the UI with professional inline SVGs
const pinIcon = '<svg class="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>';
const clockIcon = '<svg class="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
const phoneIcon = '<svg class="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>';

mainJs = mainJs.replace(/📍/g, pinIcon);
mainJs = mainJs.replace(/🕐/g, clockIcon);
mainJs = mainJs.replace(//g, phoneIcon);

// 2. Clean up console logs in main.js
mainJs = mainJs.replace(/console\.log\('[SUCCESS]/g, "console.log('[SUCCESS]");
mainJs = mainJs.replace(/console\.log\('[ERROR]/g, "console.log('[ERROR]");
mainJs = mainJs.replace(/console\.log\('[START]/g, "console.log('[START]");

fs.writeFileSync('src/main.js', mainJs);

// 3. Clean up the scaffold files in the directory
const files = fs.readdirSync('.').filter(f => f.endsWith('.cjs'));
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/[SUCCESS]/g, '[SUCCESS]');
    content = content.replace(/[ERROR]/g, '[ERROR]');
    content = content.replace(//g, '[START]');
    content = content.replace(/[COMPLETE]/g, '[COMPLETE]');
    fs.writeFileSync(file, content);
});

console.log('[SUCCESS] All emojis replaced with professional SVGs and clean logs.');