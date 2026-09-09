const fs = require('fs');
const path = require('path');

function writeFile(filePath, content) {
    const fullPath = path.join(__dirname, filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, content);
    console.log('Updated: ' + filePath);
}

console.log('Updating Landing Page and Navigation...\n');

// 1. Update HTML to include a proper public header
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
        <!-- Header will be injected here -->
        <header id="main-header"></header>
        
        <!-- Main Content -->
        <main id="main-content" class="flex-grow">
            <p class="text-center text-gray-500 mt-10">Loading application...</p>
        </main>

        <!-- Footer -->
        <footer class="bg-gray-800 text-gray-300 py-8 mt-auto">
            <div class="max-w-6xl mx-auto px-4 text-center">
                <p>&copy; 2026 Integrated Platform POC. All rights reserved.</p>
            </div>
        </footer>
    </div>
    <script type="module" src="/src/main.js"></script>
</body>
</html>`);

// 2. Update Main App Logic with Landing Page
writeFile('src/main.js', `import './assets/css/style.css';
import { authService } from './services/auth.service.js';

let currentUser = null;

async function initApp() {
    const headerEl = document.getElementById('main-header');
    const contentEl = document.getElementById('main-content');

    try {
        const session = await authService.getSession();
        currentUser = session?.user || null;

        if (currentUser) {
            renderAuthenticatedHeader(headerEl);
            showDashboard(contentEl);
        } else {
            renderPublicHeader(headerEl);
            showLandingPage(contentEl);
        }
        
        // Attach global event listeners
        document.getElementById('nav-login-btn')?.addEventListener('click', () => showAuthModal('login'));
        document.getElementById('nav-register-btn')?.addEventListener('click', () => showAuthModal('register'));
        document.getElementById('nav-logout-btn')?.addEventListener('click', handleLogout);
        document.getElementById('close-modal-btn')?.addEventListener('click', closeAuthModal);
        
    } catch (err) {
        console.error("Init Error:", err);
        contentEl.innerHTML = '<p class="text-red-600 text-center mt-10">Error: ' + err.message + '</p>';
    }
}

// --- Header Renderers ---

