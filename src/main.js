import './assets/css/style.css';
import { authService } from './services/auth.service.js';
import { businessService } from './services/business.service.js';
import { productService } from './services/product.service.js';
import { orderService } from './services/order.service.js';
import { groupService } from './services/group.service.js';
import { profileService } from './services/profile.service.js';
import { reviewService } from './services/profile.service.js';
import { supabase } from './config/supabase.client.js';

let currentUser = null;
let currentView = 'home';
let cart = [];
let userProfile = null;
window.currentGroupId = null;
window.currentGroupName = '';
window.replyingTo = null;

const counties = ['Mombasa', 'Kwale', 'Kilifi', 'Tana River', 'Lamu', 'Taita-Taveta', 'Garissa', 'Wajir', 'Mandera', 'Marsabit', 'Isiolo', 'Meru', 'Tharaka-Nithi', 'Laikipia', 'Samburu', 'Turkana', 'West Pokot', 'Baringo', 'Uasin Gishu', 'Elgeyo-Marakwet', 'Nandi', 'Bomet', 'Kakamega', 'Vihiga', 'Bungoma', 'Busia', 'Siaya', 'Kisumu', 'Homa Bay', 'Migori', 'Kisii', 'Nyamira', 'Nairobi', 'Kiambu', 'Machakos', 'Makueni', 'Muranga', 'Nyeri', 'Kirinyaga', 'Nyandarua', 'Nakuru', 'Narok', 'Kajiado', 'Kericho', 'Trans-Nzoia', 'Kitui', 'Embu'];
// Expose functions to global window object for inline onclick handlers
window.navigateTo = navigateTo;
window.showAuthModal = showAuthModal;
window.closeAuthModal = closeAuthModal;
window.handleLogout = handleLogout;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.editProfile = window.editProfile || (() => {}); // Fallback if not defined yet
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
        contentEl.innerHTML = '<div class="p-8 text-center"><h2 class="text-xl font-bold text-red-600 mb-2">Application Error</h2><p class="text-gray-600">' + err.message + '</p><button onclick="location.reload()" class="mt-4 bg-blue-600 text-white px-4 py-2 rounded">Reload</button></div>';
    }
}

function attachGlobalListeners() {
    const ids = ['nav-home', 'nav-dashboard', 'nav-marketplace', 'nav-map', 'nav-groups', 'nav-profile', 'nav-my-business', 'nav-add-product', 'nav-cart', 'nav-orders', 'nav-seller-orders', 'nav-login-btn', 'nav-register-btn', 'nav-logout-btn', 'close-modal-btn', 'hero-register-btn'];
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
    else if (id === 'nav-groups') navigateTo('groups'); // This renders "Let's Connect"
    else if (id === 'nav-profile') navigateTo('profile');
    else if (id === 'nav-my-business') navigateTo('my-business');
    else if (id === 'nav-add-product') navigateTo('add-product');
    else if (id === 'nav-cart') navigateTo('cart');
    else if (id === 'nav-orders') navigateTo('orders');
    else if (id === 'nav-seller-orders') navigateTo('seller-orders');
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
        else if (view === 'groups') renderGroups(container);
        else if (view === 'profile') renderProfessionalProfile(container);
        else if (view === 'my-business') renderMyBusiness(container);
        else if (view === 'add-product') renderAddProduct(container);
        else if (view === 'cart') renderCart(container);
        else if (view === 'checkout') renderCheckout(container);
        else if (view === 'orders') renderMyOrders(container);
        else if (view === 'seller-orders') renderSellerOrders(container);
        else showHeroSection(container);
    } catch (err) { container.innerHTML = '<div class="p-8 text-center text-red-600">Error: ' + err.message + '</div>'; }
}

function renderPublicHeader(headerEl) {
    headerEl.innerHTML = '<div class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40"><div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center"><div class="flex items-center gap-3"><div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">P</div><h1 class="text-xl font-bold text-gray-900">Platform POC</h1></div><div class="flex items-center gap-3"><button id="nav-login-btn" class="text-gray-700 hover:text-blue-600 font-medium px-4 py-2">Login</button><button id="nav-register-btn" class="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 font-medium">Get Started</button></div></div></div>';
}

function renderAuthenticatedHeader(headerEl) {
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    // UPDATED: Changed "Groups" to "Let's Connect"
    headerEl.innerHTML = '<div class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40"><div class="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4"><div class="flex items-center gap-3 cursor-pointer" id="nav-home"><div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">P</div><h1 class="text-xl font-bold text-gray-900">Platform POC</h1></div><nav class="flex flex-wrap justify-center gap-2 text-sm font-medium"><a href="#" id="nav-marketplace" class="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">Marketplace</a><a href="#" id="nav-map" class="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">Map</a><a href="#" id="nav-groups" class="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">Let\'s Connect</a><a href="#" id="nav-profile" class="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">Profile</a><a href="#" id="nav-cart" class="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">Cart (' + cartCount + ')</a><a href="#" id="nav-orders" class="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">Orders</a><a href="#" id="nav-my-business" class="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">Business</a></nav><div class="flex items-center gap-4"><span class="text-sm text-gray-600">' + currentUser.email.split('@')[0] + '</span><button id="nav-logout-btn" class="text-sm bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">Logout</button></div></div></div>';
}

function showHeroSection(container) {
    container.innerHTML = '<div class="bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white py-24 px-4"><div class="max-w-6xl mx-auto text-center"><div class="inline-block px-4 py-1.5 bg-blue-600/30 border border-blue-400/30 rounded-full text-blue-200 text-sm font-medium mb-6">Now Serving Kenya</div><h2 class="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">Your Community.<br/>Your Marketplace.<br/><span class="text-blue-400">Your Benefits.</span></h2><p class="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">Connect with local businesses, join community groups, and unlock exclusive group benefits.</p><div class="flex flex-col sm:flex-row justify-center gap-4"><button id="hero-register-btn" class="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition shadow-lg">Get Started Free</button></div></div></div><div class="max-w-7xl mx-auto px-4 py-20"><h3 class="text-3xl font-bold text-center mb-12 text-gray-900">How It Works</h3><div class="grid grid-cols-1 md:grid-cols-3 gap-8"><div class="bg-white p-8 rounded-2xl shadow-md border border-gray-100 text-center card-hover"><div class="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl font-bold">1</div><h4 class="text-2xl font-bold mb-3">Join Platform</h4><p class="text-gray-600">Register as buyer or seller</p></div><div class="bg-white p-8 rounded-2xl shadow-md border border-gray-100 text-center card-hover"><div class="w-16 h-16 bg-green-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl font-bold">2</div><h4 class="text-2xl font-bold mb-3">Discover</h4><p class="text-gray-600">Browse businesses and products</p></div><div class="bg-white p-8 rounded-2xl shadow-md border border-gray-100 text-center card-hover"><div class="w-16 h-16 bg-purple-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl font-bold">3</div><h4 class="text-2xl font-bold mb-3">Get Benefits</h4><p class="text-gray-600">Access group discounts</p></div></div></div>';
}

