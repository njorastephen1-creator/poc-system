const fs = require('fs');

console.log('Updating Add Product Form...\n');

let content = fs.readFileSync('src/main.js', 'utf8');

const newRenderAddProduct = `async function renderAddProduct(container) {
    try {
        const businesses = await businessService.getMyBusinesses(currentUser.id);
        if (businesses.length === 0) {
            container.innerHTML = '<div class="max-w-2xl mx-auto px-4 py-8 text-center"><div class="bg-white p-8 rounded-2xl shadow-md border border-gray-100"><h2 class="text-2xl font-bold mb-2 text-gray-900">No Business Found</h2><p class="text-gray-600 mb-6">You must register a business before adding products.</p><button id="go-biz-btn" class="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium">Register Business</button></div></div>';
            setTimeout(() => { document.getElementById('go-biz-btn').onclick = () => navigateTo('my-business'); }, 100);
            return;
        }
        
        const categories = ['Food & Beverages', 'Retail', 'Services', 'Agriculture'];
        const categoryOptions = categories.map(c => '<option value="' + c + '">' + c + '</option>').join('');
        const businessOptions = businesses.map(b => '<option value="' + b.id + '">' + b.name + '</option>').join('');

        container.innerHTML = '<div class="max-w-3xl mx-auto px-4 py-8"><div class="bg-white p-8 rounded-2xl shadow-md border border-gray-100"><h2 class="text-2xl font-bold mb-2 text-gray-900">Add New Product</h2><p class="text-gray-600 mb-6">List a new item in your marketplace</p><form id="prod-form" class="space-y-4"><div><label class="block text-sm font-medium text-gray-700 mb-1">Select Business</label><select id="prod-biz" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>' + businessOptions + '</select></div><div><label class="block text-sm font-medium text-gray-700 mb-1">Product Name</label><input type="text" id="prod-name" placeholder="e.g., Fresh Tomatoes" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required></div><div><label class="block text-sm font-medium text-gray-700 mb-1">Category</label><select id="prod-category" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required><option value="">Select Category</option>' + categoryOptions + '</select></div><div><label class="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea id="prod-desc" placeholder="Describe your product..." class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows="3"></textarea></div><div><label class="block text-sm font-medium text-gray-700 mb-1">Image URL (Optional)</label><input type="url" id="prod-image" placeholder="https://example.com/image.jpg" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"></div><div class="grid grid-cols-2 gap-4"><div><label class="block text-sm font-medium text-gray-700 mb-1">Price (KES)</label><input type="number" id="prod-price" placeholder="0.00" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required step="0.01"></div><div><label class="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label><input type="number" id="prod-stock" placeholder="0" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required></div></div><button type="submit" class="w-full bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 font-medium transition mt-4">Add Product</button></form><div id="prod-msg" class="mt-4 text-center text-sm"></div></div></div>';
        
        setTimeout(() => {
            document.getElementById('prod-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const msg = document.getElementById('prod-msg');
                msg.textContent = 'Adding product...';
                msg.className = 'mt-4 text-center text-sm text-blue-600';
                try {
                    await productService.createProduct({ 
                        business_id: document.getElementById('prod-biz').value, 
                        name: document.getElementById('prod-name').value, 
                        category_name: document.getElementById('prod-category').value,
                        description: document.getElementById('prod-desc').value, 
                        image_url: document.getElementById('prod-image').value,
                        price: parseFloat(document.getElementById('prod-price').value), 
                        stock_quantity: parseInt(document.getElementById('prod-stock').value), 
                        is_active: true 
                    });
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
}`;

const startMarker = 'async function renderAddProduct(container) {';
const endMarker = 'function showAuthModal(type) {';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const before = content.substring(0, startIndex);
    const after = content.substring(endIndex);
    const newContent = before + newRenderAddProduct + '\n\n' + after;
    fs.writeFileSync('src/main.js', newContent);
    console.log('Add Product Form updated successfully!');
} else {
    console.log('Error: Could not find the target functions in main.js');
}