const fs = require('fs');
const path = require('path');

function writeFile(filePath, content) {
    const fullPath = path.join(__dirname, filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, content);
    console.log('Updated: ' + filePath);
}

console.log('Starting Sprint 5: Cart, Checkout & Orders...\n');

// 1. Update Order Service
writeFile('src/services/order.service.js', `import { supabase } from '../config/supabase.client.js';

export const orderService = {
    async createOrder(orderData, orderItems) {
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert([orderData])
            .select()
            .single();
        
        if (orderError) throw orderError;

        const itemsWithOrderId = orderItems.map(item => ({
            order_id: order.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal: item.quantity * item.unit_price
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(itemsWithOrderId);
        
        if (itemsError) throw itemsError;

        return order;
    },

    async getOrdersByBuyer(buyerId) {
        const { data, error } = await supabase
            .from('orders')
            .select('*, order_items(*, products(*, businesses(name)))')
            .eq('buyer_id', buyerId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async getOrdersForSeller(sellerId) {
        const { data, error } = await supabase
            .from('orders')
            .select('*, order_items(*, products(*, businesses(id, owner_id))), buyer:profiles(full_name, email)')
            .eq('order_items.products.businesses.owner_id', sellerId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async updateOrderStatus(orderId, newStatus) {
        const { data, error } = await supabase
            .from('orders')
            .update({ order_status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', orderId)
            .select()
            .single();
        if (error) throw error;
        return data;
    }
};
`);

