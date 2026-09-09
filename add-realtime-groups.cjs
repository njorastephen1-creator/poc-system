const fs = require('fs');

console.log('[INFO] Adding real-time group creation...\n');

// 1. Update group.service.js to add createGroup function
let groupService = fs.readFileSync('src/services/group.service.js', 'utf8');

const createGroupFunction = `
    async createGroup(groupData) {
        const { data, error } = await supabase
            .from('groups')
            .insert([groupData])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async addBenefit(benefitData) {
        const { data, error } = await supabase
            .from('group_benefits')
            .insert([benefitData])
            .select()
            .single();
        if (error) throw error;
        return data;
    },
`;

// Insert after the first function
groupService = groupService.replace(
    'export const groupService = {',
    'export const groupService = {' + createGroupFunction
);

fs.writeFileSync('src/services/group.service.js', groupService);
console.log('[SUCCESS] Updated group.service.js with create functions');

// 2. Update main.js renderGroups function with real-time and creation
let mainJs = fs.readFileSync('src/main.js', 'utf8');

const newRenderGroups = `async function renderGroups(container) {
    container.innerHTML = '<div class="max-w-6xl mx-auto px-4 py-8"><div class="flex justify-between items-center mb-6"><div><h2 class="text-3xl font-bold text-gray-900">Community Groups</h2><p class="text-gray-600 mt-1">Join groups to unlock exclusive benefits</p></div><button id="create-group-btn" class="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>Create Group</button></div><div id="groups-list" class="space-y-4">Loading...</div></div>';
    
    // Load initial groups
    await loadGroups();
    
    // Set up real-time subscription
    const channel = supabase
        .channel('groups')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, () => {
            console.log('[REALTIME] Groups changed, reloading...');
            loadGroups();
        })
        .subscribe();
    
    // Create group button
    document.getElementById('create-group-btn').addEventListener('click', () => showCreateGroupModal());
    
    async function loadGroups() {
        try {
            const groups = await groupService.getAllGroups();
            const userGroups = await groupService.getUserGroups(currentUser.id);
            const joinedIds = userGroups.map(g => g.id);
            
            if (groups.length === 0) {
                document.getElementById('groups-list').innerHTML = '<div class="text-center py-12 bg-white rounded-xl border border-gray-200"><p class="text-gray-500 mb-4">No groups available yet.</p><p class="text-sm text-gray-400">Be the first to create one!</p></div>';
                return;
            }
            
            const html = groups.map(g => {
                const isJoined = joinedIds.includes(g.id);
                const benefit = g.group_benefits?.[0];
                const memberCount = g.group_members?.length || 0;
                return '<div class="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition"><div class="flex justify-between items-start"><div class="flex-1"><div class="flex items-center gap-3"><h3 class="text-xl font-bold text-gray-900">' + g.name + '</h3><span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">' + memberCount + ' members</span></div><p class="text-gray-600 mt-2">' + g.description + '</p>' + (benefit ? '<div class="mt-3 p-3 bg-green-50 rounded-lg border border-green-200"><div class="flex items-start gap-2"><svg class="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><div><p class="text-sm font-bold text-green-800">' + benefit.title + '</p><p class="text-xs text-green-700">' + benefit.description + '</p></div></div></div>' : '') + '</div><button class="join-btn ml-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 ' + (isJoined ? 'opacity-50 cursor-not-allowed' : '') + '" data-id="' + g.id + '" ' + (isJoined ? 'disabled' : '') + '>' + (isJoined ? 'Joined' : 'Join Group') + '</button></div></div>';
            }).join('');
            
            document.getElementById('groups-list').innerHTML = html;
            
            // Attach join handlers
            document.querySelectorAll('.join-btn:not([disabled])').forEach(btn => {
                btn.addEventListener('click', async () => {
                    try {
                        await groupService.joinGroup(btn.getAttribute('data-id'), currentUser.id);
                        loadGroups(); // Reload to show updated member count
                    } catch (err) {
                        alert('Error joining group: ' + err.message);
                    }
                });
            });
        } catch (err) {
            document.getElementById('groups-list').innerHTML = '<p class="text-red-600 text-center py-8">Error loading groups: ' + err.message + '</p>';
        }
    }
    
    function showCreateGroupModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.innerHTML = '<div class="bg-white p-6 rounded-xl shadow-xl max-w-lg w-full"><h3 class="text-xl font-bold mb-4">Create New Group</h3><form id="create-group-form" class="space-y-4"><div><label class="block text-sm font-medium text-gray-700 mb-1">Group Name</label><input type="text" id="group-name" placeholder="e.g., Nairobi Farmers" class="w-full p-2.5 border border-gray-300 rounded-lg text-sm" required></div><div><label class="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea id="group-desc" placeholder="Describe your group..." class="w-full p-2.5 border border-gray-300 rounded-lg text-sm" rows="3" required></textarea></div><div><label class="block text-sm font-medium text-gray-700 mb-1">Group Benefit Title</label><input type="text" id="benefit-title" placeholder="e.g., 10% Discount" class="w-full p-2.5 border border-gray-300 rounded-lg text-sm" required></div><div><label class="block text-sm font-medium text-gray-700 mb-1">Benefit Description</label><textarea id="benefit-desc" placeholder="Describe the benefit..." class="w-full p-2.5 border border-gray-300 rounded-lg text-sm" rows="2" required></textarea></div><div class="flex gap-3"><button type="submit" class="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700">Create Group</button><button type="button" id="cancel-create" class="flex-1 bg-gray-200 text-gray-800 py-2.5 rounded-lg font-medium hover:bg-gray-300">Cancel</button></div></form></div>';
        
        document.body.appendChild(modal);
        
        document.getElementById('cancel-create').addEventListener('click', () => modal.remove());
        
        document.getElementById('create-group-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = e.target.querySelector('button[type="submit"]');
            submitBtn.textContent = 'Creating...';
            submitBtn.disabled = true;
            
            try {
                // Create group
                const group = await groupService.createGroup({
                    name: document.getElementById('group-name').value,
                    description: document.getElementById('group-desc').value,
                    status: 'active'
                });
                
                // Add benefit
                await groupService.addBenefit({
                    group_id: group.id,
                    title: document.getElementById('benefit-title').value,
                    description: document.getElementById('benefit-desc').value,
                    benefit_type: 'percentage_discount',
                    value: 10,
                    is_active: true
                });
                
                modal.remove();
                // Real-time will auto-refresh the list
            } catch (err) {
                alert('Error creating group: ' + err.message);
                submitBtn.textContent = 'Create Group';
                submitBtn.disabled = false;
            }
        });
    }
}`;

// Replace the old renderGroups function
const oldGroupsStart = 'async function renderGroups(container) {';
const oldGroupsEnd = 'async function showAuthModal(type) {';
const startIndex = mainJs.indexOf(oldGroupsStart);
const endIndex = mainJs.indexOf(oldGroupsEnd);

if (startIndex !== -1 && endIndex !== -1) {
    const before = mainJs.substring(0, startIndex);
    const after = mainJs.substring(endIndex);
    mainJs = before + newRenderGroups + '\n\n' + after;
    fs.writeFileSync('src/main.js', mainJs);
    console.log('[SUCCESS] Added real-time groups with creation functionality');
} else {
    console.log('[ERROR] Could not find renderGroups function');
}

console.log('[COMPLETE] Real-time groups feature added!');
console.log('[INFO] Hard refresh your browser (Ctrl + F5) to test.');