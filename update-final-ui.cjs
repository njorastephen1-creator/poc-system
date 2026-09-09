const fs = require('fs');

console.log('Updating UI: Large Hero, Compact Forms, Dual Image Input...\n');

const mainJsContent = `import './assets/css/style.css';
import { authService } from './services/auth.service.js';
import { businessService } from './services/business.service.js';
import { productService } from './services/product.service.js';
import { orderService } from './services/order.service.js';
import { supabase } from './config/supabase.client.js';

let currentUser = null;
let currentView = 'home';
let cart = [];

const counties = ['Mombasa','Kwale','Kilifi','Tana River','Lamu','Taita-Taveta','Garissa','Wajir','Mandera','Marsabit','Isiolo','Meru','Tharaka-Nithi','Laikipia','Samburu','Turkana','West Pokot','Baringo','Uasin Gishu','Elgeyo-Marakwet','Nandi','Bomet','Kakamega','Vihiga','Bungoma','Busia','Siaya','Kisumu','Homa Bay','Migori','Kisii','Nyamira','Nairobi','Kiambu','Machakos','Makueni','Murang\\'a','Nyeri','Kirinyaga','Nyandarua','Nakuru','Narok','Kajiado','Kericho','Trans-Nzoia','Kitui','Embu'];

async function initApp() {
    const headerEl = document.getElementById('main-header');
    const contentEl = document.getElementById('main-content');
    try {
        const session = await authService.getSession();
        currentUser = session?.user || null;
        if (currentUser) renderAuthenticatedHeader(headerEl);
        else renderPublicHeader(headerEl);
        renderView(contentEl, currentView);
        setTimeout(() => attachGlobalListeners(), 100);
    } catch (err) { console.error("Init Error:", err); }
}

function attachGlobalListeners() {
    const ids = ['nav-home', 'nav-dashboard', 'nav-marketplace', 'nav-my-business', 'nav-add-product', 'nav-cart', 'nav-orders', 'nav-seller-orders', 'nav-login-btn', 'nav-register-btn', 'nav-logout-btn', 'close-modal-btn', 'hero-register-btn'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', (e) => { if (e) e.preventDefault(); handleNavigation(id); });
    });
}

function handleNavigation(id) {
    if (id === 'nav-home') navigateTo('home');
    else if (id === 'nav-dashboard') navigateTo('dashboard');
    else if (id === 'nav-marketplace') navigateTo('marketplace');
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

function navigateTo(view) { currentView = view; const contentEl = document.getElementById('main-content'); if (contentEl) { renderView(contentEl, view); window.scrollTo(0, 0); } }

function renderView(container, view) {
    try {
        if (view === 'home') showHeroSection(container);
        else if (view === 'dashboard') showDashboard(container);
        else if (view === 'marketplace') renderMarketplace(container);
        else if (view === 'my-business') renderMyBusiness(container);
        else if (view === 'add-product') renderAddProduct(container);
        else if (view === 'cart') renderCart(container);
        else if (view === 'checkout') renderCheckout(container);
        else if (view === 'orders') renderMyOrders(container);
        else if (view === 'seller-orders') renderSellerOrders(container);
        else showHeroSection(container);
    } catch (err) { container.innerHTML = '<p class="text-red-600 text-center mt-10">Error: ' + err.message + '</p>'; }
}

function renderPublicHeader(headerEl) {
    headerEl.innerHTML = '<div class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40"><div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center"><div class="flex items-center gap-3"><div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">P</div><h1 class="text-xl font-bold text-gray-900">Platform POC</h1></div><div class="flex items-center gap-3"><button id="nav-login-btn" class="text-gray-700 hover:text-blue-600 font-medium px-4 py-2">Login</button><button id="nav-register-btn" class="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 font-medium">Get Started</button></div></div></div>';
}

function renderAuthenticatedHeader(headerEl) {
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    headerEl.innerHTML = '<div class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40"><div class="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4"><div class="flex items-center gap-3 cursor-pointer" id="nav-home"><div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">P</div><h1 class="text-xl font-bold text-gray-900">Platform POC</h1></div><nav class="flex flex-wrap justify-center gap-2 text-sm font-medium"><a href="#" id="nav-marketplace" class="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">Marketplace</a><a href="#" id="nav-cart" class="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">Cart (' + cartCount + ')</a><a href="#" id="nav-orders" class="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">My Orders</a><a href="#" id="nav-seller-orders" class="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">Seller Orders</a><a href="#" id="nav-my-business" class="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">My Business</a><a href="#" id="nav-add-product" class="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">Add Product</a></nav><div class="flex items-center gap-4"><span class="text-sm text-gray-600">' + currentUser.email.split('@')[0] + '</span><button id="nav-logout-btn" class="text-sm bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">Logout</button></div></div></div>';
}

// LARGE HERO SECTION RESTORED
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
            // COMPACT FORM
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
        
        // COMPACT FORM WITH DUAL IMAGE INPUT
        container.innerHTML = '<div class="max-w-2xl mx-auto px-4 py-8"><div class="bg-white p-6 rounded-xl shadow-md border border-gray-100"><h2 class="text-xl font-bold mb-4 text-gray-900">Add New Product</h2><form id="prod-form" class="space-y-3"><div><label class="block text-xs font-medium text-gray-700 mb-1">Business</label><select id="prod-biz" class="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required>' + businessOptions + '</select></div><div><label class="block text-xs font-medium text-gray-700 mb-1">Product Name</label><input type="text" id="prod-name" placeholder="e.g., Fresh Tomatoes" class="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required></div><div><label class="block text-xs font-medium text-gray-700 mb-1">Category</label><select id="prod-category" class="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required><option value="">Select Category</option>' + categoryOptions + '</select></div><div><label class="block text-xs font-medium text-gray-700 mb-1">Description</label><textarea id="prod-desc" placeholder="Describe product..." class="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" rows="2"></textarea></div><div class="border border-gray-200 rounded-lg p-3 bg-gray-50"><label class="block text-xs font-medium text-gray-700 mb-2">Product Image</label><div class="flex gap-2 mb-2"><input type="file" id="prod-image-file" accept="image/*" class="flex-1 p-1.5 border border-gray-300 rounded text-xs bg-white"><button type="button" id="upload-image-btn" class="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-blue-700">Upload</button></div><div class="flex items-center gap-2 my-2"><div class="h-px bg-gray-300 flex-1"></div><span class="text-xs text-gray-500">OR</span><div class="h-px bg-gray-300 flex-1"></div></div><input type="url" id="prod-image-url" placeholder="Paste Image URL here..." class="w-full p-2 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"><div id="image-preview" class="mt-2 hidden"><img class="h-20 rounded border" id="preview-img"><p class="text-xs text-green-600 mt-1">Image ready</p></div></div><div class="grid grid-cols-2 gap-3"><div><label class="block text-xs font-medium text-gray-700 mb-1">Price (KES)</label><input type="number" id="prod-price" placeholder="0.00" class="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required step="0.01"></div><div><label class="block text-xs font-medium text-gray-700 mb-1">Stock</label><input type="number" id="prod-stock" placeholder="0" class="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required></div></div><button type="submit" class="w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 mt-3">Add Product</button></form><div id="prod-msg" class="mt-3 text-center text-xs"></div></div></div>';
        
        setTimeout(() => {
            const fileInput = document.getElementById('prod-image-file');
            const uploadBtn = document.getElementById('upload-image-btn');
            const previewDiv = document.getElementById('image-preview');
            const previewImg = document.getElementById('preview-img');
            const urlInput = document.getElementById('prod-image-url');
            const hiddenUrlInput = document.getElementById('prod-image-url'); // We will use the visible URL input directly
            
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        previewImg.src = e.target.result;
                        previewDiv.classList.remove('hidden');
                        urlInput.value = ''; // Clear URL if file is chosen
                    };
                    reader.readAsDataURL(file);
                }
            });
            
            urlInput.addEventListener('input', (e) => {
                if(e.target.value) {
                    previewImg.src = e.target.value;
                    previewDiv.classList.remove('hidden');
                    fileInput.value = ''; // Clear file if URL is pasted
                } else {
                    previewDiv.classList.add('hidden');
                }
            });

            uploadBtn.addEventListener('click', async () => {
                const file = fileInput.files[0];
                if (!file) { alert('Please select an image file first'); return; }
                
                uploadBtn.textContent = 'Uploading...';
                uploadBtn.disabled = true;
                
                try {
                    const fileExt = file.name.split('.').pop();
                    const fileName = Date.now() + '.' + fileExt;
                    const { data, error } = await supabase.storage.from('product-images').upload(fileName, file, { cacheControl: '3600', upsert: false });
                    
                    if (error) throw error;
                    
                    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
                    urlInput.value = publicUrl;
                    previewImg.src = publicUrl;
                    previewDiv.classList.remove('hidden');
                    uploadBtn.textContent = 'Uploaded!';
                    uploadBtn.className = 'bg-green-600 text-white px-3 py-1.5 rounded text-xs font-medium';
                } catch (err) {
                    alert('Upload failed: ' + err.message);
                    uploadBtn.textContent = 'Upload';
                    uploadBtn.disabled = false;
                }
            });
            
            document.getElementById('prod-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const msg = document.getElementById('prod-msg');
                msg.textContent = 'Adding product...';
                msg.className = 'mt-3 text-center text-xs text-blue-600';
                try {
                    await productService.createProduct({ 
                        business_id: document.getElementById('prod-biz').value, 
                        name: document.getElementById('prod-name').value, 
                        category_name: document.getElementById('prod-category').value, 
                        description: document.getElementById('prod-desc').value, 
                        image_url: urlInput.value || null,
                        price: parseFloat(document.getElementById('prod-price').value), 
                        stock_quantity: parseInt(document.getElementById('prod-stock').value), 
                        is_active: true 
                    });
                    msg.textContent = 'Product added!';
                    msg.className = 'mt-3 text-center text-xs text-green-600';
                    document.getElementById('prod-form').reset();
                    previewDiv.classList.add('hidden');
                } catch (err) {
                    msg.textContent = 'Error: ' + err.message;
                    msg.className = 'mt-3 text-center text-xs text-red-600';
                }
            });
        }, 100);
    } catch (err) { container.innerHTML = '<p class="text-red-600 text-center mt-10">Error: ' + err.message + '</p>'; }
}

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
console.log('UI Updated: Large Hero restored, Forms compact, Dual Image Input added!');