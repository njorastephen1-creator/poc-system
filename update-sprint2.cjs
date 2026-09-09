const fs = require('fs');
const path = require('path');

function writeFile(filePath, content) {
    const fullPath = path.join(__dirname, filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, content);
    console.log('Updated: ' + filePath);
}

console.log('Starting Sprint 2: Authentication System...\n');

// 1. Create the Authentication Service
writeFile('src/services/auth.service.js', `import { supabase } from '../config/supabase.client.js';

export const authService = {
    async signUp(email, password, fullName) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } }
        });
        if (error) throw error;
        return data;
    },

    async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        return data;
    },

    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    async getSession() {
        const { data } = await supabase.auth.getSession();
        return data.session;
    },

    async getCurrentUser() {
        const { data } = await supabase.auth.getUser();
        return data.user;
    }
};
`);

// 2. Update the HTML to include a hidden logout button
writeFile('index.html', `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Integrated Platform POC</title>
    <link rel="stylesheet" href="/src/assets/css/style.css">
</head>
<body class="bg-gray-50 text-gray-900">
    <div id="app" class="min-h-screen flex flex-col">
        <header class="bg-white shadow p-4 flex justify-between items-center">
            <h1 class="text-xl font-bold text-blue-600">Platform POC v0.1</h1>
            <nav id="main-nav" class="hidden flex items-center gap-4">
                <span id="auth-status" class="text-sm text-gray-600"></span>
                <button id="logout-btn" class="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition">Logout</button>
            </nav>
            <div id="auth-status-mobile" class="text-sm text-gray-600 md:hidden">Checking...</div>
        </header>
        <main id="main-content" class="flex-grow p-4 max-w-4xl mx-auto w-full">
            <p class="text-center text-gray-500 mt-10">Loading application...</p>
        </main>
    </div>
    <script type="module" src="/src/main.js"></script>
</body>
</html>`);