function showDashboard(container) {
    container.innerHTML = '<div class="max-w-7xl mx-auto px-4 py-8"><div class="bg-white p-8 rounded-2xl shadow-md border border-gray-100"><h2 class="text-3xl font-bold mb-2 text-gray-900">Dashboard</h2><p class="text-green-600 mb-8 font-medium">Welcome back, ' + currentUser.email.split('@')[0] + '!</p><div class="grid grid-cols-1 md:grid-cols-3 gap-6"><div class="bg-blue-50 p-6 rounded-xl border border-blue-200 cursor-pointer card-hover" id="dash-marketplace"><h3 class="text-xl font-bold text-blue-900 mb-2">Marketplace</h3><p class="text-blue-700">Browse products</p></div><div class="bg-green-50 p-6 rounded-xl border border-green-200 cursor-pointer card-hover" id="dash-business"><h3 class="text-xl font-bold text-green-900 mb-2">My Business</h3><p class="text-green-700">Manage profile</p></div><div class="bg-purple-50 p-6 rounded-xl border border-purple-200 cursor-pointer card-hover" id="dash-orders"><h3 class="text-xl font-bold text-purple-900 mb-2">My Orders</h3><p class="text-purple-700">Track purchases</p></div></div></div></div>';
    setTimeout(() => {
        const m = document.getElementById('dash-marketplace'); if(m) m.onclick = () => navigateTo('marketplace');
        const b = document.getElementById('dash-business'); if(b) b.onclick = () => navigateTo('my-business');
        const o = document.getElementById('dash-orders'); if(o) o.onclick = () => navigateTo('orders');
    }, 50);
}

async function renderMarketplace(container) {
    container.innerHTML = '<div class="max-w-7xl mx-auto px-4 py-8"><h2 class="text-3xl font-bold mb-2 text-gray-900">Marketplace</h2><p class="text-gray-500 mb-8">Loading products...</p></div>';
    try {
        const products = await productService.getAllActiveProducts();
        if (products.length === 0) { container.innerHTML = '<div class="max-w-7xl mx-auto px-4 py-8"><h2 class="text-3xl font-bold mb-2 text-gray-900">Marketplace</h2><div class="bg-white p-12 rounded-xl shadow-md text-center"><p class="text-gray-500 mb-4">No products available yet.</p></div></div>'; return; }
        let html = products.map(p => {
            const inCart = cart.find(item => item.product_id === p.id);
            const imgHtml = p.image_url ? '<img src="' + p.image_url + '" class="w-full h-48 object-cover">' : '<div class="h-48 bg-gray-100 flex items-center justify-center text-gray-400"><svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
            return '<div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden card-hover">' + imgHtml + '<div class="p-5"><h3 class="font-bold text-lg text-gray-900 mb-1">' + p.name + '</h3><p class="text-xs text-blue-600 mb-2 font-medium">' + (p.category_name || 'General') + '</p><p class="text-sm text-gray-600 mb-3">' + (p.businesses?.name || 'Unknown Business') + '</p><div class="flex justify-between items-center mb-4"><p class="text-green-600 font-bold text-2xl">KES ' + p.price + '</p><span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Stock: ' + p.stock_quantity + '</span></div><button class="add-to-cart-btn w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium" data-id="' + p.id + '" data-name="' + p.name + '" data-price="' + p.price + '">' + (inCart ? 'In Cart (' + inCart.quantity + ')' : 'Add to Cart') + '</button></div></div>';
        }).join('');
        container.innerHTML = '<div class="max-w-7xl mx-auto px-4 py-8"><h2 class="text-3xl font-bold mb-2 text-gray-900">Marketplace</h2><p class="text-gray-600 mb-8">Discover products from local businesses</p><div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">' + html + '</div></div>';
        setTimeout(() => { document.querySelectorAll('.add-to-cart-btn').forEach(btn => { btn.addEventListener('click', () => addToCart(btn.getAttribute('data-id'), btn.getAttribute('data-name'), parseFloat(btn.getAttribute('data-price')))); }); }, 100);
    } catch (err) { container.innerHTML = '<p class="text-red-600 text-center mt-10">Error: ' + err.message + '</p>'; }
}

function addToCart(productId, name, price) {
    const existing = cart.find(item => item.product_id === productId);
    if (existing) existing.quantity += 1; else cart.push({ product_id: productId, name: name, price: price, quantity: 1 });
    renderAuthenticatedHeader(document.getElementById('main-header')); attachGlobalListeners();
    if (currentView === 'marketplace') renderMarketplace(document.getElementById('main-content'));
    if (currentView === 'cart') renderCart(document.getElementById('main-content'));
}

function removeFromCart(productId) { cart = cart.filter(item => item.product_id !== productId); renderAuthenticatedHeader(document.getElementById('main-header')); attachGlobalListeners(); renderCart(document.getElementById('main-content')); }

function renderCart(container) {
    if (cart.length === 0) { container.innerHTML = '<div class="max-w-4xl mx-auto px-4 py-8"><div class="bg-white p-12 rounded-2xl shadow-md text-center"><h2 class="text-2xl font-bold mb-4 text-gray-900">Your Cart is Empty</h2><button id="go-marketplace" class="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium mt-4">Go to Marketplace</button></div></div>'; setTimeout(() => { document.getElementById('go-marketplace').onclick = () => navigateTo('marketplace'); }, 100); return; }
    let total = 0;
    let html = cart.map(item => { const subtotal = item.price * item.quantity; total += subtotal; return '<div class="flex justify-between items-center py-4 border-b border-gray-100"><div><h3 class="font-bold text-gray-900">' + item.name + '</h3><p class="text-sm text-gray-500">KES ' + item.price + ' x ' + item.quantity + '</p></div><div class="flex items-center gap-4"><span class="font-bold text-gray-900">KES ' + subtotal + '</span><button class="remove-btn text-red-500 hover:text-red-700 text-sm" data-id="' + item.product_id + '">Remove</button></div></div>'; }).join('');
    container.innerHTML = '<div class="max-w-4xl mx-auto px-4 py-8"><h2 class="text-3xl font-bold mb-6 text-gray-900">Shopping Cart</h2><div class="bg-white p-6 rounded-2xl shadow-md border border-gray-100">' + html + '<div class="mt-6 flex justify-between items-center text-xl font-bold text-gray-900"><span>Total:</span><span>KES ' + total + '</span></div><div class="mt-6 flex justify-end gap-4"><button id="clear-cart" class="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">Clear Cart</button><button id="go-checkout" class="bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 font-medium">Proceed to Checkout</button></div></div></div>';
    setTimeout(() => { document.querySelectorAll('.remove-btn').forEach(btn => { btn.addEventListener('click', () => removeFromCart(btn.getAttribute('data-id'))); }); document.getElementById('clear-cart').onclick = () => { cart = []; renderAuthenticatedHeader(document.getElementById('main-header')); attachGlobalListeners(); renderCart(container); }; document.getElementById('go-checkout').onclick = () => navigateTo('checkout'); }, 100);
}

function renderCheckout(container) {
    if (cart.length === 0) { navigateTo('cart'); return; }
    let total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    container.innerHTML = '<div class="max-w-2xl mx-auto px-4 py-8"><div class="bg-white p-8 rounded-2xl shadow-md border border-gray-100"><h2 class="text-2xl font-bold mb-2 text-gray-900">Checkout</h2><p class="text-gray-600 mb-6">Order Total: <span class="font-bold text-green-600 text-xl">KES ' + total + '</span></p><form id="checkout-form" class="space-y-4"><textarea id="delivery-info" placeholder="Delivery Address and Instructions" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows="3" required></textarea><button type="submit" class="w-full bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 font-medium transition">Place Order</button></form><div id="checkout-msg" class="mt-4 text-center text-sm"></div></div></div>';
    setTimeout(() => { document.getElementById('checkout-form').addEventListener('submit', async (e) => { e.preventDefault(); const msg = document.getElementById('checkout-msg'); msg.textContent = 'Processing order...'; msg.className = 'mt-4 text-center text-sm text-blue-600'; try { await orderService.createOrder({ buyer_id: currentUser.id, total_amount: total, payment_status: 'pending', order_status: 'pending', delivery_info: { address: document.getElementById('delivery-info').value } }, cart); cart = []; msg.textContent = 'Order placed successfully!'; msg.className = 'mt-4 text-center text-sm text-green-600'; renderAuthenticatedHeader(document.getElementById('main-header')); attachGlobalListeners(); setTimeout(() => navigateTo('orders'), 1500); } catch (err) { msg.textContent = 'Error: ' + err.message; msg.className = 'mt-4 text-center text-sm text-red-600'; } }); }, 100);
}

