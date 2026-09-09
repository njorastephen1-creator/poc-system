const fs = require('fs');

console.log('[INFO] Fixing Groups feature and adding Create button...\n');

// 1. Update the Group Service
let service = fs.readFileSync('src/services/group.service.js', 'utf8');
if (!service.includes('createGroup')) {
    const newMethods = `
    async createGroup(groupData) {
        const { data, error } = await supabase.from('groups').insert([groupData]).select().single();
        if (error) throw error;
        return data;
    },
    async addBenefit(benefitData) {
        const { data, error } = await supabase.from('group_benefits').insert([benefitData]).select().single();
        if (error) throw error;
        return data;
    },`;
    service = service.replace('export const groupService = {', 'export const groupService = {' + newMethods);
    fs.writeFileSync('src/services/group.service.js', service);
    console.log('[SUCCESS] Updated group.service.js with creation methods.');
}

// 2. Update Main.js with the new Render Groups function
let main = fs.readFileSync('src/main.js', 'utf8');

const startMarker = 'async function renderGroups(container) {';
const endMarker = 'function showAuthModal(type) {';

const startIdx = main.indexOf(startMarker);
const endIdx = main.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
    const newRenderGroups = `async function renderGroups(container) {
    container.innerHTML = '<div class="max-w-6xl mx-auto px-4 py-8"><div class="flex justify-between items-center mb-6"><div><h2 class="text-3xl font-bold text-gray-900">Community Groups</h2><p class="text-gray-600 mt-1">Join groups to unlock exclusive benefits</p></div><button id="create-group-btn" class="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>Create Group</button></div><div id="groups-list" class="space-y-4">Loading...</div></div>';
    
    await loadGroups();
    
    document.getElementById('create-group-btn').addEventListener('click', () => showCreateGroupModal());

    async function loadGroups() {
        try {
            const groups = await groupService.getAllGroups();
            const userGroups = await groupService.getUserGroups(currentUser.id);
            const joinedIds = userGroups.map(g => g.id);
            
            if (groups.length === 0) {
                document.getElementById('groups-list').innerHTML = '<div class="text-center py-12 bg-white rounded-xl border border-gray-200"><p class="text-gray-500">No groups available yet. Be the first to create one!</p></div>';
                return;
            }
            
            const html = groups.map(g => {
                const isJoined = joinedIds.includes(g.id);
                const benefit = g.group_benefits?.[0];
                return '<div class="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition"><div class="flex justify-between items-start"><div class="flex-1"><h3 class="text-xl font-bold text-gray-900">' + g.name + '</h3><p class="text-gray-600 mt-2">' + g.description + '</p>' + (benefit ? '<div class="mt-3 p-3 bg-green-50 rounded-lg border border-green-200"><p class="text-sm font-bold text-green-800">Benefit: ' + benefit.title + '</p><p class="text-xs text-green-700">' + benefit.description + '</p></div>' : '') + '</div><button class="join-btn ml-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 ' + (isJoined ? 'opacity-50 cursor-not-allowed' : '') + '" data-id="' + g.id + '" ' + (isJoined ? 'disabled' : '') + '>' + (isJoined ? 'Joined' : 'Join Group') + '</button></div></div>';
            }).join('');
            
            document.getElementById('groups-list').innerHTML = html;
            
            document.querySelectorAll('.join-btn:not([disabled])').forEach(btn => {
                btn.addEventListener('click', async () => {
                    try {
                        await groupService.joinGroup(btn.getAttribute('data-id'), currentUser.id);
                        loadGroups();
                    } catch (err) { alert('Error: ' + err.message); }
                });
            });
        } catch (err) {
            document.getElementById('groups-list').innerHTML = '<p class="text-red-600 text-center py-8">Error: ' + err.message + '</p>';
        }
    }
    
    function showCreateGroupModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.innerHTML = '<div class="bg-white p-6 rounded-xl shadow-xl max-w-lg w-full"><h3 class="text-xl font-bold mb-4">Create New Group</h3><form id="create-group-form" class="space-y-4"><div><label class="block text-sm font-medium text-gray-700 mb-1">Group Name</label><input type="text" id="group-name" placeholder="e.g., Nairobi Farmers" class="w-full p-2.5 border border-gray-300 rounded-lg text-sm" required></div><div><label class="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea id="group-desc" placeholder="Describe your group..." class="w-full p-2.5 border border-gray-300 rounded-lg text-sm" rows="3" required></textarea></div><div><label class="block text-sm font-medium text-gray-700 mb-1">Benefit Title</label><input type="text" id="benefit-title" placeholder="e.g., 10% Discount" class="w-full p-2.5 border border-gray-300 rounded-lg text-sm" required></div><div><label class="block text-sm font-medium text-gray-700 mb-1">Benefit Description</label><textarea id="benefit-desc" placeholder="Describe the benefit..." class="w-full p-2.5 border border-gray-300 rounded-lg text-sm" rows="2" required></textarea></div><div class="flex gap-3"><button type="submit" class="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700">Create Group</button><button type="button" id="cancel-create" class="flex-1 bg-gray-200 text-gray-800 py-2.5 rounded-lg font-medium hover:bg-gray-300">Cancel</button></div></form></div>';
        document.body.appendChild(modal);
        
        document.getElementById('cancel-create').addEventListener('click', () => modal.remove());
        
        document.getElementById('create-group-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            btn.textContent = 'Creating...'; btn.disabled = true;
            try {
                const group = await groupService.createGroup({ name: document.getElementById('group-name').value, description: document.getElementById('group-desc').value, status: 'active' });
                await groupService.addBenefit({ group_id: group.id, title: document.getElementById('benefit-title').value, description: document.getElementById('benefit-desc').value, benefit_type: 'percentage_discount', value: 10, is_active: true });
                modal.remove();
                loadGroups();
            } catch (err) { alert('Error: ' + err.message); btn.textContent = 'Create Group'; btn.disabled = false; }
        });
    }
}`;

    const before = main.substring(0, startIdx);
    const after = main.substring(endIdx);
    main = before + newRenderGroups + '\n\n' + after;
    fs.writeFileSync('src/main.js', main);
    console.log('[SUCCESS] Replaced renderGroups function in main.js.');
} else {
    console.log('[ERROR] Could not find the exact function markers to replace.');
}

console.log('[COMPLETE] Please hard refresh your browser (Ctrl + F5).');