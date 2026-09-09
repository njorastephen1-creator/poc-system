const fs = require('fs');

console.log('[INFO] Updating Group Benefits to support specific products...\n');

// 1. Update main.js renderGroups function
let mainJs = fs.readFileSync('src/main.js', 'utf8');

// Find the showCreateGroupModal function and update the HTML/Form
const oldModalStart = 'function showCreateGroupModal() {';
const oldModalEnd = 'document.getElementById(\'create-group-form\').addEventListener(\'submit\', async (e) => {';

const modalIndex = mainJs.indexOf(oldModalStart);
const formIndex = mainJs.indexOf(oldModalEnd);

if (modalIndex !== -1 && formIndex !== -1) {
    const beforeForm = mainJs.substring(0, formIndex);
    const afterForm = mainJs.substring(formIndex);
    
    const newFormHandler = `document.getElementById('create-group-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            btn.textContent = 'Creating...'; btn.disabled = true;
            try {
                const groupName = document.getElementById('group-name').value;
                const groupDesc = document.getElementById('group-desc').value;
                const benefitTitle = document.getElementById('benefit-title').value;
                const benefitDesc = document.getElementById('benefit-desc').value;
                const targetProduct = document.getElementById('target-product').value; // New field
                
                // Create group
                const group = await groupService.createGroup({ 
                    name: groupName, 
                    description: groupDesc, 
                    status: 'active' 
                });
                
                // Add benefit with target product
                await groupService.addBenefit({ 
                    group_id: group.id, 
                    title: benefitTitle, 
                    description: benefitDesc, 
                    benefit_type: 'percentage_discount', 
                    value: 10, 
                    is_active: true,
                    target_product_name: targetProduct || null // Save product name
                });
                
                modal.remove();
                loadGroups();
            } catch (err) { alert('Error: ' + err.message); btn.textContent = 'Create Group'; btn.disabled = false; }
        });`;

    const updatedBeforeForm = beforeForm.replace(
        /<div><label class="block text-sm font-medium text-gray-700 mb-1">Benefit Description<\/label><textarea id="benefit-desc" placeholder="Describe the benefit..." class="w-full p-2.5 border border-gray-300 rounded-lg text-sm" rows="2" required><\/textarea><\/div>/,
        `<div><label class="block text-sm font-medium text-gray-700 mb-1">Benefit Description</label><textarea id="benefit-desc" placeholder="e.g., Members get 10% off" class="w-full p-2.5 border border-gray-300 rounded-lg text-sm" rows="2" required></textarea></div><div><label class="block text-sm font-medium text-gray-700 mb-1">Applicable Product (Optional)</label><input type="text" id="target-product" placeholder="e.g., Fresh Tomatoes (Leave blank for all items)" class="w-full p-2.5 border border-gray-300 rounded-lg text-sm"></div>`
    );

    mainJs = updatedBeforeForm + newFormHandler + afterForm;
    fs.writeFileSync('src/main.js', mainJs);
    console.log('[SUCCESS] Updated Create Group modal with Product field.');
}

// 2. Update the Display Logic to show the product name
// We need to find where the benefit is displayed and update the HTML
const displaySearch = 'benefit ? \'<div class="mt-3 p-3 bg-green-50 rounded-lg border border-green-200"><div class="flex items-start gap-2"><svg class="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><div><p class="text-sm font-bold text-green-800">\' + benefit.title + \'</p><p class="text-xs text-green-700">\' + benefit.description + \'</p></div></div></div>\' : \'\'';

const newDisplayLogic = `benefit ? '<div class="mt-3 p-3 bg-green-50 rounded-lg border border-green-200"><div class="flex items-start gap-2"><svg class="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><div><p class="text-sm font-bold text-green-800">' + benefit.title + (benefit.target_product_name ? ' on <span class="font-bold text-green-900">' + benefit.target_product_name + '</span>' : '') + '</p><p class="text-xs text-green-700">' + benefit.description + '</p></div></div></div>' : ''`;

if (mainJs.includes(displaySearch)) {
    mainJs = mainJs.replace(displaySearch, newDisplayLogic);
    fs.writeFileSync('src/main.js', mainJs);
    console.log('[SUCCESS] Updated Group display to show target product.');
} else {
    console.log('[WARNING] Could not find exact display string to replace, manual check might be needed.');
}

console.log('[COMPLETE] Hard refresh your browser (Ctrl + F5) to test.');