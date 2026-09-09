const fs = require('fs');
const path = require('path');

function writeFile(filePath, content) {
    const fullPath = path.join(__dirname, filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, content);
    console.log('[SUCCESS] Created: ' + filePath);
}

console.log('[START] Starting Scaffold...\n');

writeFile('.env', 'VITE_SUPABASE_URL=https://ftmfocqsetlmseaksbdy.supabase.co\nVITE_SUPABASE_ANON_KEY=sb_publishable_SZ5vtuJMcYrvelLZUs4JqA_xnujtNcE\nVITE_INTASEND_PUBLIC_KEY=sb_publishable_SZ5vtuJMcYrvelLZUs4JqA_xnujtNcE\n');

writeFile('package.json', '{\n  "name": "integrated-platform-poc",\n  "version": "0.1.0",\n  "type": "module",\n  "scripts": {\n    "dev": "vite",\n    "build": "vite build",\n    "preview": "vite preview"\n  },\n  "dependencies": {\n    "@supabase/supabase-js": "^2.39.0",\n    "leaflet": "^1.9.4"\n  },\n  "devDependencies": {\n    "vite": "^5.0.0",\n    "tailwindcss": "^3.4.0",\n    "postcss": "^8.4.32",\n    "autoprefixer": "^10.4.16"\n  }\n}');

writeFile('vite.config.js', "import { defineConfig } from 'vite';\nexport default defineConfig({ root: '.', publicDir: 'public', build: { outDir: 'dist' }, server: { port: 3000, open: true } });");

writeFile('tailwind.config.js', "/** @type {import('tailwindcss').Config} */\nexport default { content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'], theme: { extend: {} }, plugins: [] };");

writeFile('postcss.config.js', 'export default { plugins: { tailwindcss: {}, autoprefixer: {} } };');

writeFile('index.html', '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Platform POC</title>\n    <link rel="stylesheet" href="/src/assets/css/style.css">\n</head>\n<body class="bg-gray-50 text-gray-900">\n    <div id="app" class="min-h-screen flex flex-col">\n        <header class="bg-white shadow p-4 flex justify-between items-center">\n            <h1 class="text-xl font-bold text-blue-600">Platform POC v0.1</h1>\n            <div id="auth-status" class="text-sm text-gray-600">Checking...</div>\n        </header>\n        <main id="main-content" class="flex-grow p-4 max-w-4xl mx-auto w-full">\n            <p class="text-center text-gray-500 mt-10">Loading...</p>\n        </main>\n    </div>\n    <script type="module" src="/src/main.js"><\/script>\n</body>\n</html>');

writeFile('src/assets/css/style.css', '@tailwind base;\n@tailwind components;\n@tailwind utilities;\nbody { font-family: system-ui, -apple-system, sans-serif; }');

writeFile('src/config/supabase.client.js', "import { createClient } from '@supabase/supabase-js';\nconst supabaseUrl = import.meta.env.VITE_SUPABASE_URL;\nconst supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;\nexport const supabase = createClient(supabaseUrl, supabaseAnonKey);");

writeFile('src/main.js', "import './assets/css/style.css';\nimport { supabase } from './config/supabase.client.js';\n\nasync function initApp() {\n    const statusEl = document.getElementById('auth-status');\n    const contentEl = document.getElementById('main-content');\n    try {\n        const { data: { session }, error } = await supabase.auth.getSession();\n        if (error) throw error;\n        if (session) {\n            statusEl.textContent = 'Logged in: ' + session.user.email;\n            statusEl.className = 'text-sm text-green-600 font-semibold';\n        } else {\n            statusEl.textContent = 'Not logged in';\n            statusEl.className = 'text-sm text-gray-500';\n        }\n        contentEl.innerHTML = '<div class=\"bg-white p-6 rounded-lg shadow-md mt-4\"><h2 class=\"text-2xl font-bold mb-4\">System Status</h2><p class=\"text-green-600 mb-2\">[SUCCESS] Supabase Connected Successfully!</p><p class=\"text-gray-600\">Ready for Sprint 1.</p></div>';\n    } catch (err) {\n        console.error('Error:', err);\n        statusEl.textContent = 'Connection Failed';\n        statusEl.className = 'text-sm text-red-600';\n        contentEl.innerHTML = '<p class=\"text-red-600\">Error: ' + err.message + '</p>';\n    }\n}\ninitApp();");

console.log('\n[COMPLETE] Scaffold Complete!');
