const fs = require('fs');

console.log('[INFO] Creating Group Detail with Chat, Members, and Profiles...\n');

let mainJs = fs.readFileSync('src/main.js', 'utf8');

// 1. Remove Profile from navigation
mainJs = mainJs.replace(/id="nav-profile" class="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">Profile<\/a>/, '');
mainJs = mainJs.replace(/else if \(id === 'nav-profile'\) navigateTo\('profile'\); /, '');
mainJs = mainJs.replace(/else if \(view === 'profile'\) renderProfile\(container\); /, '');

// 2. Add Group Detail to navigation
mainJs = mainJs.replace(
    /id="nav-groups" class="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">Groups<\/a>/,
    'id="nav-groups" class="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">Groups</a>'
);

// 3. Add Group Detail route
if (!mainJs.includes("view === 'group-detail'")) {
    mainJs = mainJs.replace(
        /else if \(view === 'groups'\) renderGroups\(container\);/,
        "else if (view === 'groups') renderGroups(container);\n        else if (view === 'group-detail') renderGroupDetail(container);"
    );
}

fs.writeFileSync('src/main.js', mainJs);
console.log('[SUCCESS] Removed Profile nav, added Group Detail route.');

// 4. Add the renderGroupDetail function at the end of main.js (before the last closing)
const groupDetailFunction = `
async function renderGroupDetail(container, groupId) {
    container.innerHTML = '<div class="max-w-6xl mx-auto px-4 py-6"><button id="back-to-groups" class="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>Back to Groups</button><div id="group-content">Loading...</div></div>';
    
    document.getElementById('back-to-groups').addEventListener('click', () => navigateTo('groups'));
    
    try {
        // Fetch group with members and benefits
        const { data: group } = await supabase.from('groups').select('*, group_benefits(*), group_members(profiles(*))').eq('id', groupId).single();
        if (!group) { container.innerHTML = '<p class="text-red-600">Group not found</p>'; return; }
        
        const isMember = group.group_members?.some(m => m.user_id === currentUser.id);
        const memberData = group.group_members?.find(m => m.user_id === currentUser.id);
        const isAdmin = memberData?.role === 'admin' || group.created_by === currentUser.id;
        const canShareProducts = memberData?.share_products_with_groups || false;
        
        const content = document.getElementById('group-content');
        content.innerHTML = \`
            <div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-6">
                <div class="p-6 border-b border-gray-200">
                    <div class="flex justify-between items-start">
                        <div>
                            <h2 class="text-2xl font-bold text-gray-900">\${group.name}</h2>
                            <p class="text-gray-600 mt-2">\${group.description}</p>
                        </div>
                        <div class="flex gap-2">
                            \${!isMember ? '<button id="join-group-btn" class="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">Join Group</button>' : ''}
                            \${isMember ? '<button id="leave-group-btn" class="bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600">Leave Group</button>' : ''}
                        </div>
                    </div>
                    \${group.group_benefits?.[0] ? \`
                        <div class="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                            <h3 class="font-bold text-green-900">\${group.group_benefits[0].title} \${group.group_benefits[0].target_product_name ? 'on ' + group.group_benefits[0].target_product_name : ''}</h3>
                            <p class="text-sm text-green-700 mt-1">\${group.group_benefits[0].description}</p>
                        </div>
                    \` : ''}
                </div>
                
                \${isMember ? \`
                    <div class="border-b border-gray-200">
                        <div class="flex">
                            <button class="tab-btn flex-1 px-4 py-3 text-sm font-medium border-b-2 border-blue-500 text-blue-600" data-tab="chat">Chat</button>
                            <button class="tab-btn flex-1 px-4 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700" data-tab="members">Members (\${group.group_members?.length || 0})</button>
                            <button class="tab-btn flex-1 px-4 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700" data-tab="products">Shared Products</button>
                            \${isAdmin ? '<button class="tab-btn flex-1 px-4 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700" data-tab="admin">Admin</button>' : ''}
                        </div>
                    </div>
                    <div id="tab-content" class="p-6"></div>
                \` : '<div class="p-6 text-center text-gray-500">Join this group to access chat, members, and shared products</div>'}
            </div>
        \`;
        
        // Tab switching
        const tabs = content.querySelectorAll('.tab-btn');
        const tabContent = content.querySelector('#tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => {
                    t.classList.remove('border-blue-500', 'text-blue-600');
                    t.classList.add('border-transparent', 'text-gray-500');
                });
                tab.classList.remove('border-transparent', 'text-gray-500');
                tab.classList.add('border-blue-500', 'text-blue-600');
                
                const tabName = tab.getAttribute('data-tab');
                if (tabName === 'chat') renderGroupChat(tabContent, groupId);
                else if (tabName === 'members') renderGroupMembers(tabContent, group, isAdmin);
                else if (tabName === 'products') renderGroupProducts(tabContent, groupId);
                else if (tabName === 'admin') renderAdminPanel(tabContent, group);
            });
        });
        
        // Join/Leave handlers
        if (content.querySelector('#join-group-btn')) {
            content.querySelector('#join-group-btn').addEventListener('click', async () => {
                await groupService.joinGroup(groupId, currentUser.id);
                renderGroupDetail(container, groupId);
            });
        }
        
        if (content.querySelector('#leave-group-btn')) {
            content.querySelector('#leave-group-btn').addEventListener('click', async () => {
                if (confirm('Are you sure you want to leave this group?')) {
                    await groupService.leaveGroup(groupId, currentUser.id);
                    navigateTo('groups');
                }
            });
        }
        
        // Load chat by default
        if (isMember) {
            setTimeout(() => {
                const chatBtn = content.querySelector('[data-tab="chat"]');
                if (chatBtn) chatBtn.click();
            }, 100);
        }
        
    } catch (err) {
        console.error('[ERROR] Group detail error:', err);
        container.innerHTML = '<p class="text-red-600">Error loading group: ' + err.message + '</p>';
    }
}

function renderGroupChat(container, groupId) {
    container.innerHTML = \`
        <div class="h-[500px] flex flex-col">
            <div id="chat-messages" class="flex-1 overflow-y-auto mb-4 space-y-3 p-4 bg-gray-50 rounded-lg"></div>
            <div class="flex gap-2">
                <input type="text" id="chat-input" placeholder="Type a message..." class="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" onkeypress="if(event.key==='Enter')sendMessage()">
                <button onclick="sendMessage()" class="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700">Send</button>
            </div>
        </div>
    \`;
    
    window.sendMessage = async () => {
        const input = document.getElementById('chat-input');
        const content = input.value.trim();
        if (!content) return;
        
        try {
            await groupService.sendMessage(groupId, currentUser.id, content);
            input.value = '';
            loadMessages();
        } catch (err) {
            alert('Error sending message: ' + err.message);
        }
    };
    
    async function loadMessages() {
        try {
            const messages = await groupService.getMessages(groupId);
            const chatDiv = document.getElementById('chat-messages');
            
            if (messages.length === 0) {
                chatDiv.innerHTML = '<p class="text-center text-gray-500 py-8">No messages yet. Start the conversation!</p>';
                return;
            }
            
            chatDiv.innerHTML = messages.map(msg => {
                const isMe = msg.user_id === currentUser.id;
                return \`
                    <div class="flex \${isMe ? 'justify-end' : 'justify-start'}">
                        <div class="max-w-[70%] \${isMe ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200'} rounded-lg p-3">
                            <div class="flex items-center gap-2 mb-1">
                                \${msg.profiles?.avatar_url ? '<img src="' + msg.profiles.avatar_url + '" class="w-6 h-6 rounded-full">' : '<div class="w-6 h-6 bg-gray-300 rounded-full"></div>'}
                                <span class="text-xs font-medium">\${msg.profiles?.full_name || 'Anonymous'}</span>
                            </div>
                            <p class="text-sm">\${msg.content}</p>
                            <span class="text-xs opacity-75 mt-1 block">\${new Date(msg.created_at).toLocaleTimeString()}</span>
                        </div>
                    </div>
                \`;
            }).join('');
            
            chatDiv.scrollTop = chatDiv.scrollHeight;
        } catch (err) {
            console.error('[ERROR] Load messages:', err);
        }
    }
    
    loadMessages();
    
    // Real-time chat updates
    const channel = supabase.channel('chat-' + groupId)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages', filter: 'group_id=eq.' + groupId }, () => {
            loadMessages();
        })
        .subscribe();
    
    // Store channel for cleanup
    window.chatChannel = channel;
}

function renderGroupMembers(container, group, isAdmin) {
    const members = group.group_members || [];
    
    container.innerHTML = \`
        <div class="space-y-3">
            <h3 class="font-bold text-lg mb-4">Group Members (\${members.length})</h3>
            \${members.map(member => {
                const profile = member.profiles;
                const isMe = member.user_id === currentUser.id;
                const isAdminMember = member.role === 'admin';
                
                return \`
                    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div class="flex items-center gap-3">
                            \${profile?.avatar_url ? '<img src="' + profile.avatar_url + '" class="w-10 h-10 rounded-full">' : '<div class="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-bold">' + (profile?.full_name?.[0] || '?') + '</div>'}
                            <div>
                                <p class="font-medium">\${profile?.full_name || 'Anonymous'}</p>
                                \${isAdminMember ? '<span class="text-xs text-blue-600 font-medium">Admin</span>' : ''}
                            </div>
                        </div>
                        <div class="flex gap-2">
                            \${!isMe && isAdmin ? '<button class="text-red-600 text-sm hover:text-red-800" onclick="removeMember(\\'' + member.user_id + '\\')">Remove</button>' : ''}
                            \${isMe ? '<button class="text-blue-600 text-sm hover:text-blue-800" onclick="editMyProfile()">Edit Profile</button>' : ''}
                        </div>
                    </div>
                \`;
            }).join('')}
        </div>
    \`;
    
    window.removeMember = async (userId) => {
        if (confirm('Remove this member from the group?')) {
            try {
                await groupService.removeMember(group.id, userId);
                renderGroupMembers(container, {...group, group_members: members.filter(m => m.user_id !== userId)}, isAdmin);
            } catch (err) {
                alert('Error: ' + err.message);
            }
        }
    };
    
    window.editMyProfile = () => showProfileEditModal();
}

function renderGroupProducts(container, groupId) {
    container.innerHTML = '<p class="text-gray-500 text-center py-8">Loading shared products...</p>';
    // TODO: Fetch and display products from group members who have enabled sharing
}

function renderAdminPanel(container, group) {
    container.innerHTML = \`
        <div class="space-y-6">
            <h3 class="font-bold text-lg">Admin Controls</h3>
            <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 class="font-medium mb-2">Group Settings</h4>
                <p class="text-sm text-gray-600">Manage group settings and permissions</p>
            </div>
            <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 class="font-medium mb-2">Member Management</h4>
                <p class="text-sm text-gray-600">Promote members to admin or remove members</p>
            </div>
        </div>
    \`;
}

function showProfileEditModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = \`
        <div class="bg-white p-6 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 class="text-xl font-bold mb-4">Edit Your Profile</h3>
            <form id="profile-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Profile Picture URL</label>
                    <input type="url" id="profile-avatar" placeholder="https://..." class="w-full p-2.5 border border-gray-300 rounded-lg text-sm">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input type="text" id="profile-name" placeholder="Your name" class="w-full p-2.5 border border-gray-300 rounded-lg text-sm">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea id="profile-bio" placeholder="Tell us about yourself..." class="w-full p-2.5 border border-gray-300 rounded-lg text-sm" rows="3"></textarea>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Social Links (up to 5)</label>
                    <div id="links-container" class="space-y-2"></div>
                    <button type="button" id="add-link" class="text-sm text-blue-600 hover:text-blue-800 mt-2">+ Add Link</button>
                </div>
                <div class="flex items-center gap-2">
                    <input type="checkbox" id="share-products" class="rounded">
                    <label for="share-products" class="text-sm text-gray-700">Share my products with group members</label>
                </div>
                <div class="flex gap-3">
                    <button type="submit" class="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700">Save Profile</button>
                    <button type="button" id="cancel-profile" class="flex-1 bg-gray-200 text-gray-800 py-2.5 rounded-lg font-medium hover:bg-gray-300">Cancel</button>
                </div>
            </form>
        </div>
    \`;
    
    document.body.appendChild(modal);
    
    document.getElementById('cancel-profile').addEventListener('click', () => modal.remove());
    document.getElementById('add-link').addEventListener('click', addLinkField);
    
    // Add initial link fields
    for (let i = 0; i < 1; i++) addLinkField();
    
    function addLinkField() {
        const container = document.getElementById('links-container');
        const count = container.children.length;
        if (count >= 5) {
            alert('Maximum 5 links allowed');
            return;
        }
        const div = document.createElement('div');
        div.innerHTML = '<input type="url" placeholder="https://example.com" class="w-full p-2 border border-gray-300 rounded text-sm link-input">';
        container.appendChild(div);
    }
    
    document.getElementById('profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const links = Array.from(document.querySelectorAll('.link-input')).map(input => input.value).filter(v => v);
        
        try {
            await profileService.updateProfile(currentUser.id, {
                avatar_url: document.getElementById('profile-avatar').value,
                full_name: document.getElementById('profile-name').value,
                bio: document.getElementById('profile-bio').value,
                links: links,
                share_products_with_groups: document.getElementById('share-products').checked
            });
            modal.remove();
            alert('Profile saved!');
        } catch (err) {
            alert('Error saving profile: ' + err.message);
        }
    });
}
`;

// Append the function before the closing
const closingMarker = "if (document.readyState === 'loading')";
if (mainJs.includes(closingMarker)) {
    mainJs = mainJs.replace(closingMarker, groupDetailFunction + "\n\n" + closingMarker);
    fs.writeFileSync('src/main.js', mainJs);
    console.log('[SUCCESS] Added Group Detail, Chat, Members, and Profile features.');
}

console.log('[COMPLETE] Hard refresh your browser (Ctrl + F5) to test.');
console.log('[INFO] Now click on any group to see the detail view with chat and members!');