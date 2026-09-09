const fs = require('fs');
const path = require('path');

function writeFile(filePath, content) {
    const fullPath = path.join(__dirname, filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, content);
    console.log('Updated: ' + filePath);
}

console.log('Updating UI: Fonts and Navigation...\n');

// 1. Update HTML with Google Fonts
writeFile('index.html', `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Integrated Platform POC</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/src/assets/css/style.css">
</head>
<body class="bg-gray-50 text-gray-900">
    <div id="app" class="min-h-screen flex flex-col">
        <header id="main-header"></header>
        <main id="main-content" class="flex-grow">
            <p class="text-center text-gray-500 mt-10">Loading application...</p>
        </main>
        <footer class="bg-gray-800 text-gray-300 py-8 mt-auto">
            <div class="max-w-6xl mx-auto px-4 text-center">
                <p>&copy; 2026 Integrated Platform POC. All rights reserved.</p>
            </div>
        </footer>
    </div>
    <script type="module" src="/src/main.js"></script>
</body>
</html>`);

// 2. Update CSS with better typography
writeFile('src/assets/css/style.css', `@tailwind base;
@tailwind components;
@tailwind utilities;

body { 
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

h1, h2, h3, h4, h5, h6 {
    font-weight: 700;
    letter-spacing: -0.025em;
}

.font-display {
    font-weight: 800;
    letter-spacing: -0.025em;
}

.btn-primary {
    @apply bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition duration-200;
}

.btn-secondary {
    @apply bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition duration-200;
}

.card {
    @apply bg-white p-6 rounded-xl shadow-md border border-gray-100;
}

.card-hover {
    @apply hover:shadow-lg transition duration-200;
}
`);