async function renderMyOrders(container) {
    container.innerHTML = '<div class="max-w-4xl mx-auto px-4 py-8"><h2 class="text-3xl font-bold mb-2 text-gray-900">My Orders</h2><p class="text-gray-500">Loading...</p></div>';
    try {
        const orders = await orderService.getOrdersByBuyer(currentUser.id);
        if (orders.length === 0) { container.innerHTML = '<div class="max-w-4xl mx-auto px-4 py-8"><div class="bg-white p-12 rounded-2xl shadow-md text-center"><h2 class="text-2xl font-bold mb-4 text-gray-900">No Orders Yet</h2></div></div>'; return; }
        let html = orders.map(o => { const items = o.order_items.map(i => '<li class="text-sm text-gray-600">' + i.quantity + 'x ' + i.products.name + ' (KES ' + i.unit_price + ')</li>').join(''); const statusColor = o.order_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : o.order_status === 'confirmed' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'; return '<div class="bg-white p-6 rounded-xl shadow-md border border-gray-200 mb-4"><div class="flex justify-between items-start mb-4"><div><h3 class="font-bold text-gray-900">Order #' + o.id.substring(0, 8) + '</h3><p class="text-xs text-gray-500">' + new Date(o.created_at).toLocaleDateString() + '</p></div><span class="px-3 py-1 rounded-full text-xs font-semibold ' + statusColor + '">' + o.order_status + '</span></div><ul class="mb-4 space-y-1">' + items + '</ul><div class="flex justify-between items-center border-t border-gray-100 pt-4"><span class="font-bold text-gray-900">Total: KES ' + o.total_amount + '</span></div></div>'; }).join('');
        container.innerHTML = '<div class="max-w-4xl mx-auto px-4 py-8"><h2 class="text-3xl font-bold mb-2 text-gray-900">My Orders</h2><p class="text-gray-600 mb-6">Track your purchases</p>' + html + '</div>';
    } catch (err) { container.innerHTML = '<p class="text-red-600 text-center mt-10">Error: ' + err.message + '</p>'; }
}

async function renderSellerOrders(container) {
    container.innerHTML = '<div class="max-w-4xl mx-auto px-4 py-8"><h2 class="text-3xl font-bold mb-2 text-gray-900">Seller Orders</h2><p class="text-gray-500">Loading...</p></div>';
    try {
        const orders = await orderService.getOrdersForSeller(currentUser.id);
        if (orders.length === 0) { container.innerHTML = '<div class="max-w-4xl mx-auto px-4 py-8"><div class="bg-white p-12 rounded-2xl shadow-md text-center"><h2 class="text-2xl font-bold mb-4 text-gray-900">No Incoming Orders</h2></div></div>'; return; }
        let html = orders.map(o => { const items = o.order_items.map(i => '<li class="text-sm text-gray-600">' + i.quantity + 'x ' + i.products.name + '</li>').join(''); const buyerName = o.buyer?.[0]?.full_name || 'Unknown'; return '<div class="bg-white p-6 rounded-xl shadow-md border border-gray-200 mb-4"><div class="flex justify-between items-start mb-4"><div><h3 class="font-bold text-gray-900">Order #' + o.id.substring(0, 8) + '</h3><p class="text-sm text-gray-600">Buyer: ' + buyerName + '</p></div><span class="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">' + o.order_status + '</span></div><ul class="mb-4 space-y-1">' + items + '</ul><div class="flex justify-end"><select class="update-status border border-gray-300 rounded px-3 py-1 text-sm" data-id="' + o.id + '"><option value="pending" ' + (o.order_status === 'pending' ? 'selected' : '') + '>Pending</option><option value="confirmed" ' + (o.order_status === 'confirmed' ? 'selected' : '') + '>Confirmed</option><option value="delivered" ' + (o.order_status === 'delivered' ? 'selected' : '') + '>Delivered</option></select></div></div>'; }).join('');
        container.innerHTML = '<div class="max-w-4xl mx-auto px-4 py-8"><h2 class="text-3xl font-bold mb-2 text-gray-900">Seller Orders</h2><p class="text-gray-600 mb-6">Manage incoming orders</p>' + html + '</div>';
        setTimeout(() => { document.querySelectorAll('.update-status').forEach(select => { select.addEventListener('change', async (e) => { try { await orderService.updateOrderStatus(select.getAttribute('data-id'), select.value); renderSellerOrders(container); } catch (err) { alert('Error: ' + err.message); } }); }); }, 100);
    } catch (err) { container.innerHTML = '<p class="text-red-600 text-center mt-10">Error: ' + err.message + '</p>'; }
}

async function renderMyBusiness(container) {
    container.innerHTML = '<div class="max-w-7xl mx-auto px-4 py-8"><h2 class="text-3xl font-bold mb-2 text-gray-900">My Business</h2><p class="text-gray-500">Loading...</p></div>';
    try {
        const businesses = await businessService.getMyBusinesses(currentUser.id);
        if (businesses.length === 0) {
            const countyOptions = counties.map(c => '<option value="' + c + '">' + c + '</option>').join('');
            container.innerHTML = '<div class="max-w-2xl mx-auto px-4 py-8"><div class="bg-white p-6 rounded-xl shadow-md border border-gray-100"><h2 class="text-xl font-bold mb-4 text-gray-900">Register Your Business</h2><form id="biz-form" class="space-y-3"><input type="text" id="biz-name" placeholder="Business Name" class="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required><textarea id="biz-desc" placeholder="Description" class="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" rows="2" required></textarea><select id="biz-county" class="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required><option value="">Select County</option>' + countyOptions + '</select><input type="text" id="biz-address" placeholder="Address / Location" class="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required><div class="grid grid-cols-2 gap-3"><select id="biz-days" class="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required><option value="">Opening Days</option><option value="Mon-Fri">Mon - Fri</option><option value="Mon-Sat">Mon - Sat</option><option value="Mon-Sun">Mon - Sun</option></select><select id="biz-hours" class="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required><option value="">Hours</option><option value="8AM-5PM">8AM - 5PM</option><option value="9AM-6PM">9AM - 6PM</option><option value="24/7">24/7</option><option value="Flexible">Flexible</option></select></div><button type="submit" class="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 mt-2">Register Business</button></form><div id="biz-msg" class="mt-3 text-center text-xs"></div></div></div>';
            setTimeout(() => { document.getElementById('biz-form').addEventListener('submit', async (e) => { e.preventDefault(); const msg = document.getElementById('biz-msg'); msg.textContent = 'Registering...'; try { await businessService.createBusiness({ owner_id: currentUser.id, name: document.getElementById('biz-name').value, description: document.getElementById('biz-desc').value, address: document.getElementById('biz-address').value, county: document.getElementById('biz-county').value, opening_days: document.getElementById('biz-days').value, business_hours: document.getElementById('biz-hours').value, status: 'active' }); msg.textContent = 'Success!'; msg.className = 'mt-3 text-center text-xs text-green-600'; setTimeout(() => renderMyBusiness(container), 1000); } catch (err) { msg.textContent = 'Error: ' + err.message; msg.className = 'mt-3 text-center text-xs text-red-600'; } }); }, 100);
        } else {
            let html = businesses.map(b => '<div class="bg-white p-6 rounded-xl shadow-md border border-gray-200 mb-4 card-hover"><h3 class="text-xl font-bold text-gray-900">' + b.name + '</h3><p class="text-gray-600 mt-2">' + b.description + '</p><p class="text-sm text-gray-500 mt-2">' + (b.county || '') + ' - ' + (b.address || '') + '</p>' + (b.opening_days ? '<p class="text-sm text-gray-500 mt-1">Open: ' + b.opening_days + ' (' + b.business_hours + ')</p>' : '') + '<span class="inline-block mt-3 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">' + b.status + '</span></div>').join('');
            container.innerHTML = '<div class="max-w-4xl mx-auto px-4 py-8"><h2 class="text-3xl font-bold mb-2 text-gray-900">My Businesses</h2><p class="text-gray-600 mb-6">Manage your business profiles</p>' + html + '</div>';
        }
    } catch (err) { container.innerHTML = '<p class="text-red-600 text-center mt-10">Error: ' + err.message + '</p>'; }
}

async function renderAddProduct(container) {
    try {
        const businesses = await businessService.getMyBusinesses(currentUser.id);
        if (businesses.length === 0) { container.innerHTML = '<div class="max-w-2xl mx-auto px-4 py-8 text-center"><div class="bg-white p-8 rounded-2xl shadow-md border border-gray-100"><h2 class="text-2xl font-bold mb-2 text-gray-900">No Business Found</h2><p class="text-gray-600 mb-6">You must register a business before adding products.</p><button id="go-biz-btn" class="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium">Register Business</button></div></div>'; setTimeout(() => { document.getElementById('go-biz-btn').onclick = () => navigateTo('my-business'); }, 100); return; }
        const categories = ['Food & Beverages', 'Retail', 'Services', 'Agriculture', 'Electronics', 'Fashion'];
        const categoryOptions = categories.map(c => '<option value="' + c + '">' + c + '</option>').join('');
        const businessOptions = businesses.map(b => '<option value="' + b.id + '">' + b.name + '</option>').join('');
        container.innerHTML = '<div class="max-w-2xl mx-auto px-4 py-8"><div class="bg-white p-6 rounded-xl shadow-md border border-gray-100"><h2 class="text-xl font-bold mb-4 text-gray-900">Add New Product</h2><form id="prod-form" class="space-y-3"><div><label class="block text-xs font-medium text-gray-700 mb-1">Business</label><select id="prod-biz" class="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required>' + businessOptions + '</select></div><div><label class="block text-xs font-medium text-gray-700 mb-1">Product Name</label><input type="text" id="prod-name" placeholder="e.g., Fresh Tomatoes" class="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required></div><div><label class="block text-xs font-medium text-gray-700 mb-1">Category</label><select id="prod-category" class="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required><option value="">Select Category</option>' + categoryOptions + '</select></div><div><label class="block text-xs font-medium text-gray-700 mb-1">Description</label><textarea id="prod-desc" placeholder="Describe product..." class="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" rows="2"></textarea></div><div class="border border-gray-200 rounded-lg p-3 bg-gray-50"><label class="block text-xs font-medium text-gray-700 mb-2">Product Image</label><div class="flex gap-2 mb-2"><input type="file" id="prod-image-file" accept="image/*" class="flex-1 p-1.5 border border-gray-300 rounded text-xs bg-white"><button type="button" id="upload-image-btn" class="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-blue-700">Upload</button></div><div class="flex items-center gap-2 my-2"><div class="h-px bg-gray-300 flex-1"></div><span class="text-xs text-gray-500">OR</span><div class="h-px bg-gray-300 flex-1"></div></div><input type="url" id="prod-image-url" placeholder="Paste Image URL here..." class="w-full p-2 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"><div id="image-preview" class="mt-2 hidden"><img class="h-20 rounded border" id="preview-img"><p class="text-xs text-green-600 mt-1">Image ready</p></div></div><div class="grid grid-cols-2 gap-3"><div><label class="block text-xs font-medium text-gray-700 mb-1">Price (KES)</label><input type="number" id="prod-price" placeholder="0.00" class="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required step="0.01"></div><div><label class="block text-xs font-medium text-gray-700 mb-1">Stock</label><input type="number" id="prod-stock" placeholder="0" class="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required></div></div><button type="submit" class="w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 mt-3">Add Product</button></form><div id="prod-msg" class="mt-3 text-center text-xs"></div></div></div>';
        setTimeout(() => {
            const fileInput = document.getElementById('prod-image-file');
            const uploadBtn = document.getElementById('upload-image-btn');
            const previewDiv = document.getElementById('image-preview');
            const previewImg = document.getElementById('preview-img');
            const urlInput = document.getElementById('prod-image-url');
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) { const reader = new FileReader(); reader.onload = (e) => { previewImg.src = e.target.result; previewDiv.classList.remove('hidden'); urlInput.value = ''; }; reader.readAsDataURL(file); }
            });
            urlInput.addEventListener('input', (e) => { if(e.target.value) { previewImg.src = e.target.value; previewDiv.classList.remove('hidden'); fileInput.value = ''; } else { previewDiv.classList.add('hidden'); } });
            uploadBtn.addEventListener('click', async () => {
                const file = fileInput.files[0];
                if (!file) { alert('Please select an image file first'); return; }
                uploadBtn.textContent = 'Uploading...'; uploadBtn.disabled = true;
                try {
                    const fileExt = file.name.split('.').pop();
                    const fileName = Date.now() + '.' + fileExt;
                    const { data, error } = await supabase.storage.from('product-images').upload(fileName, file, { cacheControl: '3600', upsert: false });
                    if (error) throw error;
                    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
                    urlInput.value = publicUrl; previewImg.src = publicUrl; previewDiv.classList.remove('hidden');
                    uploadBtn.textContent = 'Uploaded!'; uploadBtn.className = 'bg-green-600 text-white px-3 py-1.5 rounded text-xs font-medium';
                } catch (err) { alert('Upload failed: ' + err.message); uploadBtn.textContent = 'Upload'; uploadBtn.disabled = false; }
            });
            document.getElementById('prod-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const msg = document.getElementById('prod-msg'); msg.textContent = 'Adding product...'; msg.className = 'mt-3 text-center text-xs text-blue-600';
                try {
                    await productService.createProduct({ business_id: document.getElementById('prod-biz').value, name: document.getElementById('prod-name').value, category_name: document.getElementById('prod-category').value, description: document.getElementById('prod-desc').value, image_url: urlInput.value || null, price: parseFloat(document.getElementById('prod-price').value), stock_quantity: parseInt(document.getElementById('prod-stock').value), is_active: true });
                    msg.textContent = 'Product added!'; msg.className = 'mt-3 text-center text-xs text-green-600'; document.getElementById('prod-form').reset(); previewDiv.classList.add('hidden');
                } catch (err) { msg.textContent = 'Error: ' + err.message; msg.className = 'mt-3 text-center text-xs text-red-600'; }
            });
        }, 100);
    } catch (err) { container.innerHTML = '<p class="text-red-600 text-center mt-10">Error: ' + err.message + '</p>'; }
}

