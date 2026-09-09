const fs = require('fs');
const path = require('path');

function writeFile(filePath, content) {
    const fullPath = path.join(__dirname, filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, content);
    console.log('Updated: ' + filePath);
}

console.log('Starting Sprint 4: Business & Product Management...\n');

// 1. Create Business Service
writeFile('src/services/business.service.js', `import { supabase } from '../config/supabase.client.js';

export const businessService = {
    async createBusiness(businessData) {
        const { data, error } = await supabase
            .from('businesses')
            .insert([businessData])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async getMyBusinesses(ownerId) {
        const { data, error } = await supabase
            .from('businesses')
            .select('*')
            .eq('owner_id', ownerId);
        if (error) throw error;
        return data;
    },

    async getAllActiveBusinesses() {
        const { data, error } = await supabase
            .from('businesses')
            .select('*, categories(name)')
            .eq('status', 'active');
        if (error) throw error;
        return data;
    }
};
`);

// 2. Create Product Service
writeFile('src/services/product.service.js', `import { supabase } from '../config/supabase.client.js';

export const productService = {
    async createProduct(productData) {
        const { data, error } = await supabase
            .from('products')
            .insert([productData])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async getProductsByBusiness(businessId) {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('business_id', businessId);
        if (error) throw error;
        return data;
    },

    async getAllActiveProducts() {
        const { data, error } = await supabase
            .from('products')
            .select('*, businesses(name, owner_id)')
            .eq('is_active', true);
        if (error) throw error;
        return data;
    },

    async updateStock(productId, newStock) {
        const { data, error } = await supabase
            .from('products')
            .update({ stock_quantity: newStock })
            .eq('id', productId)
            .select()
            .single();
        if (error) throw error;
        return data;
    }
};
`);

