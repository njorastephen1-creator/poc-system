const fs = require('fs');

console.log('[INFO] Fixing stuck loading screen...\n');

// 1. Force correct index.html structure
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Platform POC</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <link rel="stylesheet" href="/src/assets/css/style.css">
</head>
<body class="bg-gray-50 text-gray-900">
    <div id="app" class="min-h-screen flex flex-col">
        <header id="main-header"></header>
        <main id="main-content" class="flex-grow">
            <div class="flex items-center justify-center h-screen">
                <div class="text-center">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p class="text-gray-500">Loading application...</p>
                    <p id="load-error" class="text-red-500 text-sm mt-2 hidden"></p>
                </div>
            </div>
        </main>
        <footer class="bg-gray-900 text-gray-400 py-6 mt-auto">
            <div class="max-w-7xl mx-auto px-4 text-center text-sm">
                <p>&copy; 2026 Platform POC. All rights reserved.</p>
            </div>
        </footer>
    </div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script type="module" src="/src/main.js"></script>
</body>
</html>`;

fs.writeFileSync('index.html', htmlContent);
console.log('[SUCCESS] index.html updated with correct IDs and error catcher.');

// 2. Add global error catching to main.js
let mainJs = fs.readFileSync('src/main.js', 'utf8');

// Ensure we have a global error handler at the very top of main.js
if (!mainJs.includes('window.onerror')) {
    const errorHandler = `
// Global error catcher to prevent silent failures
window.onerror = function(message, source, lineno, colno, error) {
    console.error('[GLOBAL ERROR]', message, error);
    const errorEl = document.getElementById('load-error');
    if (errorEl) {
        errorEl.textContent = 'Error: ' + message;
        errorEl.classList.remove('hidden');
    }
    return false;
};

window.addEventListener('unhandledrejection', function(event) {
    console.error('[UNHANDLED PROMISE]', event.reason);
    const errorEl = document.getElementById('load-error');
    if (errorEl) {
        errorEl.textContent = 'Promise Error: ' + event.reason.message;
        errorEl.classList.remove('hidden');
    }
});
`;
    mainJs = errorHandler + '\n' + mainJs;
    fs.writeFileSync('src/main.js', mainJs);
    console.log('[SUCCESS] Added global error catcher to main.js.');
}

console.log('\n[COMPLETE] Please refresh your browser.');
console.log('If it is still stuck, the red error text will now appear on the screen.');
console.log('Please also press F12, go to the Console tab, and share any red errors.');