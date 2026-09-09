const fs = require('fs');

console.log('Adding Leaflet JS library...\n');

let html = fs.readFileSync('index.html', 'utf8');

// Add Leaflet JS if not already present
if (!html.includes('leaflet.js')) {
    html = html.replace('</head>', '<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>\n</head>');
    fs.writeFileSync('index.html', html);
    console.log(' Leaflet JS library added to index.html');
} else {
    console.log('Leaflet JS already present');
}