async function renderMap(container) {
    container.innerHTML = '<div class="max-w-7xl mx-auto px-4 py-6"><h2 class="text-2xl font-bold mb-2">Business Map</h2><p class="text-gray-600 mb-4 text-sm">Find businesses near you</p><button id="locate-me-btn" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm mb-4 hover:bg-blue-700 flex items-center gap-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> Find Near Me</button><div id="map-container" class="h-[500px] w-full rounded-xl shadow-md border border-gray-200 z-0"></div></div>';
    setTimeout(async () => {
        if (typeof window.L === 'undefined') { document.getElementById('map-container').innerHTML = '<div class="flex h-full items-center justify-center text-red-500">Map library not loaded. Refresh page.</div>'; return; }
        const map = window.L.map('map-container').setView([-1.286389, 36.817223], 12);
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: 'OpenStreetMap' }).addTo(map);
        try {
            const { data: businesses } = await supabase.from('businesses').select('*').eq('status', 'active').not('latitude', 'is', null);
            if (!businesses || businesses.length === 0) { document.getElementById('map-container').innerHTML = '<div class="flex h-full items-center justify-center text-gray-500">No businesses with location data yet.</div>'; return; }
            businesses.forEach(b => { window.L.marker([b.latitude, b.longitude]).addTo(map).bindPopup('<b>' + b.name + '</b><br/>' + b.description); });
            document.getElementById('locate-me-btn').addEventListener('click', () => {
                if (navigator.geolocation) {
                    const btn = document.getElementById('locate-me-btn'); btn.innerHTML = 'Locating...'; btn.disabled = true;
                    navigator.geolocation.getCurrentPosition((pos) => {
                        window.L.marker([pos.coords.latitude, pos.coords.longitude]).addTo(map).bindPopup('You are here').openPopup();
                        map.setView([pos.coords.latitude, pos.coords.longitude], 13);
                        btn.innerHTML = 'Location Found'; btn.disabled = false;
                    }, () => { alert('Location access denied'); btn.innerHTML = 'Find Near Me'; btn.disabled = false; });
                }
            });
        } catch (err) { console.error('[ERROR] Map error:', err); }
    }, 100);
}