// 3. Update Main App Logic
writeFile('src/main.js', `import './assets/css/style.css';
import { authService } from './services/auth.service.js';
import { businessService } from './services/business.service.js';
import { productService } from './services/product.service.js';

let currentUser = null;
let currentView = 'home';

async function initApp() {
    const headerEl = document.getElementById('main-header');
    const contentEl = document.getElementById('main-content');

    try {
        const session = await authService.getSession();
        currentUser = session?.user || null;

        if (currentUser) {
            renderAuthenticatedHeader(headerEl);
        } else {
            renderPublicHeader(headerEl);
        }
        
        renderView(contentEl, currentView);
        attachGlobalListeners();
        
    } catch (err) {
        console.error("Init Error:", err);
        contentEl.innerHTML = '<p class="text-red-600 text-center mt-10">Error: ' + err.message + '</p>';
    }
}

function attachGlobalListeners() {
    document.getElementById('nav-login-btn')?.addEventListener('click', () => showAuthModal('login'));
    document.getElementById('nav-register-btn')?.addEventListener('click', () => showAuthModal('register'));
    document.getElementById('nav-logout-btn')?.addEventListener('click', handleLogout);
    document.getElementById('close-modal-btn')?.addEventListener('click', closeAuthModal);
    
    document.getElementById('nav-home')?.addEventListener('click', (e) => { e.preventDefault(); navigateTo('home'); });
    document.getElementById('nav-dashboard')?.addEventListener('click', (e) => { e.preventDefault(); navigateTo('dashboard'); });
    document.getElementById('nav-marketplace')?.addEventListener('click', (e) => { e.preventDefault(); navigateTo('marketplace'); });
    document.getElementById('nav-my-business')?.addEventListener('click', (e) => { e.preventDefault(); navigateTo('my-business'); });
    document.getElementById('nav-add-product')?.addEventListener('click', (e) => { e.preventDefault(); navigateTo('add-product'); });
}

function navigateTo(view) {
    currentView = view;
    const contentEl = document.getElementById('main-content');
    renderView(contentEl, view);
    window.scrollTo(0, 0);
}

function renderView(container, view) {
    switch(view) {
        case 'home': showHeroSection(container); break;
        case 'dashboard': showDashboard(container); break;
        case 'marketplace': renderMarketplace(container); break;
        case 'my-business': renderMyBusiness(container); break;
        case 'add-product': renderAddProduct(container); break;
        default: showHeroSection(container);
    }
}

// --- Header Renderers ---

function renderPublicHeader(headerEl) {
    headerEl.innerHTML = \`
        <div class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
            <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                <div class="flex items-center gap-3 cursor-pointer" onclick="location.reload()">
                    <div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md">P</div>
                    <div>
                        <h1 class="text-xl font-bold text-gray-900 tracking-tight">Platform POC</h1>
                        <p class="text-xs text-gray-500">Integrated E-Commerce</p>
                    </div>
                </div>
                <div class="hidden md:flex flex-1 mx-8 max-w-xl">
                    <input type="text" placeholder="Search businesses, products, or services..." class="w-full p-2.5 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <button class="bg-blue-600 text-white px-6 rounded-r-lg hover:bg-blue-700 font-medium transition">Search</button>
                </div>
                <div class="flex items-center gap-3">
                    <button id="nav-login-btn" class="text-gray-700 hover:text-blue-600 font-medium px-4 py-2 transition">Login</button>
                    <button id="nav-register-btn" class="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 font-medium transition shadow-sm">Get Started</button>
                </div>
            </div>
        </div>
    \`;
}

function renderAuthenticatedHeader(headerEl) {
    headerEl.innerHTML = \`
        <div class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
            <div class="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
                <div class="flex items-center gap-3 cursor-pointer" onclick="document.getElementById('nav-home').click()">
                    <div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md">P</div>
                    <div>
                        <h1 class="text-xl font-bold text-gray-900 tracking-tight">Platform POC</h1>
                        <p class="text-xs text-gray-500">Welcome back</p>
                    </div>
                </div>
                <nav class="flex flex-wrap justify-center gap-1 text-sm font-medium">
                    <a href="#" id="nav-home" class="px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">Home</a>
                    <a href="#" id="nav-dashboard" class="px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">Dashboard</a>
                    <a href="#" id="nav-marketplace" class="px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">Marketplace</a>
                    <a href="#" id="nav-my-business" class="px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">My Business</a>
                    <a href="#" id="nav-add-product" class="px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">Add Product</a>
                </nav>
                <div class="flex items-center gap-4">
                    <div class="text-right hidden sm:block">
                        <p class="text-sm font-medium text-gray-900">\${currentUser.email.split('@')[0]}</p>
                        <p class="text-xs text-gray-500">Member</p>
                    </div>
                    <button id="nav-logout-btn" class="text-sm bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition font-medium">Logout</button>
                </div>
            </div>
        </div>
    \`;
}

// --- Page Renderers ---

function showHeroSection(container) {
    container.innerHTML = \`
        <!-- Hero Section -->
        <div class="bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white py-24 px-4">
            <div class="max-w-6xl mx-auto text-center">
                <div class="inline-block px-4 py-1.5 bg-blue-600/30 border border-blue-400/30 rounded-full text-blue-200 text-sm font-medium mb-6">
                    Now Serving Kenya
                </div>
                <h2 class="text-5xl md:text-6xl font-display mb-6 leading-tight">Your Community.<br/>Your Marketplace.<br/><span class="text-blue-400">Your Benefits.</span></h2>
                <p class="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">Connect with local businesses, join community groups, and unlock exclusive group benefits. Built for real users, powered by real connections.</p>
                <div class="flex flex-col sm:flex-row justify-center gap-4">
                    <button id="hero-register-btn" class="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition shadow-lg hover:shadow-xl">Get Started Free</button>
                    <button class="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-gray-900 transition">Learn More</button>
                </div>
                <div class="mt-12 flex justify-center gap-8 text-sm text-gray-400">
                    <div class="flex items-center gap-2">
                        <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                        <span>Free to join</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                        <span>Local businesses</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                        <span>Group discounts</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Features Section -->
        <div class="max-w-7xl mx-auto px-4 py-20">
            <h3 class="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">How It Works</h3>
            <p class="text-gray-600 text-center mb-16 max-w-2xl mx-auto">Join thousands of users already benefiting from our platform</p>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="bg-white p-8 rounded-2xl shadow-md border border-gray-100 text-center card-hover">
                    <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl font-bold shadow-lg">1</div>
                    <h4 class="text-2xl font-bold mb-3 text-gray-900">Join the Platform</h4>
                    <p class="text-gray-600 leading-relaxed">Register as a buyer or seller. Create your profile and join community groups.</p>
                </div>
                <div class="bg-white p-8 rounded-2xl shadow-md border border-gray-100 text-center card-hover">
                    <div class="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl font-bold shadow-lg">2</div>
                    <h4 class="text-2xl font-bold mb-3 text-gray-900">Discover & Connect</h4>
                    <p class="text-gray-600 leading-relaxed">Browse local businesses, find products, and connect with sellers near you.</p>
                </div>
                <div class="bg-white p-8 rounded-2xl shadow-md border border-gray-100 text-center card-hover">
                    <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl font-bold shadow-lg">3</div>
                    <h4 class="text-2xl font-bold mb-3 text-gray-900">Unlock Benefits</h4>
                    <p class="text-gray-600 leading-relaxed">Access exclusive group discounts, bulk pricing, and community perks.</p>
                </div>
            </div>
        </div>

        <!-- Stats Section -->
        <div class="bg-gray-50 py-16 border-t border-gray-200">
            <div class="max-w-7xl mx-auto px-4">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    <div>
                        <div class="text-4xl font-bold text-blue-600 mb-2">500+</div>
                        <div class="text-gray-600 font-medium">Businesses</div>
                    </div>
                    <div>
                        <div class="text-4xl font-bold text-green-600 mb-2">2,000+</div>
                        <div class="text-gray-600 font-medium">Products</div>
                    </div>
                    <div>
                        <div class="text-4xl font-bold text-purple-600 mb-2">1,500+</div>
                        <div class="text-gray-600 font-medium">Active Users</div>
                    </div>
                    <div>
                        <div class="text-4xl font-bold text-orange-600 mb-2">50+</div>
                        <div class="text-gray-600 font-medium">Communities</div>
                    </div>
                </div>
            </div>
        </div>
    \`;
    document.getElementById('hero-register-btn').addEventListener('click', () => showAuthModal('register'));
}

function showDashboard(container) {
    container.innerHTML = \`
        <div class="max-w-7xl mx-auto px-4 py-8">
            <div class="bg-white p-8 rounded-2xl shadow-md border border-gray-100">
                <h2 class="text-3xl font-bold mb-2 text-gray-900">Dashboard</h2>
                <p class="text-green-600 mb-8 font-medium">System is ready. You are successfully authenticated.</p>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 cursor-pointer hover:shadow-lg transition card-hover" onclick="document.getElementById('nav-marketplace').click()">
                        <h3 class="text-xl font-bold text-blue-900 mb-2">Marketplace</h3>
                        <p class="text-blue-700">Browse products and services.</p>
                    </div>
                    <div class="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200 cursor-pointer hover:shadow-lg transition card-hover" onclick="document.getElementById('nav-my-business').click()">
                        <h3 class="text-xl font-bold text-green-900 mb-2">My Business</h3>
                        <p class="text-green-700">Manage your business profile.</p>
                    </div>
                    <div class="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200 cursor-pointer hover:shadow-lg transition card-hover" onclick="document.getElementById('nav-add-product').click()">
                        <h3 class="text-xl font-bold text-purple-900 mb-2">Add Product</h3>
                        <p class="text-purple-700">List new items for sale.</p>
                    </div>
                </div>

                <div class="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                    <h3 class="font-bold mb-4 text-gray-900 text-lg">Development Progress</h3>
                    <ul class="text-sm text-gray-700 space-y-2">
                        <li class="flex items-center gap-2"><span class="text-green-600 font-bold">[x]</span> Sprint 1: Database Setup</li>
                        <li class="flex items-center gap-2"><span class="text-green-600 font-bold">[x]</span> Sprint 2: Authentication</li>
                        <li class="flex items-center gap-2"><span class="text-green-600 font-bold">[x]</span> Sprint 3: Landing Page & Navigation</li>
                        <li class="flex items-center gap-2"><span class="text-green-600 font-bold">[x]</span> Sprint 4: Business & Product Management</li>
                        <li class="flex items-center gap-2"><span class="text-yellow-600 font-bold">[ ]</span> Sprint 5: Shopping Cart & Orders</li>
                        <li class="flex items-center gap-2"><span class="text-yellow-600 font-bold">[ ]</span> Sprint 6: Location & Groups</li>
                    </ul>
                </div>
            </div>
        </div>
    \`;
}

async function renderMarketplace(container) {
    container.innerHTML = '<div class="max-w-7xl mx-auto px-4 py-8"><h2 class="text-3xl font-bold mb-2 text-gray-900">Marketplace</h2><p class="text-gray-500 mb-8">Discover products from local businesses</p><p class="text-gray-500">Loading products...</p></div>';
    
    try {
        const products = await productService.getAllActiveProducts();
        
        if (products.length === 0) {
            container.innerHTML = '<div class="max-w-7xl mx-auto px-4 py-8"><h2 class="text-3xl font-bold mb-2 text-gray-900">Marketplace</h2><p class="text-gray-500 mb-8">Discover products from local businesses</p><div class="text-center py-12 bg-white rounded-xl shadow-md"><p class="text-gray-500 mb-4">No products available yet.</p><button onclick="document.getElementById(\'nav-add-product\').click()" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Add First Product</button></div></div>';
            return;
        }

        let productsHtml = products.map(p => \`
            <div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden card-hover">
                <div class="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400">
                    <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                <div class="p-5">
                    <h3 class="font-bold text-lg text-gray-900 mb-1">\${p.name}</h3>
                    <p class="text-sm text-gray-600 mb-3">\${p.businesses?.name || 'Unknown Business'}</p>
                    <div class="flex justify-between items-center">
                        <p class="text-green-600 font-bold text-2xl">KES \${p.price}</p>
                        <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Stock: \${p.stock_quantity}</span>
                    </div>
                    <button class="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium">View Details</button>
                </div>
            </div>
        \`).join('');

        container.innerHTML = \`
            <div class="max-w-7xl mx-auto px-4 py-8">
                <h2 class="text-3xl font-bold mb-2 text-gray-900">Marketplace</h2>
                <p class="text-gray-600 mb-8">Discover products from local businesses</p>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    \${productsHtml}
                </div>
            </div>
        \`;
    } catch (err) {
        container.innerHTML = '<p class="text-red-600 text-center mt-10">Error loading products: ' + err.message + '</p>';
    }
}

async function renderMyBusiness(container) {
    container.innerHTML = '<div class="max-w-7xl mx-auto px-4 py-8"><h2 class="text-3xl font-bold mb-2 text-gray-900">My Business</h2><p class="text-gray-500">Loading...</p></div>';
    
    try {
        const businesses = await businessService.getMyBusinesses(currentUser.id);
        
        if (businesses.length === 0) {
            container.innerHTML = \`
                <div class="max-w-3xl mx-auto px-4 py-8">
                    <div class="bg-white p-8 rounded-2xl shadow-md border border-gray-100">
                        <h2 class="text-2xl font-bold mb-2 text-gray-900">Register Your Business</h2>
                        <p class="text-gray-600 mb-6">Create your business profile to start selling</p>
                        <form id="business-form" class="space-y-4">
                            <input type="text" id="biz-name" placeholder="Business Name" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                            <textarea id="biz-desc" placeholder="Description" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows="3" required></textarea>
                            <input type="text" id="biz-address" placeholder="Address / Location" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                            <select id="biz-category" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">Select Category</option>
                                <option value="Food & Beverages">Food & Beverages</option>
                                <option value="Retail">Retail</option>
                                <option value="Services">Services</option>
                                <option value="Agriculture">Agriculture</option>
                            </select>
                            <button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium transition">Register Business</button>
                        </form>
                        <div id="biz-message" class="mt-4 text-center text-sm"></div>
                    </div>
                </div>
            \`;
            document.getElementById('business-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const msgEl = document.getElementById('biz-message');
                msgEl.textContent = 'Registering...';
                msgEl.className = 'mt-4 text-center text-sm text-blue-600';
                
                try {
                    await businessService.createBusiness({
                        owner_id: currentUser.id,
                        name: document.getElementById('biz-name').value,
                        description: document.getElementById('biz-desc').value,
                        address: document.getElementById('biz-address').value,
                        category_id: null,
                        status: 'active'
                    });
                    msgEl.textContent = 'Business registered successfully!';
                    msgEl.className = 'mt-4 text-center text-sm text-green-600';
                    setTimeout(() => renderMyBusiness(container), 2000);
                } catch (err) {
                    msgEl.textContent = 'Error: ' + err.message;
                    msgEl.className = 'mt-4 text-center text-sm text-red-600';
                }
            });
            return;
        }

        let bizHtml = businesses.map(b => \`
            <div class="bg-white p-6 rounded-xl shadow-md border border-gray-200 mb-4 card-hover">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="text-xl font-bold text-gray-900">\${b.name}</h3>
                        <p class="text-gray-600 mt-2">\${b.description}</p>
                        <p class="text-sm text-gray-500 mt-2 flex items-center gap-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            \${b.address}
                        </p>
                    </div>
                    <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">\${b.status}</span>
                </div>
            </div>
        \`).join('');

        container.innerHTML = \`
            <div class="max-w-4xl mx-auto px-4 py-8">
                <h2 class="text-3xl font-bold mb-2 text-gray-900">My Businesses</h2>
                <p class="text-gray-600 mb-6">Manage your business profiles</p>
                \${bizHtml}
            </div>
        \`;

    } catch (err) {
        container.innerHTML = '<p class="text-red-600 text-center mt-10">Error: ' + err.message + '</p>';
    }
}

async function renderAddProduct(container) {
    const businesses = await businessService.getMyBusinesses(currentUser.id);
    
    if (businesses.length === 0) {
        container.innerHTML = \`
            <div class="max-w-2xl mx-auto px-4 py-8 text-center">
                <div class="bg-white p-8 rounded-2xl shadow-md border border-gray-100">
                    <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                    <h2 class="text-2xl font-bold mb-2 text-gray-900">No Business Found</h2>
                    <p class="text-gray-600 mb-6">You must register a business before adding products.</p>
                    <button id="go-to-biz-btn" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium transition">Register Business</button>
                </div>
            </div>
        \`;
        document.getElementById('go-to-biz-btn').addEventListener('click', () => navigateTo('my-business'));
        return;
    }

    container.innerHTML = \`
        <div class="max-w-2xl mx-auto px-4 py-8">
            <div class="bg-white p-8 rounded-2xl shadow-md border border-gray-100">
                <h2 class="text-2xl font-bold mb-2 text-gray-900">Add New Product</h2>
                <p class="text-gray-600 mb-6">List a new item in your marketplace</p>
                <form id="product-form" class="space-y-4">
                    <select id="prod-business" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        \${businesses.map(b => \`<option value="\${b.id}">\${b.name}</option>\`).join('')}
                    </select>
                    <input type="text" id="prod-name" placeholder="Product Name" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                    <textarea id="prod-desc" placeholder="Description" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows="3"></textarea>
                    <div class="grid grid-cols-2 gap-4">
                        <input type="number" id="prod-price" placeholder="Price (KES)" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required step="0.01">
                        <input type="number" id="prod-stock" placeholder="Stock Quantity" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                    </div>
                    <button type="submit" class="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium transition">Add Product</button>
                </form>
                <div id="prod-message" class="mt-4 text-center text-sm"></div>
            </div>
        </div>
    \`;

    document.getElementById('product-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const msgEl = document.getElementById('prod-message');
        msgEl.textContent = 'Adding product...';
        msgEl.className = 'mt-4 text-center text-sm text-blue-600';
        
        try {
            await productService.createProduct({
                business_id: document.getElementById('prod-business').value,
                name: document.getElementById('prod-name').value,
                description: document.getElementById('prod-desc').value,
                price: parseFloat(document.getElementById('prod-price').value),
                stock_quantity: parseInt(document.getElementById('prod-stock').value),
                is_active: true
            });
            msgEl.textContent = 'Product added successfully!';
            msgEl.className = 'mt-4 text-center text-sm text-green-600';
            document.getElementById('product-form').reset();
        } catch (err) {
            msgEl.textContent = 'Error: ' + err.message;
            msgEl.className = 'mt-4 text-center text-sm text-red-600';
        }
    });
}

// --- Auth Modal ---

function showAuthModal(type) {
    const modal = document.createElement('div');
    modal.id = 'auth-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = \`
        <div class="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full relative">
            <button id="close-modal-btn" class="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
            <h2 class="text-2xl font-bold mb-6 text-center text-gray-900">\${type === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
            <div class="space-y-4">
                <input type="email" id="modal-email" placeholder="Email Address" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                <input type="password" id="modal-password" placeholder="Password (min 6 characters)" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                <input type="text" id="modal-fullname" placeholder="Full Name" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 \${type === 'login' ? 'hidden' : ''}">
                <button id="modal-submit-btn" class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium">\${type === 'login' ? 'Login' : 'Register'}</button>
            </div>
            <div id="modal-message" class="mt-4 text-center text-sm min-h-[20px]"></div>
            <div class="mt-6 text-center text-sm text-gray-600">
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

console.log('\nUI Improvements Complete.');
console.log('Next: Refresh your browser at http://localhost:3000');