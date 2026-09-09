const fs = require('fs');

console.log('[INFO] Fixing Syntax Error (Line 275)...\n');

let content = fs.readFileSync('src/main.js', 'utf8');

// 1. Safely rewrite the counties array without any problematic apostrophes
const safeCounties = "['Mombasa','Kwale','Kilifi','Tana River','Lamu','Taita-Taveta','Garissa','Wajir','Mandera','Marsabit','Isiolo','Meru','Tharaka-Nithi','Laikipia','Samburu','Turkana','West Pokot','Baringo','Uasin Gishu','Elgeyo-Marakwet','Nandi','Bomet','Kakamega','Vihiga','Bungoma','Busia','Siaya','Kisumu','Homa Bay','Migori','Kisii','Nyamira','Nairobi','Kiambu','Machakos','Makueni','Muranga','Nyeri','Kirinyaga','Nyandarua','Nakuru','Narok','Kajiado','Kericho','Trans-Nzoia','Kitui','Embu']";

// Replace the entire counties array declaration with the safe version
content = content.replace(/const counties = \[.*?\];/s, 'const counties = ' + safeCounties + ';');

// 2. Fix any other potential single-quote issues in the file
content = content.replace(/Murang'a/g, 'Muranga');

fs.writeFileSync('src/main.js', content);

console.log('[SUCCESS] Fixed syntax error in counties array.');
console.log('[INFO] Please hard refresh your browser (Ctrl + F5).');