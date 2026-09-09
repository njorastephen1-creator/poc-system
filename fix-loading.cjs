const fs = require('fs');
const path = require('path');

function writeFile(filePath, content) {
    const fullPath = path.join(__dirname, filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, content);
    console.log('Fixed: ' + filePath);
}

console.log('Applying fix...\n');

writeFile('src/main.js', `import './assets/css/style.css';
import { authService } from './services/auth.service.js';
import { businessService } from './services/business.service.js';
import { productService } from './services/product.service.js';

let currentUser = null;
let currentView = 'home';

async function initApp() {
    const headerEl = document.getElementById('main-header');
    const contentEl = document.getElementById('main-content');

    if (!headerEl || !contentEl) {
        console.error('Required elements not found');
        return;
    }

    try {
        const session = await authService.getSession();
        currentUser = session?.user || null;

        if (currentUser) {
            renderAuthenticatedHeader(headerEl);
        } else {
            renderPublicHeader(headerEl);
        }
        
        renderView(contentEl, currentView);
        
        // Small delay to ensure DOM is ready
        setTimeout(() => attachGlobalListeners(), 100);
        
    } catch (err) {
        console.error("Init Error:", err);
        contentEl.innerHTML = '<div class="max-w-2xl mx-auto px-4 py-8"><div class="bg-red-50 p-6 rounded-lg border border-red-200"><h3 class="text-red-800 font-bold mb-2">Error Loading Application</h3><p class="text-red-600 text-sm">' + err.message + '</p></div></div>';
    }
}

function attachGlobalListeners() {
    // Navigation listeners with null checks
    const homeBtn = document.getElementById('nav-home');
    const dashboardBtn = document.getElementById('nav-dashboard');
    const marketplaceBtn = document.getElementById('nav-marketplace');
    const myBusinessBtn = document.getElementById('nav-my-business');
    const addProductBtn = document.getElementById('nav-add-product');
    const loginBtn = document.getElementById('nav-login-btn');
    const registerBtn = document.getElementById('nav-register-btn');
    const logoutBtn = document.getElementById('nav-logout-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    
    if (homeBtn) homeBtn.addEventListener('click', (e) => { e.preventDefault(); navigateTo('home'); });
    if (dashboardBtn) dashboardBtn.addEventListener('click', (e) => { e.preventDefault(); navigateTo('dashboard'); });
    if (marketplaceBtn) marketplaceBtn.addEventListener('click', (e) => { e.preventDefault(); navigateTo('marketplace'); });
    if (myBusinessBtn) myBusinessBtn.addEventListener('click', (e) => { e.preventDefault(); navigateTo('my-business'); });
    if (addProductBtn) addProductBtn.addEventListener('click', (e) => { e.preventDefault(); navigateTo('add-product'); });
    if (loginBtn) loginBtn.addEventListener('click', () => showAuthModal('login'));
    if (registerBtn) registerBtn.addEventListener('click', () => showAuthModal('register'));
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeAuthModal);
}

function navigateTo(view) {
    currentView = view;
    const contentEl = document.getElementById('main-content');
    if (contentEl) {
        renderView(contentEl, view);
        window.scrollTo(0, 0);
    }
}

function renderView(container, view) {
    try {
        switch(view) {
            case 'home': showHeroSection(container); break;
            case 'dashboard': showDashboard(container); break;
            case 'marketplace': renderMarketplace(container); break;
            case 'my-business': renderMyBusiness(container); break;
            case 'add-product': renderAddProduct(container); break;
            default: showHeroSection(container);
        }
    } catch (err) {
        console.error('Render error:', err);
        container.innerHTML = '<p class="text-red-600 text-center mt-10">Error rendering view: ' + err.message + '</p>';
    }
}

function renderPublicHeader(headerEl) {
    headerEl.innerHTML = '<div class="bg-white shadow-sm border-b border-gray-200"><div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center"><div class="flex items-center gap-3"><div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">P</div><h1 class="text-xl font-bold text-gray-900">Platform POC</h1></div><div class="flex items-center gap-3"><button id="nav-login-btn" class="text-gray-700 hover:text-blue-600 font-medium px-4 py-2">Login</button><button id="nav-register-btn" class="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 font-medium">Get Started</button></div></div></div>';
}

function renderAuthenticatedHeader(headerEl) {
    headerEl.innerHTML = '<div class="bg-white shadow-sm border-b border-gray-200"><div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center"><div class="flex items-center gap-3 cursor-pointer" id="nav-home"><div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">P</div><h1 class="text-xl font-bold text-gray-900">Platform POC</h1></div><nav class="flex gap-2 text-sm font-medium"><a href="#" id="nav-dashboard" class="px-3 py-2 text-gray-700 hover:text-blue-600">Dashboard</a><a href="#" id="nav-marketplace" class="px-3 py-2 text-gray-700 hover:text-blue-600">Marketplace</a><a href="#" id="nav-my-business" class="px-3 py-2 text-gray-700 hover:text-blue-600">My Business</a><a href="#" id="nav-add-product" class="px-3 py-2 text-gray-700 hover:text-blue-600">Add Product</a></nav><div class="flex items-center gap-4"><span class="text-sm text-gray-600">' + currentUser.email.split('@')[0] + '</span><button id="nav-logout-btn" class="text-sm bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">Logout</button></div></div></div>';
}

function showHeroSection(container) {
    container.innerHTML = '<div class="bg-gradient-to-br from-gray-900 to-blue-900 text-white py-20 px-4"><div class="max-w-6xl mx-auto text-center"><h2 class="text-4xl md:text-5xl font-bold mb-6">Your Community. Your Marketplace.</h2><p class="text-xl text-gray-300 mb-8">Connect with local businesses and unlock exclusive benefits.</p><button id="hero-register-btn" class="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-700">Get Started</button></div></div><div class="max-w-6xl mx-auto px-4 py-16"><h3 class="text-3xl font-bold text-center mb-12">How It Works</h3><div class="grid grid-cols-1 md:grid-cols-3 gap-8"><div class="bg-white p-6 rounded-xl shadow-md text-center"><div class="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div><h4 class="text-xl font-bold mb-2">Join Platform</h4><p class="text-gray-600">Register as buyer or seller</p></div><div class="bg-white p-6 rounded-xl shadow-md text-center"><div class="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div><h4 class="text-xl font-bold mb-2">Discover</h4><p class="text-gray-600">Browse businesses and products</p></div><div class="bg-white p-6 rounded-xl shadow-md text-center"><div class="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div><h4 class="text-xl font-bold mb-2">Get Benefits</h4><p class="text-gray-600">Access group discounts</p></div></div></div>';
    
    setTimeout(() => {
        const btn = document.getElementById('hero-register-btn');
        if (btn) btn.addEventListener('click', () => showAuthModal('register'));
    }, 100);
}

function showDashboard(container) {
    container.innerHTML = '<div class="max-w-6xl mx-auto px-4 py-8"><div class="bg-white p-6 rounded-xl shadow-md"><h2 class="text-2xl font-bold mb-4">Dashboard</h2><p class="text-green-600 mb-6">You are logged in successfully.</p><div class="grid grid-cols-1 md:grid-cols-3 gap-4"><div class="bg-blue-50 p-4 rounded-lg cursor-pointer hover:shadow-md" onclick="document.getElementById(\'nav-marketplace\').click()"><h3 class="font-bold text-blue-900">Marketplace</h3><p class="text-sm text-blue-700">Browse products</p></div><div class="bg-green-50 p-4 rounded-lg cursor-pointer hover:shadow-md" onclick="document.getElementById(\'nav-my-business\').click()"><h3 class="font-bold text-green-900">My Business</h3><p class="text-sm text-green-700">Manage business</p></div><div class="bg-purple-50 p-4 rounded-lg cursor-pointer hover:shadow-md" onclick="document.getElementById(\'nav-add-product\').click()"><h3 class="font-bold text-purple-900">Add Product</h3><p class="text-sm text-purple-700">List items</p></div></div></div></div>';
}

async function renderMarketplace(container) {
    container.innerHTML = '<div class="max-w-6xl mx-auto px-4 py-8"><h2 class="text-2xl font-bold mb-6">Marketplace</h2><p class="text-gray-500">Loading...</p></div>';
    
    try {
        const products = await productService.getAllActiveProducts();
        if (products.length === 0) {
            container.innerHTML = '<div class="max-w-6xl mx-auto px-4 py-8"><h2 class="text-2xl font-bold mb-6">Marketplace</h2><p class="text-gray-500">No products yet.</p></div>';
            return;
        }
        let html = products.map(p => '<div class="bg-white p-4 rounded-lg shadow border"><h3 class="font-bold">' + p.name + '</h3><p class="text-sm text-gray-600">' + (p.businesses?.name || 'Unknown') + '</p><p class="text-green-600 font-bold text-xl mt-2">KES ' + p.price + '</p></div>').join('');
        container.innerHTML = '<div class="max-w-6xl mx-auto px-4 py-8"><h2 class="text-2xl font-bold mb-6">Marketplace</h2><div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">' + html + '</div></div>';
    } catch (err) {
        container.innerHTML = '<p class="text-red-600 text-center mt-10">Error: ' + err.message + '</p>';
    }
}

async function renderMyBusiness(container) {
    try {
        const businesses = await businessService.getMyBusinesses(currentUser.id);
        if (businesses.length === 0) {
            container.innerHTML = '<div class="max-w-2xl mx-auto px-4 py-8"><div class="bg-white p-6 rounded-xl shadow-md"><h2 class="text-xl font-bold mb-4">Register Business</h2><form id="biz-form"><input type="text" id="biz-name" placeholder="Business Name" class="w-full p-2 border rounded mb-3" required><textarea id="biz-desc" placeholder="Description" class="w-full p-2 border rounded mb-3" required></textarea><input type="text" id="biz-address" placeholder="Address" class="w-full p-2 border rounded mb-3" required><button type="submit" class="w-full bg-blue-600 text-white py-2 rounded">Register</button></form><div id="biz-msg" class="mt-3 text-center text-sm"></div></div></div>';
            document.getElementById('biz-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const msg = document.getElementById('biz-msg');
                msg.textContent = 'Registering...';
                try {
                    await businessService.createBusiness({ owner_id: currentUser.id, name: document.getElementById('biz-name').value, description: document.getElementById('biz-desc').value, address: document.getElementById('biz-address').value, status: 'active' });
                    msg.textContent = 'Success!';
                    msg.className = 'mt-3 text-center text-sm text-green-600';
                    setTimeout(() => renderMyBusiness(container), 1500);
                } catch (err) {
                    msg.textContent = 'Error: ' + err.message;
                    msg.className = 'mt-3 text-center text-sm text-red-600';
                }
            });
        } else {
            let html = businesses.map(b => '<div class="bg-white p-6 rounded-xl shadow-md mb-4"><h3 class="text-xl font-bold">' + b.name + '</h3><p class="text-gray-600 mt-2">' + b.description + '</p><p class="text-sm text-gray-500">' + b.address + '</p></div>').join('');
            container.innerHTML = '<div class="max-w-4xl mx-auto px-4 py-8"><h2 class="text-2xl font-bold mb-6">My Businesses</h2>' + html + '</div>';
        }
    } catch (err) {
        container.innerHTML = '<p class="text-red-600">Error: ' + err.message + '</p>';
    }
}

async function renderAddProduct(container) {
    try {
        const businesses = await businessService.getMyBusinesses(currentUser.id);
        if (businesses.length === 0) {
            container.innerHTML = '<div class="max-w-2xl mx-auto px-4 py-8 text-center"><div class="bg-white p-6 rounded-xl shadow-md"><h2 class="text-xl font-bold mb-2">No Business</h2><p class="text-gray-600 mb-4">Register a business first.</p><button onclick="document.getElementById(\'nav-my-business\').click()" class="bg-blue-600 text-white px-6 py-2 rounded">Go to Business</button></div></div>';
            return;
        }
        container.innerHTML = '<div class="max-w-2xl mx-auto px-4 py-8"><div class="bg-white p-6 rounded-xl shadow-md"><h2 class="text-xl font-bold mb-4">Add Product</h2><form id="prod-form"><select id="prod-biz" class="w-full p-2 border rounded mb-3">' + businesses.map(b => '<option value="' + b.id + '">' + b.name + '</option>').join('') + '</select><input type="text" id="prod-name" placeholder="Product Name" class="w-full p-2 border rounded mb-3" required><textarea id="prod-desc" placeholder="Description" class="w-full p-2 border rounded mb-3"></textarea><div class="grid grid-cols-2 gap-3"><input type="number" id="prod-price" placeholder="Price (KES)" class="w-full p-2 border rounded" required step="0.01"><input type="number" id="prod-stock" placeholder="Stock" class="w-full p-2 border rounded" required></div><button type="submit" class="w-full bg-green-600 text-white py-2 rounded mt-3">Add Product</button></form><div id="prod-msg" class="mt-3 text-center text-sm"></div></div></div>';
        document.getElementById('prod-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const msg = document.getElementById('prod-msg');
            msg.textContent = 'Adding...';
            try {
                await productService.createProduct({ business_id: document.getElementById('prod-biz').value, name: document.getElementById('prod-name').value, description: document.getElementById('prod-desc').value, price: parseFloat(document.getElementById('prod-price').value), stock_quantity: parseInt(document.getElementById('prod-stock').value), is_active: true });
                msg.textContent = 'Success!';
                msg.className = 'mt-3 text-center text-sm text-green-600';
                document.getElementById('prod-form').reset();
            } catch (err) {
                msg.textContent = 'Error: ' + err.message;
                msg.className = 'mt-3 text-center text-sm text-red-600';
            }
        });
    } catch (err) {
        container.innerHTML = '<p class="text-red-600">Error: ' + err.message + '</p>';
    }
}

function showAuthModal(type) {
    const modal = document.createElement('div');
    modal.id = 'auth-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = '<div class="bg-white p-6 rounded-xl shadow-xl max-w-md w-full relative"><button id="close-modal-btn" class="absolute top-3 right-3 text-gray-500 text-xl">&times;</button><h2 class="text-xl font-bold mb-4 text-center">' + (type === 'login' ? 'Login' : 'Register') + '</h2><input type="email" id="modal-email" placeholder="Email" class="w-full p-2 border rounded mb-3" required><input type="password" id="modal-password" placeholder="Password" class="w-full p-2 border rounded mb-3" required><input type="text" id="modal-fullname" placeholder="Full Name" class="w-full p-2 border rounded mb-3 ' + (type === 'login' ? 'hidden' : '') + '"><button id="modal-submit" class="w-full bg-blue-600 text-white py-2 rounded">' + (type === 'login' ? 'Login' : 'Register') + '</button><div id="modal-msg" class="mt-3 text-center text-sm"></div></div>';
    document.body.appendChild(modal);
    
    document.getElementById('close-modal-btn').addEventListener('click', closeAuthModal);
    document.getElementById('modal-submit').addEventListener('click', handleModalAuth);
}

function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.remove();
}

async function handleModalAuth() {
    const email = document.getElementById('modal-email').value.trim();
    const password = document.getElementById('modal-password').value;
    const fullName = document.getElementById('modal-fullname')?.value.trim();
    const msg = document.getElementById('modal-msg');
    const isRegister = !document.getElementById('modal-fullname').classList.contains('hidden');

    if (!email || !password || (isRegister && !fullName)) {
        msg.textContent = 'Fill all fields';
        msg.className = 'mt-3 text-center text-sm text-red-600';
        return;
    }

    try {
        msg.textContent = 'Processing...';
        if (isRegister) {
            await authService.signUp(email, password, fullName);
            msg.textContent = 'Check email to confirm';
            msg.className = 'mt-3 text-center text-sm text-green-600';
            setTimeout(() => { closeAuthModal(); initApp(); }, 2000);
        } else {
            await authService.signIn(email, password);
            closeAuthModal();
            initApp();
        }
    } catch (err) {
        msg.textContent = 'Error: ' + err.message;
        msg.className = 'mt-3 text-center text-sm text-red-600';
    }
}

async function handleLogout() {
    await authService.signOut();
    initApp();
}

// Initialize
document.addEventListener('DOMContentLoaded', initApp);
if (document.readyState !== 'loading') initApp();
`);

console.log('\nFix applied successfully!');
console.log('Next: Refresh your browser at http://localhost:3000');