// 3. Update Main App Logic
writeFile('src/main.js', `import './assets/css/style.css';
import { authService } from './services/auth.service.js';
import { businessService } from './services/business.service.js';
import { productService } from './services/product.service.js';

let currentUser = null;
let currentView = 'dashboard';

async function initApp() {
    const headerEl = document.getElementById('main-header');
    const contentEl = document.getElementById('main-content');

    try {
        const session = await authService.getSession();
        currentUser = session?.user || null;

        if (currentUser) {
            renderAuthenticatedHeader(headerEl);
            renderView(contentEl, currentView);
        } else {
            renderPublicHeader(headerEl);
            showLandingPage(contentEl);
        }
        
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
    
    // Navigation listeners
    document.getElementById('nav-dashboard')?.addEventListener('click', (e) => { e.preventDefault(); navigateTo('dashboard'); });
    document.getElementById('nav-marketplace')?.addEventListener('click', (e) => { e.preventDefault(); navigateTo('marketplace'); });
    document.getElementById('nav-my-business')?.addEventListener('click', (e) => { e.preventDefault(); navigateTo('my-business'); });
    document.getElementById('nav-add-product')?.addEventListener('click', (e) => { e.preventDefault(); navigateTo('add-product'); });
}

function navigateTo(view) {
    currentView = view;
    const contentEl = document.getElementById('main-content');
    renderView(contentEl, view);
}

function renderView(container, view) {
    switch(view) {
        case 'dashboard': showDashboard(container); break;
        case 'marketplace': renderMarketplace(container); break;
        case 'my-business': renderMyBusiness(container); break;
        case 'add-product': renderAddProduct(container); break;
        default: showDashboard(container);
    }
}

// --- Header Renderers ---

function renderPublicHeader(headerEl) {
    headerEl.innerHTML = \`
        <div class="bg-white shadow">
            <div class="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
                <div class="flex items-center gap-2 cursor-pointer" onclick="location.reload()">
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
            <div class="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
                <div class="flex items-center gap-2 cursor-pointer" onclick="location.reload()">
                    <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">P</div>
                    <h1 class="text-xl font-bold text-gray-800">Platform POC</h1>
                </div>
                <nav class="flex flex-wrap justify-center gap-4 text-sm font-medium text-gray-600">
                    <a href="#" id="nav-dashboard" class="hover:text-blue-600">Dashboard</a>
                    <a href="#" id="nav-marketplace" class="hover:text-blue-600">Marketplace</a>
                    <a href="#" id="nav-my-business" class="hover:text-blue-600">My Business</a>
                    <a href="#" id="nav-add-product" class="hover:text-blue-600">Add Product</a>
                </nav>
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
        <div class="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-20 px-4">
            <div class="max-w-6xl mx-auto text-center">
                <h2 class="text-4xl md:text-5xl font-bold mb-4">Your Community. Your Marketplace. Your Benefits.</h2>
                <p class="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">Connect with local businesses, join community groups, and unlock exclusive group benefits.</p>
                <div class="flex flex-col sm:flex-row justify-center gap-4">
                    <button id="hero-register-btn" class="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 transition">Get Started</button>
                </div>
            </div>
        </div>
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
    document.getElementById('hero-register-btn').addEventListener('click', () => showAuthModal('register'));
}

function showDashboard(container) {
    container.innerHTML = \`
        <div class="max-w-6xl mx-auto px-4 py-8">
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h2 class="text-2xl font-bold mb-4 text-gray-800">Dashboard</h2>
                <p class="text-green-600 mb-6 font-medium">System is ready. You are successfully authenticated.</p>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div class="bg-blue-50 p-4 rounded border border-blue-200 cursor-pointer hover:shadow-md transition" onclick="document.getElementById('nav-marketplace').click()">
                        <h3 class="font-bold text-blue-900">Marketplace</h3>
                        <p class="text-sm text-blue-700 mt-1">Browse products and services.</p>
                    </div>
                    <div class="bg-green-50 p-4 rounded border border-green-200 cursor-pointer hover:shadow-md transition" onclick="document.getElementById('nav-my-business').click()">
                        <h3 class="font-bold text-green-900">My Business</h3>
                        <p class="text-sm text-green-700 mt-1">Manage your business profile.</p>
                    </div>
                    <div class="bg-purple-50 p-4 rounded border border-purple-200 cursor-pointer hover:shadow-md transition" onclick="document.getElementById('nav-add-product').click()">
                        <h3 class="font-bold text-purple-900">Add Product</h3>
                        <p class="text-sm text-purple-700 mt-1">List new items for sale.</p>
                    </div>
                </div>

                <div class="mt-8 p-4 bg-gray-50 rounded border border-gray-200">
                    <h3 class="font-bold mb-2 text-gray-800">Development Progress</h3>
                    <ul class="text-sm text-gray-700 space-y-1">
                        <li>[x] Sprint 1: Database Setup</li>
                        <li>[x] Sprint 2: Authentication</li>
                        <li>[x] Sprint 3: Landing Page & Navigation</li>
                        <li>[x] Sprint 4: Business & Product Management</li>
                        <li>[ ] Sprint 5: Shopping Cart & Orders</li>
                        <li>[ ] Sprint 6: Location & Groups</li>
                    </ul>
                </div>
            </div>
        </div>
    \`;
}

async function renderMarketplace(container) {
    container.innerHTML = '<div class="max-w-6xl mx-auto px-4 py-8"><h2 class="text-2xl font-bold mb-6">Marketplace</h2><p class="text-gray-500">Loading products...</p></div>';
    
    try {
        const products = await productService.getAllActiveProducts();
        
        if (products.length === 0) {
            container.innerHTML = '<div class="max-w-6xl mx-auto px-4 py-8"><h2 class="text-2xl font-bold mb-6">Marketplace</h2><p class="text-gray-500">No products available yet. Be the first to add one!</p></div>';
            return;
        }

        let productsHtml = products.map(p => \`
            <div class="bg-white p-4 rounded-lg shadow border border-gray-200">
                <div class="h-40 bg-gray-200 rounded mb-4 flex items-center justify-center text-gray-400">No Image</div>
                <h3 class="font-bold text-lg">\${p.name}</h3>
                <p class="text-sm text-gray-600 mb-2">\${p.businesses?.name || 'Unknown Business'}</p>
                <p class="text-green-600 font-bold text-xl">KES \${p.price}</p>
                <p class="text-xs text-gray-500 mt-2">Stock: \${p.stock_quantity}</p>
            </div>
        \`).join('');

        container.innerHTML = \`
            <div class="max-w-6xl mx-auto px-4 py-8">
                <h2 class="text-2xl font-bold mb-6">Marketplace</h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    \${productsHtml}
                </div>
            </div>
        \`;
    } catch (err) {
        container.innerHTML = '<p class="text-red-600 text-center mt-10">Error loading products: ' + err.message + '</p>';
    }
}

async function renderMyBusiness(container) {
    container.innerHTML = '<div class="max-w-6xl mx-auto px-4 py-8"><h2 class="text-2xl font-bold mb-6">My Business</h2><p class="text-gray-500">Loading...</p></div>';
    
    try {
        const businesses = await businessService.getMyBusinesses(currentUser.id);
        
        if (businesses.length === 0) {
            container.innerHTML = \`
                <div class="max-w-2xl mx-auto px-4 py-8">
                    <h2 class="text-2xl font-bold mb-6">Register Your Business</h2>
                    <form id="business-form" class="bg-white p-6 rounded-lg shadow-md space-y-4">
                        <input type="text" id="biz-name" placeholder="Business Name" class="w-full p-2 border rounded" required>
                        <textarea id="biz-desc" placeholder="Description" class="w-full p-2 border rounded" rows="3" required></textarea>
                        <input type="text" id="biz-address" placeholder="Address / Location" class="w-full p-2 border rounded" required>
                        <select id="biz-category" class="w-full p-2 border rounded">
                            <option value="">Select Category</option>
                            <option value="Food & Beverages">Food & Beverages</option>
                            <option value="Retail">Retail</option>
                            <option value="Services">Services</option>
                            <option value="Agriculture">Agriculture</option>
                        </select>
                        <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Register Business</button>
                    </form>
                    <div id="biz-message" class="mt-4 text-center text-sm"></div>
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
                        category_id: null, // Simplified for POC
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

        // Show existing businesses
        let bizHtml = businesses.map(b => \`
            <div class="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-4">
                <h3 class="text-xl font-bold text-gray-800">\${b.name}</h3>
                <p class="text-gray-600 mt-2">\${b.description}</p>
                <p class="text-sm text-gray-500 mt-2">Location: \${b.address}</p>
                <span class="inline-block mt-3 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">\${b.status}</span>
            </div>
        \`).join('');

        container.innerHTML = \`
            <div class="max-w-4xl mx-auto px-4 py-8">
                <h2 class="text-2xl font-bold mb-6">My Businesses</h2>
                \${bizHtml}
            </div>
        \`;

    } catch (err) {
        container.innerHTML = '<p class="text-red-600 text-center mt-10">Error: ' + err.message + '</p>';
    }
}

async function renderAddProduct(container) {
    // Check if user has a business first
    const businesses = await businessService.getMyBusinesses(currentUser.id);
    
    if (businesses.length === 0) {
        container.innerHTML = \`
            <div class="max-w-2xl mx-auto px-4 py-8 text-center">
                <h2 class="text-2xl font-bold mb-4">No Business Found</h2>
                <p class="text-gray-600 mb-6">You must register a business before adding products.</p>
                <button id="go-to-biz-btn" class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Register Business</button>
            </div>
        \`;
        document.getElementById('go-to-biz-btn').addEventListener('click', () => navigateTo('my-business'));
        return;
    }

    container.innerHTML = \`
        <div class="max-w-2xl mx-auto px-4 py-8">
            <h2 class="text-2xl font-bold mb-6">Add New Product</h2>
            <form id="product-form" class="bg-white p-6 rounded-lg shadow-md space-y-4">
                <select id="prod-business" class="w-full p-2 border rounded">
                    \${businesses.map(b => \`<option value="\${b.id}">\${b.name}</option>\`).join('')}
                </select>
                <input type="text" id="prod-name" placeholder="Product Name" class="w-full p-2 border rounded" required>
                <textarea id="prod-desc" placeholder="Description" class="w-full p-2 border rounded" rows="3"></textarea>
                <div class="grid grid-cols-2 gap-4">
                    <input type="number" id="prod-price" placeholder="Price (KES)" class="w-full p-2 border rounded" required step="0.01">
                    <input type="number" id="prod-stock" placeholder="Stock Quantity" class="w-full p-2 border rounded" required>
                </div>
                <button type="submit" class="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">Add Product</button>
            </form>
            <div id="prod-message" class="mt-4 text-center text-sm"></div>
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

console.log('\nSprint 4 Update Complete.');
console.log('Next: Refresh your browser at http://localhost:3000');