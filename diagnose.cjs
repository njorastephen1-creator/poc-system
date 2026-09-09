const fs = require('fs');

console.log('[INFO] Diagnosing application issues...\n');

// Check if required files exist
const requiredFiles = [
    'src/main.js',
    'src/config/supabase.client.js',
    'src/services/auth.service.js',
    'src/services/business.service.js',
    'src/services/product.service.js',
    'src/services/order.service.js',
    'src/services/group.service.js',
    'index.html'
];

console.log('Checking required files:');
requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log('  [OK] ' + file);
    } else {
        console.log('  [MISSING] ' + file);
    }
});

// Check main.js for common issues
if (fs.existsSync('src/main.js')) {
    const mainJs = fs.readFileSync('src/main.js', 'utf8');
    
    // Check for syntax errors
    if (mainJs.includes('Murang\'a')) {
        console.log('\n[WARNING] Found unescaped apostrophe in Murang\'a');
        let fixed = mainJs.replace(/Murang'a/g, "Murang\\'a");
        fs.writeFileSync('src/main.js', fixed);
        console.log('[FIXED] Escaped apostrophe');
    }
    
    // Check if imports are correct
    if (!mainJs.includes('import { supabase }')) {
        console.log('\n[ERROR] Missing supabase import');
    }
    
    console.log('\n[INFO] main.js file size:', mainJs.length, 'bytes');
}

console.log('\n[COMPLETE] Diagnostic finished. Check console for errors.');