// 2. Update Main App Logic
writeFile('src/main.js', `import './assets/css/style.css';
import { authService } from './services/auth.service.js';
import { businessService } from './services/business.service.js';
import { productService } from './services/product.service.js';
import { orderService } from './services/order.service.js';

let currentUser = null;
let currentView = 'home';
let cart = [];

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
        setTimeout(() => attachGlobalListeners(), 100);
        
    } catch (err) {
        console.error("Init Error:", err);
        contentEl.innerHTML = '<div class="max-w-2xl mx-auto px-4 py-8"><div class="bg-red-50 p-6 rounded-lg border border-red-200"><h3 class="text-red-800 font-bold mb-2">Error</h3><p class="text-red-600 text-sm">' + err.message + '</p></div></div>';
    }
}

function attachGlobalListeners() {
    const ids = ['nav-home', 'nav-dashboard', 'nav-marketplace', 'nav-my-business', 'nav-add-product', 'nav-cart', 'nav-orders', 'nav-seller-orders', 'nav-login-btn', 'nav-register-btn', 'nav-logout-btn', 'close-modal-btn', 'hero-register-btn'];
    
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('click', (e) => {
                if (e) e.preventDefault();
                handleNavigation(id);
            });
        }
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
    } catch (err) {
        console.error('Render error:', err);
        container.innerHTML = '<p class="text-red-600 text-center mt-10">Error: ' + err.message + '</p>';
    }
}

function renderPublicHeader(headerEl) {
    headerEl.innerHTML = '<div class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40"><div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center"><div class="flex items-center gap-3"><div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">P</div><h1 class="text-xl font-bold text-gray-900">Platform POC</h1></div><div class="flex items-center gap-3"><button id="nav-login-btn" class="text-gray-700 hover:text-blue-600 font-medium px-4 py-2">Login</button><button id="nav-register-btn" class="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 font-medium">Get Started</button></div></div></div>';
}

function renderAuthenticatedHeader(headerEl) {
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    headerEl.innerHTML = '<div class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40"><div class="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4"><div class="flex items-center gap-3 cursor-pointer" id="nav-home"><div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">P</div><h1 class="text-xl font-bold text-gray-900">Platform POC</h1></div><nav class="flex flex-wrap justify-center gap-2 text-sm font-medium"><a href="#" id="nav-marketplace" class="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">Marketplace</a><a href="#" id="nav-cart" class="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">Cart (' + cartCount + ')</a><a href="#" id="nav-orders" class="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">My Orders</a><a href="#" id="nav-seller-orders" class="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">Seller Orders</a><a href="#" id="nav-my-business" class="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">My Business</a></nav><div class="flex items-center gap-4"><span class="text-sm text-gray-600">' + currentUser.email.split('@')[0] + '</span><button id="nav-logout-btn" class="text-sm bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">Logout</button></div></div></div>';
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
        if (products.length === 0) {
            container.innerHTML = '<div class="max-w-7xl mx-auto px-4 py-8"><h2 class="text-3xl font-bold mb-2 text-gray-900">Marketplace</h2><div class="bg-white p-12 rounded-xl shadow-md text-center"><p class="text-gray-500 mb-4">No products available yet.</p></div></div>';
            return;
        }
        let html = products.map(p => {
            const inCart = cart.find(item => item.product_id === p.id);
            return '<div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden card-hover"><div class="h-48 bg-gray-100 flex items-center justify-center text-gray-400"><svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div><div class="p-5"><h3 class="font-bold text-lg text-gray-900 mb-1">' + p.name + '</h3><p class="text-sm text-gray-600 mb-3">' + (p.businesses?.name || 'Unknown Business') + '</p><div class="flex justify-between items-center mb-4"><p class="text-green-600 font-bold text-2xl">KES ' + p.price + '</p><span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Stock: ' + p.stock_quantity + '</span></div><button class="add-to-cart-btn w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium" data-id="' + p.id + '" data-name="' + p.name + '" data-price="' + p.price + '">' + (inCart ? 'In Cart (' + inCart.quantity + ')' : 'Add to Cart') + '</button></div></div>';
        }).join('');
        container.innerHTML = '<div class="max-w-7xl mx-auto px-4 py-8"><h2 class="text-3xl font-bold mb-2 text-gray-900">Marketplace</h2><p class="text-gray-600 mb-8">Discover products from local businesses</p><div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">' + html + '</div></div>';
        
        setTimeout(() => {
            document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = btn.getAttribute('data-id');
                    const name = btn.getAttribute('data-name');
                    const price = parseFloat(btn.getAttribute('data-price'));
                    addToCart(id, name, price);
                });
            });
        }, 100);
    } catch (err) {
        container.innerHTML = '<p class="text-red-600 text-center mt-10">Error: ' + err.message + '</p>';
    }
}

function addToCart(productId, name, price) {
    const existing = cart.find(item => item.product_id === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ product_id: productId, name: name, price: price, quantity: 1 });
    }
    renderAuthenticatedHeader(document.getElementById('main-header'));
    attachGlobalListeners();
    if (currentView === 'marketplace') renderMarketplace(document.getElementById('main-content'));
    if (currentView === 'cart') renderCart(document.getElementById('main-content'));
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.product_id !== productId);
    renderAuthenticatedHeader(document.getElementById('main-header'));
    attachGlobalListeners();
    renderCart(document.getElementById('main-content'));
}

function renderCart(container) {
    if (cart.length === 0) {
        container.innerHTML = '<div class="max-w-4xl mx-auto px-4 py-8"><div class="bg-white p-12 rounded-2xl shadow-md text-center"><h2 class="text-2xl font-bold mb-4 text-gray-900">Your Cart is Empty</h2><p class="text-gray-600 mb-6">Browse the marketplace to add items.</p><button id="go-marketplace" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium">Go to Marketplace</button></div></div>';
        setTimeout(() => { document.getElementById('go-marketplace').onclick = () => navigateTo('marketplace'); }, 100);
        return;
    }

    let total = 0;
    let html = cart.map(item => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        return '<div class="flex justify-between items-center py-4 border-b border-gray-100"><div><h3 class="font-bold text-gray-900">' + item.name + '</h3><p class="text-sm text-gray-500">KES ' + item.price + ' x ' + item.quantity + '</p></div><div class="flex items-center gap-4"><span class="font-bold text-gray-900">KES ' + subtotal + '</span><button class="remove-btn text-red-500 hover:text-red-700 text-sm" data-id="' + item.product_id + '">Remove</button></div></div>';
    }).join('');

    container.innerHTML = '<div class="max-w-4xl mx-auto px-4 py-8"><h2 class="text-3xl font-bold mb-6 text-gray-900">Shopping Cart</h2><div class="bg-white p-6 rounded-2xl shadow-md border border-gray-100">' + html + '<div class="mt-6 flex justify-between items-center text-xl font-bold text-gray-900"><span>Total:</span><span>KES ' + total + '</span></div><div class="mt-6 flex justify-end gap-4"><button id="clear-cart" class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">Clear Cart</button><button id="go-checkout" class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium">Proceed to Checkout</button></div></div></div>';

    setTimeout(() => {
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', () => removeFromCart(btn.getAttribute('data-id')));
        });
        document.getElementById('clear-cart').onclick = () => { cart = []; renderAuthenticatedHeader(document.getElementById('main-header')); attachGlobalListeners(); renderCart(container); };
        document.getElementById('go-checkout').onclick = () => navigateTo('checkout');
    }, 100);
}

function renderCheckout(container) {
    if (cart.length === 0) {
        navigateTo('cart');
        return;
    }
    let total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    container.innerHTML = '<div class="max-w-2xl mx-auto px-4 py-8"><div class="bg-white p-8 rounded-2xl shadow-md border border-gray-100"><h2 class="text-2xl font-bold mb-2 text-gray-900">Checkout</h2><p class="text-gray-600 mb-6">Order Total: <span class="font-bold text-green-600 text-xl">KES ' + total + '</span></p><form id="checkout-form" class="space-y-4"><textarea id="delivery-info" placeholder="Delivery Address and Instructions" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows="3" required></textarea><button type="submit" class="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium transition">Place Order</button></form><div id="checkout-msg" class="mt-4 text-center text-sm"></div></div></div>';

    setTimeout(() => {
        document.getElementById('checkout-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const msg = document.getElementById('checkout-msg');
            msg.textContent = 'Processing order...';
            msg.className = 'mt-4 text-center text-sm text-blue-600';
            
            try {
                const orderData = {
                    buyer_id: currentUser.id,
                    total_amount: total,
                    payment_status: 'pending',
                    order_status: 'pending',
                    delivery_info: { address: document.getElementById('delivery-info').value }
                };
                await orderService.createOrder(orderData, cart);
                cart = [];
                msg.textContent = 'Order placed successfully!';
                msg.className = 'mt-4 text-center text-sm text-green-600';
                renderAuthenticatedHeader(document.getElementById('main-header'));
                attachGlobalListeners();
                setTimeout(() => navigateTo('orders'), 1500);
            } catch (err) {
                msg.textContent = 'Error: ' + err.message;
                msg.className = 'mt-4 text-center text-sm text-red-600';
            }
        });
    }, 100);
}

async function renderMyOrders(container) {
    container.innerHTML = '<div class="max-w-4xl mx-auto px-4 py-8"><h2 class="text-3xl font-bold mb-2 text-gray-900">My Orders</h2><p class="text-gray-500">Loading...</p></div>';
    try {
        const orders = await orderService.getOrdersByBuyer(currentUser.id);
        if (orders.length === 0) {
            container.innerHTML = '<div class="max-w-4xl mx-auto px-4 py-8"><div class="bg-white p-12 rounded-2xl shadow-md text-center"><h2 class="text-2xl font-bold mb-4 text-gray-900">No Orders Yet</h2><p class="text-gray-600">Your order history will appear here.</p></div></div>';
            return;
        }
        let html = orders.map(o => {
            const items = o.order_items.map(i => '<li class="text-sm text-gray-600">' + i.quantity + 'x ' + i.products.name + ' (KES ' + i.unit_price + ')</li>').join('');
            const statusColor = o.order_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : o.order_status === 'confirmed' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
            return '<div class="bg-white p-6 rounded-xl shadow-md border border-gray-200 mb-4"><div class="flex justify-between items-start mb-4"><div><h3 class="font-bold text-gray-900">Order #' + o.id.substring(0, 8) + '</h3><p class="text-xs text-gray-500">' + new Date(o.created_at).toLocaleDateString() + '</p></div><span class="px-3 py-1 rounded-full text-xs font-semibold ' + statusColor + '">' + o.order_status + '</span></div><ul class="mb-4 space-y-1">' + items + '</ul><div class="flex justify-between items-center border-t border-gray-100 pt-4"><span class="font-bold text-gray-900">Total: KES ' + o.total_amount + '</span><span class="text-xs text-gray-500">Payment: ' + o.payment_status + '</span></div></div>';
        }).join('');
        container.innerHTML = '<div class="max-w-4xl mx-auto px-4 py-8"><h2 class="text-3xl font-bold mb-2 text-gray-900">My Orders</h2><p class="text-gray-600 mb-6">Track your purchases</p>' + html + '</div>';
    } catch (err) {
        container.innerHTML = '<p class="text-red-600 text-center mt-10">Error: ' + err.message + '</p>';
    }
}

async function renderSellerOrders(container) {
    container.innerHTML = '<div class="max-w-4xl mx-auto px-4 py-8"><h2 class="text-3xl font-bold mb-2 text-gray-900">Seller Orders</h2><p class="text-gray-500">Loading...</p></div>';
    try {
        const orders = await orderService.getOrdersForSeller(currentUser.id);
        if (orders.length === 0) {
            container.innerHTML = '<div class="max-w-4xl mx-auto px-4 py-8"><div class="bg-white p-12 rounded-2xl shadow-md text-center"><h2 class="text-2xl font-bold mb-4 text-gray-900">No Incoming Orders</h2><p class="text-gray-600">Orders for your products will appear here.</p></div></div>';
            return;
        }
        let html = orders.map(o => {
            const items = o.order_items.map(i => '<li class="text-sm text-gray-600">' + i.quantity + 'x ' + i.products.name + '</li>').join('');
            const buyerName = o.buyer?.[0]?.full_name || 'Unknown';
            return '<div class="bg-white p-6 rounded-xl shadow-md border border-gray-200 mb-4"><div class="flex justify-between items-start mb-4"><div><h3 class="font-bold text-gray-900">Order #' + o.id.substring(0, 8) + '</h3><p class="text-sm text-gray-600">Buyer: ' + buyerName + '</p><p class="text-xs text-gray-500">' + new Date(o.created_at).toLocaleDateString() + '</p></div><span class="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">' + o.order_status + '</span></div><ul class="mb-4 space-y-1">' + items + '</ul><div class="flex justify-between items-center border-t border-gray-100 pt-4"><span class="font-bold text-gray-900">Total: KES ' + o.total_amount + '</span><select class="update-status border border-gray-300 rounded px-3 py-1 text-sm" data-id="' + o.id + '"><option value="pending" ' + (o.order_status === 'pending' ? 'selected' : '') + '>Pending</option><option value="confirmed" ' + (o.order_status === 'confirmed' ? 'selected' : '') + '>Confirmed</option><option value="shipped" ' + (o.order_status === 'shipped' ? 'selected' : '') + '>Shipped</option><option value="delivered" ' + (o.order_status === 'delivered' ? 'selected' : '') + '>Delivered</option></select></div></div>';
        }).join('');
        container.innerHTML = '<div class="max-w-4xl mx-auto px-4 py-8"><h2 class="text-3xl font-bold mb-2 text-gray-900">Seller Orders</h2><p class="text-gray-600 mb-6">Manage incoming orders</p>' + html + '</div>';
        
        setTimeout(() => {
            document.querySelectorAll('.update-status').forEach(select => {
                select.addEventListener('change', async (e) => {
                    try {
                        await orderService.updateOrderStatus(select.getAttribute('data-id'), select.value);
                        alert('Order status updated to ' + select.value);
                        renderSellerOrders(container);
                    } catch (err) {
                        alert('Error: ' + err.message);
                    }
                });
            });
        }, 100);
    } catch (err) {
        container.innerHTML = '<p class="text-red-600 text-center mt-10">Error: ' + err.message + '</p>';
    }
}

// ... (Keep the existing My Business, Add Product, and Auth Modal functions from the previous version here to ensure the file is complete. For brevity in this prompt, assume they are copied exactly as they were in the final-app.cjs) ...

async function renderMyBusiness(container) {
    container.innerHTML = '<div class="max-w-7xl mx-auto px-4 py-8"><h2 class="text-3xl font-bold mb-2 text-gray-900">My Business</h2><p class="text-gray-500">Loading...</p></div>';
    try {
        const businesses = await businessService.getMyBusinesses(currentUser.id);
        if (businesses.length === 0) {
            container.innerHTML = '<div class="max-w-3xl mx-auto px-4 py-8"><div class="bg-white p-8 rounded-2xl shadow-md border border-gray-100"><h2 class="text-2xl font-bold mb-2 text-gray-900">Register Your Business</h2><p class="text-gray-600 mb-6">Create your business profile to start selling</p><form id="biz-form" class="space-y-4"><input type="text" id="biz-name" placeholder="Business Name" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required><textarea id="biz-desc" placeholder="Description" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows="3" required></textarea><input type="text" id="biz-address" placeholder="Address / Location" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required><button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium transition">Register Business</button></form><div id="biz-msg" class="mt-4 text-center text-sm"></div></div></div>';
            setTimeout(() => {
                document.getElementById('biz-form').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const msg = document.getElementById('biz-msg');
                    msg.textContent = 'Registering...';
                    msg.className = 'mt-4 text-center text-sm text-blue-600';
                    try {
                        await businessService.createBusiness({ owner_id: currentUser.id, name: document.getElementById('biz-name').value, description: document.getElementById('biz-desc').value, address: document.getElementById('biz-address').value, status: 'active' });
                        msg.textContent = 'Success!';
                        msg.className = 'mt-4 text-center text-sm text-green-600';
                        setTimeout(() => renderMyBusiness(container), 1500);
                    } catch (err) {
                        msg.textContent = 'Error: ' + err.message;
                        msg.className = 'mt-4 text-center text-sm text-red-600';
                    }
                });
            }, 100);
        } else {
            let html = businesses.map(b => '<div class="bg-white p-6 rounded-xl shadow-md border border-gray-200 mb-4 card-hover"><h3 class="text-xl font-bold text-gray-900">' + b.name + '</h3><p class="text-gray-600 mt-2">' + b.description + '</p><p class="text-sm text-gray-500 mt-2">' + b.address + '</p><span class="inline-block mt-3 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">' + b.status + '</span></div>').join('');
            container.innerHTML = '<div class="max-w-4xl mx-auto px-4 py-8"><h2 class="text-3xl font-bold mb-2 text-gray-900">My Businesses</h2><p class="text-gray-600 mb-6">Manage your business profiles</p>' + html + '</div>';
        }
    } catch (err) {
        container.innerHTML = '<p class="text-red-600 text-center mt-10">Error: ' + err.message + '</p>';
    }
}

async function renderAddProduct(container) {
    try {
        const businesses = await businessService.getMyBusinesses(currentUser.id);
        if (businesses.length === 0) {
            container.innerHTML = '<div class="max-w-2xl mx-auto px-4 py-8 text-center"><div class="bg-white p-8 rounded-2xl shadow-md border border-gray-100"><h2 class="text-2xl font-bold mb-2 text-gray-900">No Business Found</h2><p class="text-gray-600 mb-6">You must register a business before adding products.</p><button id="go-biz-btn" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium">Register Business</button></div></div>';
            setTimeout(() => { document.getElementById('go-biz-btn').onclick = () => navigateTo('my-business'); }, 100);
            return;
        }
        container.innerHTML = '<div class="max-w-2xl mx-auto px-4 py-8"><div class="bg-white p-8 rounded-2xl shadow-md border border-gray-100"><h2 class="text-2xl font-bold mb-2 text-gray-900">Add New Product</h2><p class="text-gray-600 mb-6">List a new item in your marketplace</p><form id="prod-form" class="space-y-4"><select id="prod-biz" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">' + businesses.map(b => '<option value="' + b.id + '">' + b.name + '</option>').join('') + '</select><input type="text" id="prod-name" placeholder="Product Name" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required><textarea id="prod-desc" placeholder="Description" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows="3"></textarea><div class="grid grid-cols-2 gap-4"><input type="number" id="prod-price" placeholder="Price (KES)" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required step="0.01"><input type="number" id="prod-stock" placeholder="Stock Quantity" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required></div><button type="submit" class="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium transition">Add Product</button></form><div id="prod-msg" class="mt-4 text-center text-sm"></div></div></div>';
        setTimeout(() => {
            document.getElementById('prod-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const msg = document.getElementById('prod-msg');
                msg.textContent = 'Adding product...';
                msg.className = 'mt-4 text-center text-sm text-blue-600';
                try {
                    await productService.createProduct({ business_id: document.getElementById('prod-biz').value, name: document.getElementById('prod-name').value, description: document.getElementById('prod-desc').value, price: parseFloat(document.getElementById('prod-price').value), stock_quantity: parseInt(document.getElementById('prod-stock').value), is_active: true });
                    msg.textContent = 'Product added successfully!';
                    msg.className = 'mt-4 text-center text-sm text-green-600';
                    document.getElementById('prod-form').reset();
                } catch (err) {
                    msg.textContent = 'Error: ' + err.message;
                    msg.className = 'mt-4 text-center text-sm text-red-600';
                }
            });
        }, 100);
    } catch (err) {
        container.innerHTML = '<p class="text-red-600 text-center mt-10">Error: ' + err.message + '</p>';
    }
}

function showAuthModal(type) {
    const modal = document.createElement('div');
    modal.id = 'auth-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = '<div class="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full relative"><button id="close-modal-btn" class="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl">&times;</button><h2 class="text-2xl font-bold mb-6 text-center text-gray-900">' + (type === 'login' ? 'Welcome Back' : 'Create Account') + '</h2><div class="space-y-4"><input type="email" id="modal-email" placeholder="Email Address" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required><input type="password" id="modal-password" placeholder="Password (min 6 characters)" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required><input type="text" id="modal-fullname" placeholder="Full Name" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (type === 'login' ? 'hidden' : '') + '"><button id="modal-submit" class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium">' + (type === 'login' ? 'Login' : 'Register') + '</button></div><div id="modal-msg" class="mt-4 text-center text-sm min-h-[20px]"></div><div class="mt-6 text-center text-sm text-gray-600">' + (type === 'login' ? "Don't have an account? " : "Already have an account? ") + '<button id="modal-toggle" class="text-blue-600 hover:underline font-medium">' + (type === 'login' ? 'Register' : 'Login') + '</button></div></div>';
    document.body.appendChild(modal);
    
    setTimeout(() => {
        document.getElementById('close-modal-btn').addEventListener('click', closeAuthModal);
        document.getElementById('modal-submit').addEventListener('click', () => handleModalAuth(type));
        document.getElementById('modal-toggle').addEventListener('click', () => { closeAuthModal(); showAuthModal(type === 'login' ? 'register' : 'login'); });
    }, 50);
}

function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.remove();
}

async function handleModalAuth(type) {
    const email = document.getElementById('modal-email').value.trim();
    const password = document.getElementById('modal-password').value;
    const fullName = document.getElementById('modal-fullname')?.value.trim();
    const msg = document.getElementById('modal-msg');
    const isRegister = type === 'register';

    if (!email || !password || (isRegister && !fullName)) {
        msg.textContent = 'Please fill in all required fields.';
        msg.className = 'mt-4 text-center text-sm text-red-600';
        return;
    }

    try {
        msg.textContent = 'Processing...';
        msg.className = 'mt-4 text-center text-sm text-blue-600';

        if (isRegister) {
            await authService.signUp(email, password, fullName);
            msg.textContent = 'Registration successful! Logging you in...';
            msg.className = 'mt-4 text-center text-sm text-green-600';
            setTimeout(() => { closeAuthModal(); initApp(); }, 1500);
        } else {
            await authService.signIn(email, password);
            closeAuthModal();
            initApp();
        }
    } catch (err) {
        msg.textContent = 'Error: ' + err.message;
        msg.className = 'mt-4 text-center text-sm text-red-600';
    }
}

async function handleLogout() {
    await authService.signOut();
    cart = [];
    initApp();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
`);

console.log('\nSprint 5 Update Complete.');
console.log('Next: Refresh your browser at http://localhost:3000');