// ==========================================
// PROFESSIONAL BUSINESS PROFILE PAGE
// ==========================================

// ==========================================
// PROFESSIONAL PROFILE UI (Version 2.0)
// ==========================================
async function renderProfessionalProfile(container, userId = currentUser.id) {
    const isMe = userId === currentUser.id;
    const profile = isMe ? userProfile : await profileService.getProfile(userId);
    if (!profile) { container.innerHTML = '<p class="text-center p-8">Profile not found.</p>'; return; }
    
    const completionScore = profileService.calculateProfileCompletion(profile);
    const businesses = profile.businesses || [];
    const isVerified = profile.verification_status === 'verified';
    
    container.innerHTML = `
        <div class="max-w-5xl mx-auto px-4 py-6">
            <!-- Cover & Header -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div class="h-48 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
                    ${profile.cover_image_url ? '<img src="' + profile.cover_image_url + '" class="w-full h-full object-cover">' : ''}
                </div>
                <div class="px-6 pb-6 relative">
                    <div class="flex flex-col md:flex-row md:items-end gap-4 -mt-16">
                        <div class="w-32 h-32 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-lg flex-shrink-0">
                            ${profile.avatar_url ? '<img src="' + profile.avatar_url + '" class="w-full h-full object-cover">' : '<div class="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-500">' + (profile.full_name || 'U')[0].toUpperCase() + '</div>'}
                        </div>
                        <div class="flex-1 pb-2">
                            <div class="flex items-center gap-2 flex-wrap">
                                <h1 class="text-2xl font-bold text-gray-900">${profile.full_name || 'Anonymous'}</h1>
                                ${isVerified ? '<span class="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1"><svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>Verified</span>' : ''}
                            </div>
                            <p class="text-gray-600 font-medium mt-1">${profile.headline || 'Professional Headline'}</p>
                            <div class="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                ${profile.location_text ? '<span class="flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>' + profile.location_text + '</span>' : ''}
                                <span class="flex items-center gap-1">
                                    <svg class="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                                    4.8 (124 reviews)
                                </span>
                            </div>
                        </div>
                        <div class="flex gap-2 pb-2">
                            ${isMe ? '<button onclick="window.editProfile()" class="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>Edit Profile</button>' : '<button class="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition">Message</button><button class="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition">Follow</button>'}
                        </div>
                    </div>
                    
                    <!-- Profile Completion (Only for own profile) -->
                    ${isMe ? `
                    <div class="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-sm font-medium text-gray-700">Profile Strength</span>
                            <span class="text-sm font-bold text-blue-600">${completionScore}% Complete</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-blue-600 h-2 rounded-full transition-all" style="width: ${completionScore}%"></div>
                        </div>
                        <p class="text-xs text-gray-500 mt-2">Complete your profile to build trust with buyers and businesses.</p>
                    </div>
                    ` : ''}
                </div>
            </div>

            <!-- Content Grid -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Left Column: About & Details -->
                <div class="md:col-span-1 space-y-6">
                    <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h3 class="font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            About
                        </h3>
                        <p class="text-gray-600 text-sm leading-relaxed">${profile.bio || 'No bio yet. Click Edit Profile to add your professional story.'}</p>
                    </div>
                    
                    <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h3 class="font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                            Contact
                        </h3>
                        <div class="space-y-2 text-sm">
                            <p class="text-gray-600 break-all">${currentUser.email}</p>
                            ${profile.phone ? '<p class="text-gray-600">' + profile.phone + '</p>' : ''}
                        </div>
                    </div>
                </div>

                <!-- Right Column: Businesses & Activity -->
                <div class="md:col-span-2 space-y-6">
                    <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h3 class="font-bold text-gray-900 mb-4 flex items-center justify-between">
                            <span class="flex items-center gap-2">
                                <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                Businesses
                            </span>
                            ${isMe ? '<button onclick="navigateTo('my-business')" class="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add Business</button>' : ''}
                        </h3>
                        ${businesses.length > 0 ? businesses.map(b => `
                            <div class="border border-gray-100 rounded-xl p-4 mb-3 hover:shadow-md transition cursor-pointer" onclick="window.viewBusiness('${b.id}')">
                                <div class="flex justify-between items-start">
                                    <div>
                                        <h4 class="font-bold text-gray-900">${b.name}</h4>
                                        <p class="text-sm text-gray-500">${b.category || 'General Business'}</p>
                                    </div>
                                    <span class="px-2 py-1 rounded-full text-xs font-semibold ${b.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">${b.status || 'open'}</span>
                                </div>
                                <p class="text-sm text-gray-600 mt-2 line-clamp-2">${b.description || 'No description'}</p>
                            </div>
                        `).join('') : '<p class="text-gray-500 text-sm text-center py-4">No businesses connected yet.</p>'}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Expose to window
window.renderProfessionalProfile = renderProfessionalProfile;
window.viewBusiness = (id) => alert('View business: ' + id); // Placeholder for next step


window.editProfile = () => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8">
            <div class="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl">
                <h3 class="text-2xl font-bold text-gray-900">Edit Professional Profile</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            <form id="edit-profile-form" class="p-6 space-y-6">
                <!-- Avatar -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
                    <div class="flex items-center gap-4">
                        <div class="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-2xl font-bold text-gray-600 overflow-hidden">
                            ${userProfile?.avatar_url ? '<img src="' + userProfile.avatar_url + '" class="w-full h-full object-cover">' : (currentUser.email[0].toUpperCase())}
                        </div>
                        <div class="flex-1">
                            <input type="url" id="edit-avatar" placeholder="Paste image URL..." class="w-full p-2.5 border border-gray-300 rounded-lg text-sm mb-2" value="${userProfile?.avatar_url || ''}">
                            <p class="text-xs text-gray-500 mb-1">Or upload a file:</p>
                            <input type="file" id="edit-avatar-file" accept="image/*" class="text-sm">
                        </div>
                    </div>
                </div>
                
                <!-- Full Name -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input type="text" id="edit-name" class="w-full p-2.5 border border-gray-300 rounded-lg" value="${userProfile?.full_name || ''}" required>
                </div>
                
                <!-- Bio -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Bio / Professional Headline</label>
                    <textarea id="edit-bio" rows="3" class="w-full p-2.5 border border-gray-300 rounded-lg" placeholder="e.g., Agricultural Entrepreneur | Tomato Farmer">${userProfile?.bio || ''}</textarea>
                </div>
                
                <!-- Location -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input type="text" id="edit-location" class="w-full p-2.5 border border-gray-300 rounded-lg mb-2" placeholder="e.g., Nairobi, Kenya" value="${userProfile?.location || ''}">
                    <div class="flex gap-2">
                        <input type="number" id="edit-lat" step="any" class="flex-1 p-2.5 border border-gray-300 rounded-lg text-sm" placeholder="Latitude" value="${userProfile?.latitude || ''}">
                        <input type="number" id="edit-lng" step="any" class="flex-1 p-2.5 border border-gray-300 rounded-lg text-sm" placeholder="Longitude" value="${userProfile?.longitude || ''}">
                        <button type="button" onclick="window.getCurrentLocation()" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 whitespace-nowrap">Use Current</button>
                    </div>
                </div>
                
                <!-- Business Hours -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Business Hours</label>
                    <input type="text" id="edit-hours" class="w-full p-2.5 border border-gray-300 rounded-lg" placeholder="e.g., Mon-Fri 9AM-6PM" value="${userProfile?.business_hours || ''}">
                </div>
                
                <!-- Links -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Links (up to 5)</label>
                    <div id="links-container" class="space-y-2">
                        ${(userProfile?.links || []).map((link, idx) => `
                            <div class="flex gap-2 link-item">
                                <input type="text" placeholder="Title" class="flex-1 p-2 border border-gray-300 rounded text-sm link-title" value="${link.title || ''}">
                                <input type="url" placeholder="URL" class="flex-1 p-2 border border-gray-300 rounded text-sm link-url" value="${link.url || ''}">
                                <button type="button" onclick="this.parentElement.remove()" class="text-red-600 hover:text-red-800 px-2 flex items-center">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    <button type="button" onclick="window.addLinkField()" class="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                        Add Link
                    </button>
                </div>
                
                <!-- Submit -->
                <div class="flex gap-3 pt-4 border-t border-gray-200">
                    <button type="submit" class="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition">Save Changes</button>
                    <button type="button" onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-medium hover:bg-gray-300 transition">Cancel</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('edit-profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.textContent = 'Saving...';
        btn.disabled = true;
        
        try {
            const links = Array.from(document.querySelectorAll('.link-item')).map(item => ({
                title: item.querySelector('.link-title').value,
                url: item.querySelector('.link-url').value
            })).filter(l => l.url);
            
            const updates = {
                full_name: document.getElementById('edit-name').value,
                bio: document.getElementById('edit-bio').value,
                location: document.getElementById('edit-location').value,
                latitude: parseFloat(document.getElementById('edit-lat').value) || null,
                longitude: parseFloat(document.getElementById('edit-lng').value) || null,
                business_hours: document.getElementById('edit-hours').value,
                links: links,
                updated_at: new Date().toISOString()
            };
            
            // Handle avatar file upload
            const avatarFile = document.getElementById('edit-avatar-file').files[0];
            if (avatarFile) {
                const avatarUrl = await profileService.uploadAvatar(avatarFile);
                updates.avatar_url = avatarUrl;
            } else {
                updates.avatar_url = document.getElementById('edit-avatar').value || null;
            }
            
            await profileService.updateProfile(currentUser.id, updates);
            userProfile = { ...userProfile, ...updates };
            modal.remove();
            renderProfile(document.getElementById('main-content'));
        } catch (err) {
            alert('Error: ' + err.message);
            btn.textContent = 'Save Changes';
            btn.disabled = false;
        }
    });
};

