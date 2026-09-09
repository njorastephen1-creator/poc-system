const fs = require('fs');

console.log('[INFO] Building WhatsApp-style Group Interface...\n');

let mainJs = fs.readFileSync('src/main.js', 'utf8');

// 1. Find the renderGroups function and replace it entirely
const startMarker = 'async function renderGroups(container) {';
const endMarker = 'function showAuthModal(type) {';

const startIdx = mainJs.indexOf(startMarker);
const endIdx = mainJs.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
    const before = mainJs.substring(0, startIdx);
    const after = mainJs.substring(endIdx);

    const whatsappUI = `async function renderGroups(container) {
    // WhatsApp Web Layout
    container.innerHTML = \`
        <div class="flex h-[calc(100vh-120px)] bg-[#f0f2f5] border border-gray-300 rounded-lg overflow-hidden shadow-lg mx-auto max-w-[1600px]">
            <!-- Left Sidebar: Group List -->
            <div class="w-[30%] min-w-[300px] bg-white border-r border-gray-300 flex flex-col">
                <div class="bg-[#f0f2f5] p-4 flex justify-between items-center border-b border-gray-300">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-bold">\${currentUser.email[0].toUpperCase()}</div>
                        <span class="font-medium text-gray-700">\${currentUser.email.split('@')[0]}</span>
                    </div>
                    <button id="new-group-btn" class="text-gray-600 hover:text-gray-900">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                    </button>
                </div>
                <div class="p-2 bg-white border-b border-gray-200">
                    <input type="text" id="search-groups" placeholder="Search or start new chat" class="w-full bg-[#f0f2f5] p-2 rounded-lg text-sm focus:outline-none">
                </div>
                <div id="groups-list" class="flex-1 overflow-y-auto">
                    <div class="p-8 text-center text-gray-500 text-sm">Loading groups...</div>
                </div>
            </div>
            
            <!-- Right Side: Chat Area -->
            <div class="flex-1 flex flex-col bg-[#efeae2] relative" id="chat-area">
                <div class="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 text-center">
                    <svg class="w-24 h-24 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                    <h2 class="text-2xl font-light mb-2">Platform POC Web</h2>
                    <p class="text-sm text-gray-400">Select a group from the sidebar to start chatting, or create a new one.</p>
                </div>
            </div>
        </div>
    \`;

    // Load groups into sidebar
    loadSidebarGroups();

    document.getElementById('new-group-btn').addEventListener('click', showCreateGroupModal);

    async function loadSidebarGroups() {
        try {
            const groups = await groupService.getAllGroups();
            const userGroups = await groupService.getUserGroups(currentUser.id);
            const joinedIds = userGroups.map(g => g.id);
            const myGroups = groups.filter(g => joinedIds.includes(g.id));

            const list = document.getElementById('groups-list');
            if (myGroups.length === 0) {
                list.innerHTML = '<div class="p-8 text-center text-gray-500 text-sm">No groups joined yet.</div>';
                return;
            }

            list.innerHTML = myGroups.map(g => \`
                <div class="flex items-center gap-3 p-3 hover:bg-[#f0f2f5] cursor-pointer border-b border-gray-100 transition" onclick="window.openGroupChat('\${g.id}', '\${g.name.replace(/'/g, "\\'")}')">
                    <div class="w-12 h-12 bg-[#dfe5e7] rounded-full flex items-center justify-center text-gray-600 font-bold text-lg">\${g.name[0].toUpperCase()}</div>
                    <div class="flex-1 min-w-0">
                        <div class="flex justify-between items-baseline">
                            <h4 class="font-medium text-gray-900 truncate">\${g.name}</h4>
                            <span class="text-xs text-gray-500">12:00 PM</span>
                        </div>
                        <p class="text-sm text-gray-500 truncate">\${g.description || 'No description'}</p>
                    </div>
                </div>
            \`).join('');
        } catch (err) {
            console.error('[ERROR] Load groups:', err);
        }
    }

    window.openGroupChat = async (groupId, groupName) => {
        const chatArea = document.getElementById('chat-area');
        chatArea.innerHTML = \`
            <!-- Chat Header -->
            <div class="bg-[#f0f2f5] p-3 flex justify-between items-center border-l border-gray-300 shadow-sm z-10">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-[#dfe5e7] rounded-full flex items-center justify-center text-gray-600 font-bold">\${groupName[0].toUpperCase()}</div>
                    <div>
                        <h3 class="font-medium text-gray-900">\${groupName}</h3>
                        <p class="text-xs text-gray-500">click here for group info</p>
                    </div>
                </div>
                <div class="flex gap-4 text-gray-600">
                    <button class="hover:text-gray-900"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></button>
                    <button class="hover:text-gray-900"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg></button>
                </div>
            </div>
            
            <!-- Messages Area -->
            <div id="messages-container" class="flex-1 overflow-y-auto p-4 space-y-2 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
                <div class="text-center my-4"><span class="bg-white text-gray-500 text-xs px-3 py-1 rounded-lg shadow-sm">TODAY</span></div>
            </div>

            <!-- Input Area -->
            <div class="bg-[#f0f2f5] p-3 flex items-center gap-2 border-l border-gray-300">
                <button class="text-gray-600 hover:text-gray-900 p-2"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></button>
                <button class="text-gray-600 hover:text-gray-900 p-2"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg></button>
                <input type="text" id="message-input" placeholder="Type a message" class="flex-1 bg-white rounded-lg px-4 py-3 focus:outline-none text-sm">
                <button id="send-btn" class="text-gray-600 hover:text-gray-900 p-2">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                </button>
            </div>
        \`;

        // Load messages
        loadMessages(groupId);

        // Send message handler
        const input = document.getElementById('message-input');
        const sendBtn = document.getElementById('send-btn');

        const sendMessage = async () => {
            const text = input.value.trim();
            if (!text) return;
            input.value = '';
            try {
                await groupService.sendMessage(groupId, currentUser.id, text);
                // loadMessages will be triggered by realtime, but we can also call it manually
            } catch (err) {
                alert('Error: ' + err.message);
            }
        };

        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

        // Realtime subscription
        if (window.chatChannel) supabase.removeChannel(window.chatChannel);
        window.chatChannel = supabase.channel('chat-' + groupId)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages', filter: 'group_id=eq.' + groupId }, payload => {
                appendMessage(payload.new);
            })
            .subscribe();
    };

    async function loadMessages(groupId) {
        const container = document.getElementById('messages-container');
        container.innerHTML = '<div class="text-center my-4"><span class="bg-white text-gray-500 text-xs px-3 py-1 rounded-lg shadow-sm">TODAY</span></div>';
        
        try {
            const messages = await groupService.getMessages(groupId);
            messages.forEach(msg => appendMessage(msg, false));
            container.scrollTop = container.scrollHeight;
        } catch (err) {
            console.error('[ERROR] Load messages:', err);
        }
    }

    function appendMessage(msg, scroll = true) {
        const container = document.getElementById('messages-container');
        if (!container) return;

        const isMe = msg.user_id === currentUser.id;
        const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const bubble = document.createElement('div');
        bubble.className = 'flex ' + (isMe ? 'justify-end' : 'justify-start');
        bubble.innerHTML = \`
            <div class="max-w-[65%] \${isMe ? 'bg-[#d9fdd3]' : 'bg-white'} rounded-lg p-2 px-3 shadow-sm relative">
                \${!isMe ? '<p class="text-xs font-bold text-[#00a884] mb-1">User</p>' : ''}
                <p class="text-sm text-gray-900 break-words pr-12">\${msg.content}</p>
                <span class="absolute bottom-1 right-2 text-[10px] text-gray-500 flex items-center gap-1">
                    \${time}
                    \${isMe ? '<svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"></path></svg>' : ''}
                </span>
            </div>
        \`;
        container.appendChild(bubble);
        if (scroll) container.scrollTop = container.scrollHeight;
    }
}`;

    mainJs = before + whatsappUI + '\n\n' + after;
    fs.writeFileSync('src/main.js', mainJs);
    console.log('[SUCCESS] WhatsApp UI injected successfully.');
} else {
    console.log('[ERROR] Could not find markers to replace.');
}

console.log('[COMPLETE] Hard refresh your browser (Ctrl + F5) to see the new WhatsApp interface.');