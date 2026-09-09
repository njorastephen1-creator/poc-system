const fs = require('fs');

console.log('Fixing Sprint 6 Navigation Links...\n');

let code = fs.readFileSync('src/main.js', 'utf8');

// 1. Fix the Navigation IDs array to include the new links
code = code.replace(
    /const ids = \[[^\]]+\];/, 
    "const ids = ['nav-home', 'nav-dashboard', 'nav-marketplace', 'nav-map', 'nav-groups', 'nav-my-business', 'nav-add-product', 'nav-cart', 'nav-orders', 'nav-seller-orders', 'nav-login-btn', 'nav-register-btn', 'nav-logout-btn', 'close-modal-btn', 'hero-register-btn'];"
);

// 2. Fix the handleNavigation function to route the new clicks
code = code.replace(
    /else if \(id === 'nav-add-product'\) navigateTo\('add-product'\);/g, 
    "else if (id === 'nav-map') navigateTo('map'); else if (id === 'nav-groups') navigateTo('groups'); else if (id === 'nav-add-product') navigateTo('add-product');"
);

// 3. Fix the renderView switch statement to render the new pages
code = code.replace(
    /else if \(view === 'add-product'\) renderAddProduct\(container\);/g, 
    "else if (view === 'map') renderMap(container); else if (view === 'groups') renderGroups(container); else if (view === 'add-product') renderAddProduct(container);"
);

// 4. Fix the Header HTML to actually show the links
const oldNav = '<a href="#" id="nav-my-business" class="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">My Business</a><a href="#" id="nav-add-product" class="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">Add Product</a>';
const newNav = '<a href="#" id="nav-map" class="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">Map</a><a href="#" id="nav-groups" class="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">Groups</a><a href="#" id="nav-my-business" class="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">My Business</a><a href="#" id="nav-add-product" class="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">Add Product</a>';
code = code.replace(oldNav, newNav);

// 5. Fix Leaflet Map Scope (ES Modules require window.L)
code = code.replace(/if \(typeof L === 'undefined'\)/g, "if (typeof window.L === 'undefined')");
code = code.replace(/const map = L\.map/g, "const map = window.L.map");
code = code.replace(/L\.tileLayer/g, "window.L.tileLayer");
code = code.replace(/L\.marker/g, "window.L.marker");

fs.writeFileSync('src/main.js', code);
console.log('[SUCCESS] Navigation links and Map logic fixed successfully!');