window.addLinkField = () => {
    const container = document.getElementById('links-container');
    if (container.children.length >= 5) {
        alert('Maximum 5 links allowed');
        return;
    }
    const div = document.createElement('div');
    div.className = 'flex gap-2 link-item';
    div.innerHTML = `
        <input type="text" placeholder="Title" class="flex-1 p-2 border border-gray-300 rounded text-sm link-title">
        <input type="url" placeholder="URL" class="flex-1 p-2 border border-gray-300 rounded text-sm link-url">
        <button type="button" onclick="this.parentElement.remove()" class="text-red-600 hover:text-red-800 px-2 flex items-center">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
    `;
    container.appendChild(div);
};

window.getCurrentLocation = () => {
    if (navigator.geolocation) {
        const btn = event.target;
        btn.textContent = 'Locating...';
        navigator.geolocation.getCurrentPosition((pos) => {
            document.getElementById('edit-lat').value = pos.coords.latitude;
            document.getElementById('edit-lng').value = pos.coords.longitude;
            btn.textContent = 'Use Current';
        }, () => {
            alert('Could not get your location');
            btn.textContent = 'Use Current';
        });
    }
};

window.shareProfile = () => {
    const shareData = {
        title: userProfile?.full_name || 'My Profile',
        text: userProfile?.bio || 'Check out my professional profile',
        url: window.location.href
    };
    
    if (navigator.share) {
        navigator.share(shareData);
    } else {
        navigator.clipboard.writeText(window.location.href);
        alert('Profile link copied to clipboard!');
    }
};

// ==========================================
// WHATSAPP-STYLE GROUPS UI (RESPONSIVE)
// ==========================================
async function renderGroups(container) {
    container.innerHTML = `
        <div class="whatsapp-container">
            <!-- Left Sidebar -->
            <div class="whatsapp-sidebar" id="groups-sidebar">
                <div class="bg-[#f0f2f5] p-4 flex justify-between items-center border-b border-gray-300">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-bold">${currentUser.email[0].toUpperCase()}</div>
                        <span class="font-medium text-gray-700 hidden sm:block">${currentUser.email.split('@')[0]}</span>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="window.showNewChatModal()" class="text-gray-600 hover:text-gray-900 p-2 rounded-full hover:bg-gray-200" title="New Chat">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                        </button>
                        <button onclick="window.showCreateGroupModal()" class="text-gray-600 hover:text-gray-900 p-2 rounded-full hover:bg-gray-200" title="New Group">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        </button>
                    </div>
                </div>
                <div class="p-2 bg-white border-b border-gray-200">
                    <input type="text" id="search-groups" placeholder="Search or start new chat" class="w-full bg-[#f0f2f5] p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                <div id="groups-list" class="flex-1 overflow-y-auto">
                    <div class="p-8 text-center text-gray-500 text-sm">Loading groups...</div>
                </div>
            </div>
            
            <!-- Right Chat Area -->
            <div class="whatsapp-chat" id="chat-area">
                <div class="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 text-center">
                    <svg class="w-24 h-24 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                    <h2 class="text-2xl font-light mb-2">Platform POC Web</h2>
                    <p class="text-sm text-gray-400">Select a group from the sidebar to start chatting</p>
                </div>
            </div>
        </div>
    `;
    loadSidebarGroups();
}

