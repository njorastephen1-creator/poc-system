const fs = require('fs');

console.log('Fixing import path...\n');

try {
    let content = fs.readFileSync('src/main.js', 'utf8');
    
    // Fix the incorrect relative path
    content = content.replace(
        "import { supabase } from '../config/supabase.client.js';",
        "import { supabase } from './config/supabase.client.js';"
    );
    
    fs.writeFileSync('src/main.js', content);
    console.log(' Import path fixed successfully!');
} catch (err) {
    console.error('Error fixing file:', err.message);
}