// 3. Update the Main Application Logic
writeFile('src/main.js', `import './assets/css/style.css';
import { authService } from './services/auth.service.js';

let currentUser = null;

async function initApp() {
    const statusEl = document.getElementById('auth-status');
    const mobileStatusEl = document.getElementById('auth-status-mobile');
    const navEl = document.getElementById('main-nav');
    const contentEl = document.getElementById('main-content');

    try {
        const session = await authService.getSession();
        currentUser = session?.user || null;

        if (currentUser) {
            const statusText = 'Logged in: ' + currentUser.email;
            if (statusEl) {
                statusEl.textContent = statusText;
                statusEl.className = 'text-sm text-green-600 font-semibold';
            }
            if (mobileStatusEl) {
                mobileStatusEl.textContent = statusText;
                mobileStatusEl.className = 'text-sm text-green-600 font-semibold';
            }
            navEl.classList.remove('hidden');
            showDashboard(contentEl);
        } else {
            if (statusEl) {
                statusEl.textContent = 'Not logged in';
                statusEl.className = 'text-sm text-gray-500';
            }
            if (mobileStatusEl) {
                mobileStatusEl.textContent = 'Not logged in';
                mobileStatusEl.className = 'text-sm text-gray-500';
            }
            navEl.classList.add('hidden');
            showAuth(contentEl);
        }

        document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
        
    } catch (err) {
        console.error("Init Error:", err);
        if (statusEl) {
            statusEl.textContent = 'Connection Error';
            statusEl.className = 'text-sm text-red-600';
        }
        contentEl.innerHTML = '<p class="text-red-600">Error: ' + err.message + '</p>';
    }
}

function showAuth(container) {
    container.innerHTML = \`
        <div class="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md mt-10">
            <h2 class="text-2xl font-bold mb-6 text-center text-gray-800">Welcome to Platform POC</h2>
            <div class="space-y-4">
                <button id="login-btn" class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition font-medium">Login</button>
                <button id="register-btn" class="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition font-medium">Register</button>
            </div>
            <div id="auth-form" class="mt-6 hidden">
                <input type="email" id="email" placeholder="Email Address" class="w-full p-2 border border-gray-300 rounded mb-3 focus:outline-none focus:border-blue-500" required>
                <input type="password" id="password" placeholder="Password (min 6 characters)" class="w-full p-2 border border-gray-300 rounded mb-3 focus:outline-none focus:border-blue-500" required>
                <input type="text" id="fullname" placeholder="Full Name" class="w-full p-2 border border-gray-300 rounded mb-3 focus:outline-none focus:border-blue-500 hidden">
                <button id="submit-auth" class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition font-medium">Submit</button>
                <button id="cancel-auth" class="w-full mt-3 text-gray-500 hover:text-gray-700 text-sm">Cancel</button>
            </div>
            <div id="auth-message" class="mt-4 text-center text-sm min-h-[20px]"></div>
        </div>
    \`;

    document.getElementById('login-btn').addEventListener('click', () => showLoginForm());
    document.getElementById('register-btn').addEventListener('click', () => showRegisterForm());
    document.getElementById('cancel-auth').addEventListener('click', () => initApp());
    document.getElementById('submit-auth').addEventListener('click', handleAuthSubmit);
}

function showLoginForm() {
    const form = document.getElementById('auth-form');
    const fullname = document.getElementById('fullname');
    const submitBtn = document.getElementById('submit-auth');
    
    form.classList.remove('hidden');
    fullname.classList.add('hidden');
    fullname.removeAttribute('required');
    submitBtn.textContent = 'Login';
    document.getElementById('auth-message').textContent = '';
}

function showRegisterForm() {
    const form = document.getElementById('auth-form');
    const fullname = document.getElementById('fullname');
    const submitBtn = document.getElementById('submit-auth');
    
    form.classList.remove('hidden');
    fullname.classList.remove('hidden');
    fullname.setAttribute('required', 'true');
    submitBtn.textContent = 'Register';
    document.getElementById('auth-message').textContent = '';
}

async function handleAuthSubmit() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const fullName = document.getElementById('fullname').value.trim();
    const messageEl = document.getElementById('auth-message');
    const isRegister = !document.getElementById('fullname').classList.contains('hidden');

    if (!email || !password) {
        messageEl.textContent = 'Please fill in all required fields.';
        messageEl.className = 'mt-4 text-center text-sm text-red-600';
        return;
    }

    if (password.length < 6) {
        messageEl.textContent = 'Password must be at least 6 characters.';
        messageEl.className = 'mt-4 text-center text-sm text-red-600';
        return;
    }

    try {
        messageEl.textContent = 'Processing request...';
        messageEl.className = 'mt-4 text-center text-sm text-blue-600';

        if (isRegister) {
            if (!fullName) {
                messageEl.textContent = 'Please enter your full name.';
                messageEl.className = 'mt-4 text-center text-sm text-red-600';
                return;
            }
            await authService.signUp(email, password, fullName);
            messageEl.textContent = 'Registration successful. Please check your email to confirm your account.';
            messageEl.className = 'mt-4 text-center text-sm text-green-600';
            setTimeout(() => initApp(), 3000);
        } else {
            await authService.signIn(email, password);
            initApp();
        }
    } catch (err) {
        messageEl.textContent = 'Error: ' + err.message;
        messageEl.className = 'mt-4 text-center text-sm text-red-600';
    }
}

async function handleLogout() {
    await authService.signOut();
    initApp();
}

function showDashboard(container) {
    container.innerHTML = \`
        <div class="bg-white p-6 rounded-lg shadow-md">
            <h2 class="text-2xl font-bold mb-4 text-gray-800">Dashboard</h2>
            <p class="text-green-600 mb-6 font-medium">System is ready. You are successfully authenticated.</p>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div class="bg-blue-50 p-4 rounded border border-blue-200">
                    <h3 class="font-bold text-blue-900">Marketplace</h3>
                    <p class="text-sm text-blue-700 mt-1">Browse products and services.</p>
                </div>
                <div class="bg-green-50 p-4 rounded border border-green-200">
                    <h3 class="font-bold text-green-900">Orders</h3>
                    <p class="text-sm text-green-700 mt-1">Track your purchases.</p>
                </div>
                <div class="bg-purple-50 p-4 rounded border border-purple-200">
                    <h3 class="font-bold text-purple-900">Groups</h3>
                    <p class="text-sm text-purple-700 mt-1">Join communities and access benefits.</p>
                </div>
            </div>

            <div class="mt-8 p-4 bg-gray-50 rounded border border-gray-200">
                <h3 class="font-bold mb-2 text-gray-800">Development Progress</h3>
                <ul class="text-sm text-gray-700 space-y-1">
                    <li>[x] Sprint 1: Database Setup</li>
                    <li>[x] Sprint 2: Authentication</li>
                    <li>[ ] Sprint 3: Business & Product Management</li>
                    <li>[ ] Sprint 4: Shopping Cart & Orders</li>
                    <li>[ ] Sprint 5: Location & Groups</li>
                    <li>[ ] Sprint 6: Reviews & Real-time Updates</li>
                </ul>
            </div>
        </div>
    \`;
}

initApp();
`);

console.log('\nSprint 2 Update Complete.');
console.log('Next: Refresh your browser at http://localhost:3000');