async function loadSidebarGroups() {
    try {
        const groups = await groupService.getAllGroups();
        const userGroups = await groupService.getUserGroups(currentUser.id);
        const joinedIds = userGroups.map(g => g.id);
        const myGroups = groups.filter(g => joinedIds.includes(g.id));

        const list = document.getElementById('groups-list');
        if (myGroups.length === 0) {
            list.innerHTML = '<div class="p-8 text-center text-gray-500 text-sm">No groups joined yet. Click the + icon to create one.</div>';
            return;
        }

        list.innerHTML = myGroups.map(g => `
            <div class="flex items-center gap-3 p-3 hover:bg-[#f0f2f5] cursor-pointer border-b border-gray-100 transition" onclick="window.openGroupChat('${g.id}', '${g.name.replace(/'/g, "\\'")}')">
                <div class="w-12 h-12 bg-[#dfe5e7] rounded-full flex items-center justify-center text-gray-600 font-bold text-lg flex-shrink-0">${g.name[0].toUpperCase()}</div>
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-baseline">
                        <h4 class="font-medium text-gray-900 truncate">${g.name}</h4>
                        <span class="text-xs text-gray-500 flex-shrink-0">Now</span>
                    </div>
                    <p class="text-sm text-gray-500 truncate">${g.description || 'No description'}</p>
                </div>
            </div>
        `).join('');
    } catch (err) { console.error('[ERROR] Load groups:', err); }
}

window.openGroupChat = async (groupId, groupName) => {
    window.currentGroupId = groupId;
    window.currentGroupName = groupName;
    const chatArea = document.getElementById('chat-area');
    
    // On mobile, hide sidebar
    if (window.innerWidth < 768) {
        document.getElementById('groups-sidebar').classList.add('hidden-mobile');
    }
    
    chatArea.innerHTML = `
        <div class="bg-[#f0f2f5] p-3 flex justify-between items-center border-l border-gray-300 shadow-sm z-10">
            <div class="flex items-center gap-3">
                ${window.innerWidth < 768 ? '<button onclick="window.backToGroups()" class="mr-2 p-1 rounded-full hover:bg-gray-200"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg></button>' : ''}
                <div class="w-10 h-10 bg-[#dfe5e7] rounded-full flex items-center justify-center text-gray-600 font-bold flex-shrink-0">${groupName[0].toUpperCase()}</div>
                <div class="min-w-0">
                    <h3 class="font-medium text-gray-900 truncate">${groupName}</h3>
                    <p class="text-xs text-gray-500">click for group info</p>
                </div>
            </div>
            <div class="flex gap-2 text-gray-600">
                <button onclick="window.searchInChat()" class="hover:text-gray-900 p-2 rounded-full hover:bg-gray-200" title="Search"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></button>
                <button onclick="window.toggleGroupInfo()" class="hover:text-gray-900 p-2 rounded-full hover:bg-gray-200" title="Group Info"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></button>
            </div>
        </div>
        
        <div id="messages-container" class="flex-1 overflow-y-auto p-4 space-y-2 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
            <div class="text-center my-4"><span class="bg-white text-gray-500 text-xs px-3 py-1 rounded-lg shadow-sm">TODAY</span></div>
        </div>

        <div id="reply-preview" class="hidden bg-white border-l-4 border-[#00a884] p-3 flex justify-between items-center shadow-sm">
            <div class="min-w-0">
                <p class="text-xs font-bold text-[#00a884]">Replying to message</p>
                <p class="text-sm text-gray-700 truncate" id="reply-text"></p>
            </div>
            <button onclick="window.cancelReply()" class="text-gray-500 hover:text-gray-700 p-1"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
        </div>

        <div class="bg-[#f0f2f5] p-3 flex items-center gap-2 border-l border-gray-300 relative">
            <button onclick="window.toggleEmojiPicker()" class="text-gray-600 hover:text-gray-900 p-2 rounded-full hover:bg-gray-200 flex-shrink-0" title="Emoji"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></button>
            <button onclick="document.getElementById('file-input').click()" class="text-gray-600 hover:text-gray-900 p-2 rounded-full hover:bg-gray-200 flex-shrink-0" title="Attach"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg></button>
            <input type="file" id="file-input" class="hidden" accept="image/*,video/*,application/pdf" onchange="window.handleFileSelect(event)">
            <input type="text" id="message-input" placeholder="Type a message" class="flex-1 bg-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-0">
            <button id="send-btn" class="text-gray-600 hover:text-gray-900 p-2 rounded-full hover:bg-gray-200 flex-shrink-0" title="Send"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg></button>
            
            <div id="emoji-picker" class="hidden absolute bottom-20 right-10 bg-white rounded-lg shadow-xl p-3 grid grid-cols-8 gap-2 max-w-[300px] z-50 border border-gray-200"></div>
        </div>
    `;

    window.initEmojiPicker();
    window.loadMessages(groupId);

    const input = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');

    window.sendMessage = async () => {
        const text = input.value.trim();
        if (!text) return;
        try {
            await groupService.sendMessage(groupId, currentUser.id, text);
            input.value = '';
            window.replyingTo = null;
            document.getElementById('reply-preview').classList.add('hidden');
        } catch (err) { alert('Error: ' + err.message); }
    };

    sendBtn.addEventListener('click', window.sendMessage);
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') window.sendMessage(); });

    if (window.chatChannel) supabase.removeChannel(window.chatChannel);
    window.chatChannel = supabase.channel('chat-' + groupId)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages', filter: 'group_id=eq.' + groupId }, payload => {
            window.appendMessage(payload.new);
        })
        .subscribe();
};

window.backToGroups = () => {
    document.getElementById('groups-sidebar').classList.remove('hidden-mobile');
};

window.loadMessages = async (groupId) => {
    const container = document.getElementById('messages-container');
    if (!container) return;
    container.innerHTML = '<div class="text-center my-4"><span class="bg-white text-gray-500 text-xs px-3 py-1 rounded-lg shadow-sm">TODAY</span></div>';
    try {
        const messages = await groupService.getMessages(groupId);
        messages.forEach(msg => window.appendMessage(msg, false));
        container.scrollTop = container.scrollHeight;
    } catch (err) { console.error('[ERROR] Load messages:', err); }
};

window.appendMessage = (msg, scroll = true) => {
    const container = document.getElementById('messages-container');
    if (!container) return;
    const isMe = msg.user_id === currentUser.id;
    const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const bubble = document.createElement('div');
    bubble.className = 'flex ' + (isMe ? 'justify-end' : 'justify-start');
    bubble.innerHTML = `
        <div class="message-bubble ${isMe ? 'sent' : 'received'} group relative">
            ${!isMe ? '<p class="text-xs font-bold text-[#00a884] mb-1">Member</p>' : ''}
            <p class="text-sm text-gray-900 break-words pr-12">${msg.content}</p>
            <div class="flex items-center justify-end gap-1 mt-1">
                <span class="text-[10px] text-gray-500">${time}</span>
                ${isMe ? '<svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"></path></svg>' : ''}
            </div>
            <button onclick="window.replyToMessage('${msg.id}', '${msg.content.replace(/'/g, "\\'")}')" class="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-700 transition p-1" title="Reply">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
            </button>
        </div>
    `;
    container.appendChild(bubble);
    if (scroll) container.scrollTop = container.scrollHeight;
};

