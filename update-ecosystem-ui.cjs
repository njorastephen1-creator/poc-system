const fs = require('fs');

console.log('[INFO] Updating UI for Professional Ecosystem...\n');

const mainJsContent = `import './assets/css/style.css';
import { authService } from './services/auth.service.js';
import { businessService } from './services/business.service.js';
import { productService } from './services/product.service.js';
import { orderService } from './services/order.service.js';
import { groupService } from './services/group.service.js';
import { profileService } from './services/profile.service.js';
import { chatService } from './services/chat.service.js';
import { supabase } from './config/supabase.client.js';

let currentUser = null;
let currentView = 'home';
let cart = [];
let userProfile = null;

const counties = ['Mombasa', 'Kwale', 'Kilifi', 'Tana River', 'Lamu', 'Taita-Taveta', 'Garissa', 'Wajir', 'Mandera', 'Marsabit', 'Isiolo', 'Meru', 'Tharaka-Nithi', 'Laikipia', 'Samburu', 'Turkana', 'West Pokot', 'Baringo', 'Uasin Gishu', 'Elgeyo-Marakwet', 'Nandi', 'Bomet', 'Kakamega', 'Vihiga', 'Bungoma', 'Busia', 'Siaya', 'Kisumu', 'Homa Bay', 'Migori', 'Kisii', 'Nyamira', 'Nairobi', 'Kiambu', 'Machakos', 'Makueni', 'Muranga', 'Nyeri', 'Kirinyaga', 'Nyandarua', 'Nakuru', 'Narok', 'Kajiado', 'Kericho', 'Trans-Nzoia', 'Kitui', 'Embu'];

async function initApp() {
    const headerEl = document.getElementById('main-header');
    const contentEl = document.getElementById('main-content');
    try {
        const session = await authService.getSession();
        currentUser = session?.user || null;
        if (currentUser) {
            renderAuthenticatedHeader(headerEl);
            userProfile = await profileService.getProfile(currentUser.id);
        } else {
            renderPublicHeader(headerEl);
        }
        renderView(contentEl, currentView);
        setTimeout(() => attachGlobalListeners(), 100);
    } catch (err) { 
        console.error('[ERROR] Init failed:', err); 
        contentEl.innerHTML = '<div class="p-8 text-center"><h2 class="text-xl font-bold text-red-600 mb-2">Application Error</h2><p class="text-gray-600">' + err.message + '</p></div>';
    }
}

function attachGlobalListeners() {
    const ids = ['nav-home', 'nav-dashboard', 'nav-marketplace', 'nav-map', 'nav-lets-connect', 'nav-profile', 'nav-my-business', 'nav-add-product', 'nav-cart', 'nav-orders', 'nav-login-btn', 'nav-register-btn', 'nav-logout-btn', 'close-modal-btn', 'hero-register-btn'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', (e) => { if (e) e.preventDefault(); handleNavigation(id); });
    });
}

function handleNavigation(id) {
    if (id === 'nav-home') navigateTo('home');
    else if (id === 'nav-dashboard') navigateTo('dashboard');
    else if (id === 'nav-marketplace') navigateTo('marketplace');
    else if (id === 'nav-map') navigateTo('map');
    else if (id === 'nav-lets-connect') navigateTo('lets-connect');
    else if (id === 'nav-profile') navigateTo('profile');
    else if (id === 'nav-my-business') navigateTo('my-business');
    else if (id === 'nav-add-product') navigateTo('add-product');
    else if (id === 'nav-cart') navigateTo('cart');
    else if (id === 'nav-orders') navigateTo('orders');
    else if (id === 'nav-login-btn') showAuthModal('login');
    else if (id === 'nav-register-btn') showAuthModal('register');
    else if (id === 'hero-register-btn') showAuthModal('register');
    else if (id === 'nav-logout-btn') handleLogout();
    else if (id === 'close-modal-btn') closeAuthModal();
}

function navigateTo(view) { 
    currentView = view; 
    const contentEl = document.getElementById('main-content'); 
    if (contentEl) { renderView(contentEl, view); window.scrollTo(0, 0); } 
}

function renderView(container, view) {
    try {
        if (view === 'home') showHeroSection(container);
        else if (view === 'dashboard') showDashboard(container);
        else if (view === 'marketplace') renderMarketplace(container);
        else if (view === 'map') renderMap(container);
        else if (view === 'lets-connect') renderLetsConnect(container);
        else if (view === 'profile') renderProfile(container);
        else if (view === 'my-business') renderMyBusiness(container);
        else if (view === 'add-product') renderAddProduct(container);
        else if (view === 'cart') renderCart(container);
        else if (view === 'checkout') renderCheckout(container);
        else if (view === 'orders') renderMyOrders(container);
        else showHeroSection(container);
    } catch (err) { container.innerHTML = '<div class="p-8 text-center text-red-600">Error: ' + err.message + '</div>'; }
}

function renderPublicHeader(headerEl) {
    headerEl.innerHTML = '<div class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40"><div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center"><div class="flex items-center gap-3"><div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">P</div><h1 class="text-xl font-bold text-gray-900">Platform POC</h1></div><div class="flex items-center gap-3"><button id="nav-login-btn" class="text-gray-700 hover:text-blue-600 font-medium px-4 py-2">Login</button><button id="nav-register-btn" class="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 font-medium">Get Started</button></div></div></div>';
}

function renderAuthenticatedHeader(headerEl) {
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    headerEl.innerHTML = '<div class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40"><div class="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4"><div class="flex items-center gap-3 cursor-pointer" id="nav-home"><div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">P</div><h1 class="text-xl font-bold text-gray-900">Platform POC</h1></div><nav class="flex flex-wrap justify-center gap-2 text-sm font-medium"><a href="#" id="nav-marketplace" class="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">Marketplace</a><a href="#" id="nav-map" class="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">Map</a><a href="#" id="nav-lets-connect" class="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">Let\\'s Connect</a><a href="#" id="nav-profile" class="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">Profile</a><a href="#" id="nav-cart" class="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">Cart (' + cartCount + ')</a><a href="#" id="nav-orders" class="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">Orders</a><a href="#" id="nav-my-business" class="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">Business</a></nav><div class="flex items-center gap-4"><span class="text-sm text-gray-600">' + currentUser.email.split('@')[0] + '</span><button id="nav-logout-btn" class="text-sm bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">Logout</button></div></div></div>';
}

function showHeroSection(container) {
    container.innerHTML = '<div class="bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white py-24 px-4"><div class="max-w-6xl mx-auto text-center"><div class="inline-block px-4 py-1.5 bg-blue-600/30 border border-blue-400/30 rounded-full text-blue-200 text-sm font-medium mb-6">Now Serving Kenya</div><h2 class="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">Your Community.<br/>Your Marketplace.<br/><span class="text-blue-400">Your Benefits.</span></h2><p class="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">Connect with local businesses, join community groups, and unlock exclusive group benefits.</p><div class="flex flex-col sm:flex-row justify-center gap-4"><button id="hero-register-btn" class="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition shadow-lg">Get Started Free</button></div></div></div>';
}

function showDashboard(container) {
    container.innerHTML = '<div class="max-w-7xl mx-auto px-4 py-8"><div class="bg-white p-8 rounded-2xl shadow-md border border-gray-100"><h2 class="text-3xl font-bold mb-2 text-gray-900">Dashboard</h2><p class="text-green-600 mb-8 font-medium">Welcome back, ' + currentUser.email.split('@')[0] + '!</p><div class="grid grid-cols-1 md:grid-cols-3 gap-6"><div class="bg-blue-50 p-6 rounded-xl border border-blue-200 cursor-pointer card-hover" id="dash-marketplace"><h3 class="text-xl font-bold text-blue-900 mb-2">Marketplace</h3><p class="text-blue-700">Browse products</p></div><div class="bg-green-50 p-6 rounded-xl border border-green-200 cursor-pointer card-hover" id="dash-business"><h3 class="text-xl font-bold text-green-900 mb-2">My Business</h3><p class="text-green-700">Manage profile</p></div><div class="bg-purple-50 p-6 rounded-xl border border-purple-200 cursor-pointer card-hover" id="dash-orders"><h3 class="text-xl font-bold text-purple-900 mb-2">My Orders</h3><p class="text-purple-700">Track purchases</p></div></div></div></div>';
    setTimeout(() => {
        const m = document.getElementById('dash-marketplace'); if(m) m.onclick = () => navigateTo('marketplace');
        const b = document.getElementById('dash-business'); if(b) b.onclick = () => navigateTo('my-business');
        const o = document.getElementById('dash-orders'); if(o) o.onclick = () => navigateTo('orders');
    }, 50);
}

// ==========================================
// PROFESSIONAL PROFILE UI (Point 4)
// ==========================================
async function renderProfile(container) {
    if (!userProfile) {
        userProfile = await profileService.getProfile(currentUser.id) || {};
    }
    
    const profile = userProfile || {};
    const businesses = profile.businesses || [];
    
    container.innerHTML = \`
        <div class="max-w-4xl mx-auto px-4 py-8">
            <!-- Profile Header -->
            <div class="bg-gradient-to-r from-blue-600 to-blue-800 rounded-t-2xl p-8 text-white text-center relative">
                <div class="w-24 h-24 bg-white rounded-full flex items-center justify-center text-3xl font-bold text-blue-600 mx-auto mb-4 border-4 border-white shadow-lg">
                    \${profile.avatar_url ? '<img src="' + profile.avatar_url + '" class="w-full h-full rounded-full object-cover">' : (profile.full_name || currentUser.email)[0].toUpperCase()}
                </div>
                <h1 class="text-3xl font-bold mb-2">\${profile.full_name || 'Your Name'}</h1>
                <p class="text-blue-100 text-lg mb-2">\${profile.headline || 'Professional Headline'}</p>
                <p class="text-blue-200 text-sm flex items-center justify-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    \${profile.location_text || 'Location not set'}
                </p>
                <div class="mt-6 flex justify-center gap-3">
                    <button onclick="window.editProfile()" class="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition">Edit Profile</button>
                    <button onclick="window.shareProfile()" class="bg-blue-700 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-800 transition border border-blue-500">Share</button>
                </div>
            </div>
            
            <!-- Profile Content -->
            <div class="bg-white rounded-b-2xl shadow-lg p-8">
                <!-- About Section -->
                <div class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">About</h2>
                    <p class="text-gray-600">\${profile.bio || 'No bio yet. Click Edit Profile to add one.'}</p>
                </div>
                
                <!-- Connected Businesses (Point 6) -->
                <div class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">My Businesses</h2>
                    \${businesses.length > 0 ? businesses.map(b => \`
                        <div class="border border-gray-200 rounded-lg p-4 mb-3 hover:shadow-md transition cursor-pointer" onclick="window.viewBusiness('\${b.id}')">
                            <div class="flex justify-between items-start">
                                <div>
                                    <h3 class="font-bold text-lg text-gray-900">\${b.name}</h3>
                                    <p class="text-sm text-gray-500">\${b.category || 'General Business'}</p>
                                </div>
                                <span class="px-3 py-1 rounded-full text-xs font-semibold \${b.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">\${b.status || 'open'}</span>
                            </div>
                            <p class="text-sm text-gray-600 mt-2">\${b.description || 'No description'}</p>
                        </div>
                    \`).join('') : '<p class="text-gray-500">No businesses connected yet.</p>'}
                </div>
            </div>
        </div>
    \`;
}

window.editProfile = () => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto';
    modal.innerHTML = \`
        <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8">
            <div class="p-6 border-b border-gray-200 flex justify-between items-center">
                <h3 class="text-2xl font-bold text-gray-900">Edit Professional Profile</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            <form id="edit-profile-form" class="p-6 space-y-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input type="text" id="edit-name" class="w-full p-2.5 border border-gray-300 rounded-lg" value="\${userProfile?.full_name || ''}" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Professional Headline</label>
                    <input type="text" id="edit-headline" class="w-full p-2.5 border border-gray-300 rounded-lg" placeholder="e.g., Agricultural Entrepreneur | Tomato Farmer" value="\${userProfile?.headline || ''}">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                    <textarea id="edit-bio" rows="3" class="w-full p-2.5 border border-gray-300 rounded-lg" placeholder="Tell people about yourself...">\${userProfile?.bio || ''}</textarea>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input type="text" id="edit-location" class="w-full p-2.5 border border-gray-300 rounded-lg" placeholder="e.g., Kiambu, Kenya" value="\${userProfile?.location_text || ''}">
                </div>
                <div class="flex gap-3 pt-4">
                    <button type="submit" class="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition">Save Changes</button>
                    <button type="button" onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-medium hover:bg-gray-300 transition">Cancel</button>
                </div>
            </form>
        </div>
    \`;
    document.body.appendChild(modal);
    
    document.getElementById('edit-profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.textContent = 'Saving...'; btn.disabled = true;
        
        try {
            const updates = {
                full_name: document.getElementById('edit-name').value,
                headline: document.getElementById('edit-headline').value,
                bio: document.getElementById('edit-bio').value,
                location_text: document.getElementById('edit-location').value
            };
            
            await profileService.updateProfile(currentUser.id, updates);
            userProfile = { ...userProfile, ...updates };
            modal.remove();
            renderProfile(document.getElementById('main-content'));
        } catch (err) {
            alert('Error: ' + err.message);
            btn.textContent = 'Save Changes'; btn.disabled = false;
        }
    });
};

window.shareProfile = () => {
    if (navigator.share) {
        navigator.share({ title: userProfile?.full_name || 'My Profile', url: window.location.href });
    } else {
        navigator.clipboard.writeText(window.location.href);
        alert('Profile link copied to clipboard!');
    }
};

// ==========================================
// LET'S CONNECT (Groups & Community)
// ==========================================
async function renderLetsConnect(container) {
    container.innerHTML = \`
        <div class="max-w-7xl mx-auto px-4 py-8">
            <h2 class="text-3xl font-bold mb-2 text-gray-900">Let's Connect</h2>
            <p class="text-gray-600 mb-8">Join communities, discover businesses, and unlock group benefits.</p>
            <div class="bg-white p-12 rounded-2xl shadow-md text-center">
                <p class="text-gray-500 mb-4">Group and Community features are being upgraded to the new ecosystem architecture.</p>
                <button onclick="navigateTo('profile')" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Go to Profile</button>
            </div>
        </div>
    \`;
}

// Stub functions for other views to prevent errors
async function renderMarketplace(container) { container.innerHTML = '<div class="max-w-7xl mx-auto px-4 py-8"><h2 class="text-3xl font-bold mb-2 text-gray-900">Marketplace</h2><p class="text-gray-500">Loading...</p></div>'; }
async function renderMap(container) { container.innerHTML = '<div class="max-w-7xl mx-auto px-4 py-8"><h2 class="text-3xl font-bold mb-2 text-gray-900">Map</h2><p class="text-gray-500">Loading...</p></div>'; }
async function renderMyBusiness(container) { container.innerHTML = '<div class="max-w-7xl mx-auto px-4 py-8"><h2 class="text-3xl font-bold mb-2 text-gray-900">My Business</h2><p class="text-gray-500">Loading...</p></div>'; }
async function renderAddProduct(container) { container.innerHTML = '<div class="max-w-7xl mx-auto px-4 py-8"><h2 class="text-3xl font-bold mb-2 text-gray-900">Add Product</h2><p class="text-gray-500">Loading...</p></div>'; }
function renderCart(container) { container.innerHTML = '<div class="max-w-7xl mx-auto px-4 py-8"><h2 class="text-3xl font-bold mb-2 text-gray-900">Cart</h2><p class="text-gray-500">Empty</p></div>'; }
function renderCheckout(container) { container.innerHTML = '<div class="max-w-7xl mx-auto px-4 py-8"><h2 class="text-3xl font-bold mb-2 text-gray-900">Checkout</h2></div>'; }
async function renderMyOrders(container) { container.innerHTML = '<div class="max-w-7xl mx-auto px-4 py-8"><h2 class="text-3xl font-bold mb-2 text-gray-900">Orders</h2><p class="text-gray-500">Loading...</p></div>'; }

function showAuthModal(type) {
    const modal = document.createElement('div'); modal.id = 'auth-modal'; modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = '<div class="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full relative"><button id="close-modal-btn" class="absolute top-3 right-3 text-gray-500 text-xl">&times;</button><h2 class="text-lg font-bold mb-4 text-center">' + (type === 'login' ? 'Login' : 'Register') + '</h2><div class="space-y-2"><input type="email" id="modal-email" placeholder="Email" class="w-full p-2.5 border border-gray-300 rounded-lg text-sm" required><input type="password" id="modal-password" placeholder="Password" class="w-full p-2.5 border border-gray-300 rounded-lg text-sm" required><input type="text" id="modal-fullname" placeholder="Full Name" class="w-full p-2.5 border border-gray-300 rounded-lg text-sm ' + (type === 'login' ? 'hidden' : '') + '"><button id="modal-submit" class="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium mt-2">' + (type === 'login' ? 'Login' : 'Register') + '</button></div><div id="modal-msg" class="mt-2 text-center text-xs"></div></div>';
    document.body.appendChild(modal);
    setTimeout(() => { document.getElementById('close-modal-btn').addEventListener('click', closeAuthModal); document.getElementById('modal-submit').addEventListener('click', () => handleModalAuth(type)); }, 50);
}

function closeAuthModal() { const modal = document.getElementById('auth-modal'); if (modal) modal.remove(); }

async function handleModalAuth(type) {
    const email = document.getElementById('modal-email').value.trim(); const password = document.getElementById('modal-password').value; const fullName = document.getElementById('modal-fullname')?.value.trim(); const msg = document.getElementById('modal-msg');
    if (!email || !password || (type === 'register' && !fullName)) { msg.textContent = 'Fill all fields'; msg.className = 'mt-2 text-center text-xs text-red-600'; return; }
    try { msg.textContent = 'Processing...';
        if (type === 'register') { await authService.signUp(email, password, fullName); msg.textContent = 'Success! Logging in...'; setTimeout(() => { closeAuthModal(); initApp(); }, 1000); }
        else { await authService.signIn(email, password); closeAuthModal(); initApp(); }
    } catch (err) { msg.textContent = 'Error: ' + err.message; msg.className = 'mt-2 text-center text-xs text-red-600'; }
}

async function handleLogout() { await authService.signOut(); cart = []; initApp(); }

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initApp); } else { initApp(); }`;

fs.writeFileSync('src/main.js', mainJsContent);
console.log('[SUCCESS] main.js updated with Professional Profile UI and Let\'s Connect.');
console.log('[COMPLETE] Hard refresh your browser (Ctrl + F5) to see the new ecosystem.');