function renderPublicHeader(headerEl) {
    headerEl.innerHTML = \`
        <div class="bg-white shadow">
            <div class="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">P</div>
                    <h1 class="text-xl font-bold text-gray-800">Platform POC</h1>
                </div>
                <div class="hidden md:flex flex-1 mx-8">
                    <input type="text" placeholder="Search businesses, products, or services..." class="w-full p-2 border border-gray-300 rounded-l focus:outline-none focus:border-blue-500">
                    <button class="bg-blue-600 text-white px-4 rounded-r hover:bg-blue-700">Search</button>
                </div>
                <div class="flex items-center gap-3">
                    <button id="nav-login-btn" class="text-gray-600 hover:text-blue-600 font-medium">Login</button>
                    <button id="nav-register-btn" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-medium transition">Register</button>
                </div>
            </div>
        </div>
    \`;
}

function renderAuthenticatedHeader(headerEl) {
    headerEl.innerHTML = \`
        <div class="bg-white shadow">
            <div class="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">P</div>
                    <h1 class="text-xl font-bold text-gray-800">Platform POC</h1>
                </div>
                <div class="hidden md:flex flex-1 mx-8">
                    <input type="text" placeholder="Search..." class="w-full p-2 border border-gray-300 rounded-l focus:outline-none focus:border-blue-500">
                    <button class="bg-blue-600 text-white px-4 rounded-r hover:bg-blue-700">Search</button>
                </div>
                <div class="flex items-center gap-4">
                    <span class="text-sm text-gray-600 hidden sm:inline">Welcome, \${currentUser.email.split('@')[0]}</span>
                    <button id="nav-logout-btn" class="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition">Logout</button>
                </div>
            </div>
        </div>
    \`;
}

// --- Page Renderers ---

function showLandingPage(container) {
    container.innerHTML = \`
        <!-- Hero Section -->
        <div class="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-20 px-4">
            <div class="max-w-6xl mx-auto text-center">
                <h2 class="text-4xl md:text-5xl font-bold mb-4">Your Community. Your Marketplace. Your Benefits.</h2>
                <p class="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">Connect with local businesses, join community groups, and unlock exclusive group benefits. Built for real users, powered by real connections.</p>
                <div class="flex flex-col sm:flex-row justify-center gap-4">
                    <button id="hero-register-btn" class="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 transition">Get Started</button>
                    <button class="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-white hover:text-gray-900 transition">Learn More</button>
                </div>
            </div>
        </div>

        <!-- Features Section -->
        <div class="max-w-6xl mx-auto px-4 py-16">
            <h3 class="text-3xl font-bold text-center mb-12 text-gray-800">How It Works</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="bg-white p-6 rounded-lg shadow-md text-center">
                    <div class="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">1</div>
                    <h4 class="text-xl font-bold mb-2">Join the Platform</h4>
                    <p class="text-gray-600">Register as a buyer or seller. Create your profile and join community groups.</p>
                </div>
                <div class="bg-white p-6 rounded-lg shadow-md text-center">
                    <div class="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">2</div>
                    <h4 class="text-xl font-bold mb-2">Discover & Connect</h4>
                    <p class="text-gray-600">Browse local businesses, find products, and connect with sellers near you.</p>
                </div>
                <div class="bg-white p-6 rounded-lg shadow-md text-center">
                    <div class="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">3</div>
                    <h4 class="text-xl font-bold mb-2">Unlock Benefits</h4>
                    <p class="text-gray-600">Access exclusive group discounts, bulk pricing, and community perks.</p>
                </div>
            </div>
        </div>
    \`;

    // Attach event listener for the hero button
    document.getElementById('hero-register-btn').addEventListener('click', () => showAuthModal('register'));
}

function showDashboard(container) {
    container.innerHTML = \`
        <div class="max-w-6xl mx-auto px-4 py-8">
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h2 class="text-2xl font-bold mb-4 text-gray-800">Dashboard</h2>
                <p class="text-green-600 mb-6 font-medium">System is ready. You are successfully authenticated.</p>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div class="bg-blue-50 p-4 rounded border border-blue-200 cursor-pointer hover:shadow-md transition">
                        <h3 class="font-bold text-blue-900">Marketplace</h3>
                        <p class="text-sm text-blue-700 mt-1">Browse products and services.</p>
                    </div>
                    <div class="bg-green-50 p-4 rounded border border-green-200 cursor-pointer hover:shadow-md transition">
                        <h3 class="font-bold text-green-900">Orders</h3>
                        <p class="text-sm text-green-700 mt-1">Track your purchases.</p>
                    </div>
                    <div class="bg-purple-50 p-4 rounded border border-purple-200 cursor-pointer hover:shadow-md transition">
                        <h3 class="font-bold text-purple-900">Groups</h3>
                        <p class="text-sm text-purple-700 mt-1">Join communities and access benefits.</p>
                    </div>
                </div>

                <div class="mt-8 p-4 bg-gray-50 rounded border border-gray-200">
                    <h3 class="font-bold mb-2 text-gray-800">Development Progress</h3>
                    <ul class="text-sm text-gray-700 space-y-1">
                        <li>[x] Sprint 1: Database Setup</li>
                        <li>[x] Sprint 2: Authentication</li>
                        <li>[x] Sprint 3: Landing Page & Navigation</li>
                        <li>[ ] Sprint 4: Business & Product Management</li>
                        <li>[ ] Sprint 5: Shopping Cart & Orders</li>
                        <li>[ ] Sprint 6: Location & Groups</li>
                    </ul>
                </div>
            </div>
        </div>
    \`;
}

// --- Auth Modal ---

function showAuthModal(type) {
    const modal = document.createElement('div');
    modal.id = 'auth-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = \`
        <div class="bg-white p-8 rounded-lg shadow-xl max-w-md w-full relative">
            <button id="close-modal-btn" class="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
            <h2 class="text-2xl font-bold mb-6 text-center text-gray-800">\${type === 'login' ? 'Login' : 'Create Account'}</h2>
            <div class="space-y-4">
                <input type="email" id="modal-email" placeholder="Email Address" class="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500" required>
                <input type="password" id="modal-password" placeholder="Password (min 6 characters)" class="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500" required>
                <input type="text" id="modal-fullname" placeholder="Full Name" class="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 \${type === 'login' ? 'hidden' : ''}">
                <button id="modal-submit-btn" class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition font-medium">\${type === 'login' ? 'Login' : 'Register'}</button>
            </div>
            <div id="modal-message" class="mt-4 text-center text-sm min-h-[20px]"></div>
            <div class="mt-4 text-center text-sm text-gray-600">
                \${type === 'login' ? "Don't have an account? " : "Already have an account? "}
                <button id="modal-toggle-btn" class="text-blue-600 hover:underline font-medium">\${type === 'login' ? 'Register' : 'Login'}</button>
            </div>
        </div>
    \`;
    document.body.appendChild(modal);

    document.getElementById('close-modal-btn').addEventListener('click', closeAuthModal);
    document.getElementById('modal-submit-btn').addEventListener('click', handleModalAuthSubmit);
    document.getElementById('modal-toggle-btn').addEventListener('click', () => {
        closeAuthModal();
        showAuthModal(type === 'login' ? 'register' : 'login');
    });
}

function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.remove();
}

async function handleModalAuthSubmit() {
    const email = document.getElementById('modal-email').value.trim();
    const password = document.getElementById('modal-password').value;
    const fullName = document.getElementById('modal-fullname').value.trim();
    const messageEl = document.getElementById('modal-message');
    const isRegister = !document.getElementById('modal-fullname').classList.contains('hidden');

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
        messageEl.textContent = 'Processing...';
        messageEl.className = 'mt-4 text-center text-sm text-blue-600';

        if (isRegister) {
            if (!fullName) {
                messageEl.textContent = 'Please enter your full name.';
                messageEl.className = 'mt-4 text-center text-sm text-red-600';
                return;
            }
            await authService.signUp(email, password, fullName);
            messageEl.textContent = 'Registration successful. Please check your email to confirm.';
            messageEl.className = 'mt-4 text-center text-sm text-green-600';
            setTimeout(() => { closeAuthModal(); initApp(); }, 3000);
        } else {
            await authService.signIn(email, password);
            closeAuthModal();
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

initApp();
`);

console.log('\nLanding Page Update Complete.');
console.log('Next: Refresh your browser at http://localhost:3000');