window.initEmojiPicker = () => {
    const emojis = ['😀','😂','😍','😎','🤔','👍','❤️','🔥','👏','🙏','✅','💯','👋','😊','🎉','👀'];
    const picker = document.getElementById('emoji-picker');
    if (!picker) return;
    picker.innerHTML = emojis.map(emoji => '<button class="text-2xl hover:bg-gray-100 p-1 rounded transition" onclick="window.insertEmoji(\'' + emoji + '\')">' + emoji + '</button>').join('');
};

window.toggleEmojiPicker = () => {
    const picker = document.getElementById('emoji-picker');
    if (picker) picker.classList.toggle('hidden');
};

window.insertEmoji = (emoji) => {
    const input = document.getElementById('message-input');
    if (input) { input.value += emoji; input.focus(); }
    window.toggleEmojiPicker();
};

window.handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) alert('File selected: ' + file.name + '. (Upload logic to be connected to storage)');
};

window.replyToMessage = (msgId, msgText) => {
    window.replyingTo = msgId;
    document.getElementById('reply-text').textContent = msgText;
    document.getElementById('reply-preview').classList.remove('hidden');
    document.getElementById('message-input').focus();
};

window.cancelReply = () => {
    window.replyingTo = null;
    document.getElementById('reply-preview').classList.add('hidden');
};

window.searchInChat = () => {
    const term = prompt('Search in chat:');
    if (term) alert('Searching for: ' + term);
};

window.toggleGroupInfo = () => {
    const chatArea = document.getElementById('chat-area');
    if (!chatArea) return;
    const existing = document.getElementById('group-info-panel');
    if (existing) { existing.remove(); return; }
    
    const panel = document.createElement('div');
    panel.id = 'group-info-panel';
    panel.className = 'w-[300px] bg-white border-l border-gray-300 flex flex-col absolute right-0 top-0 bottom-0 z-20 shadow-xl';
    panel.innerHTML = `
        <div class="p-4 border-b border-gray-200 flex justify-between items-center bg-[#f0f2f5]">
            <h3 class="font-bold text-lg">Group Info</h3>
            <button onclick="window.toggleGroupInfo()" class="text-gray-600 hover:text-gray-900 p-1 rounded-full hover:bg-gray-200"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
        </div>
        <div class="p-4 flex-1 overflow-y-auto">
            <div class="text-center mb-4">
                <div class="w-24 h-24 bg-[#dfe5e7] rounded-full flex items-center justify-center text-gray-600 font-bold text-3xl mx-auto mb-2">${window.currentGroupName ? window.currentGroupName[0].toUpperCase() : 'G'}</div>
                <h4 class="font-bold text-xl">${window.currentGroupName || 'Group'}</h4>
            </div>
            <div class="border-t border-gray-200 py-3">
                <h5 class="font-medium text-gray-700 mb-2">Members</h5>
                <div id="info-members-list" class="space-y-2"><p class="text-sm text-gray-500">Loading members...</p></div>
            </div>
            <div class="border-t border-gray-200 py-3 mt-4">
                <button onclick="window.leaveCurrentGroup()" class="w-full bg-red-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition">Leave Group</button>
            </div>
        </div>
    `;
    chatArea.appendChild(panel);
    window.loadGroupInfoMembers();
};

window.loadGroupInfoMembers = async () => {
    const list = document.getElementById('info-members-list');
    if (!list || !window.currentGroupId) return;
    try {
        const { data: group } = await supabase.from('groups').select('group_members(profiles(full_name), role)').eq('id', window.currentGroupId).single();
        const members = group?.group_members || [];
        list.innerHTML = members.map(m => {
            const p = m.profiles;
            return `<div class="flex items-center justify-between p-2 hover:bg-gray-50 rounded transition">
                <div class="flex items-center gap-2 min-w-0">
                    <div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">${p?.full_name?.[0] || '?'}</div>
                    <span class="text-sm truncate">${p?.full_name || 'Anonymous'}</span>
                </div>
                ${m.role === 'admin' ? '<span class="text-xs text-blue-600 font-medium flex-shrink-0">Admin</span>' : ''}
            </div>`;
        }).join('');
    } catch (err) { list.innerHTML = '<p class="text-sm text-red-500">Error loading members</p>'; }
};

window.leaveCurrentGroup = async () => {
    if (confirm('Are you sure you want to leave this group?')) {
        try {
            await groupService.leaveGroup(window.currentGroupId, currentUser.id);
            document.getElementById('group-info-panel')?.remove();
            navigateTo('groups');
        } catch (err) { alert('Error: ' + err.message); }
    }
};

window.showNewChatModal = () => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white p-6 rounded-xl shadow-xl max-w-md w-full">
            <h3 class="text-xl font-bold mb-4">Start New Chat</h3>
            <p class="text-gray-600 mb-4">Select a group to chat with or create a new one.</p>
            <div class="space-y-2">
                <button onclick="this.closest('.fixed').remove(); window.showCreateGroupModal()" class="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition">Create New Group</button>
                <button onclick="this.closest('.fixed').remove()" class="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-medium hover:bg-gray-300 transition">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

window.showCreateGroupModal = () => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white p-6 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 class="text-xl font-bold mb-4">Create New Group</h3>
            <form id="create-group-form" class="space-y-4">
                <div><label class="block text-sm font-medium text-gray-700 mb-1">Group Name</label><input type="text" id="group-name" placeholder="e.g., Nairobi Farmers" class="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required></div>
                <div><label class="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea id="group-desc" placeholder="Describe your group..." class="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" rows="3" required></textarea></div>
                <div><label class="block text-sm font-medium text-gray-700 mb-1">Benefit Title</label><input type="text" id="benefit-title" placeholder="e.g., 10% Discount" class="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required></div>
                <div><label class="block text-sm font-medium text-gray-700 mb-1">Applicable Product (Optional)</label><input type="text" id="target-product" placeholder="e.g., Fresh Tomatoes" class="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"></div>
                <div class="flex gap-3 pt-2">
                    <button type="submit" class="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition">Create Group</button>
                    <button type="button" onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-200 text-gray-800 py-2.5 rounded-lg font-medium hover:bg-gray-300 transition">Cancel</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('create-group-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.textContent = 'Creating...'; btn.disabled = true;
        try {
            const group = await groupService.createGroup({ name: document.getElementById('group-name').value, description: document.getElementById('group-desc').value, status: 'active' });
            await groupService.addBenefit({ group_id: group.id, title: document.getElementById('benefit-title').value, description: document.getElementById('group-desc').value, benefit_type: 'percentage_discount', value: 10, is_active: true, target_product_name: document.getElementById('target-product').value || null });
            modal.remove();
            loadSidebarGroups();
        } catch (err) { alert('Error: ' + err.message); btn.textContent = 'Create Group'; btn.disabled = false; }
    });
};

function showAuthModal(type) {
    const modal = document.createElement('div'); modal.id = 'auth-modal'; modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = '<div class="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full relative"><button id="close-modal-btn" class="absolute top-3 right-3 text-gray-500 text-xl hover:text-gray-700">&times;</button><h2 class="text-lg font-bold mb-4 text-center">' + (type === 'login' ? 'Login' : 'Register') + '</h2><div class="space-y-2"><input type="email" id="modal-email" placeholder="Email" class="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required><input type="password" id="modal-password" placeholder="Password" class="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required><input type="text" id="modal-fullname" placeholder="Full Name" class="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (type === 'login' ? 'hidden' : '') + '"><button id="modal-submit" class="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium mt-2 hover:bg-blue-700 transition">' + (type === 'login' ? 'Login' : 'Register') + '</button></div><div id="modal-msg" class="mt-2 text-center text-xs"></div></div>';
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

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initApp); } else { initApp(); }