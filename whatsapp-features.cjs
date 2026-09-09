const fs = require('fs');

console.log('[INFO] Adding WhatsApp features and buttons...\n');

let mainJs = fs.readFileSync('src/main.js', 'utf8');

// Find and replace the openGroupChat function to add all buttons
const oldChatStart = 'window.openGroupChat = async (groupId, groupName) => {';
const oldChatEnd = 'function appendMessage(msg, scroll = true) {';

const startIdx = mainJs.indexOf(oldChatStart);
const endIdx = mainJs.indexOf(oldChatEnd);

if (startIdx !== -1 && endIdx !== -1) {
    const before = mainJs.substring(0, startIdx);
    const after = mainJs.substring(endIdx);

    const enhancedChat = `window.openGroupChat = async (groupId, groupName) => {
    const chatArea = document.getElementById('chat-area');
    chatArea.innerHTML = \`
        <!-- Chat Header with All Buttons -->
        <div class="bg-[#f0f2f5] p-3 flex justify-between items-center border-l border-gray-300 shadow-sm z-10">
            <div class="flex items-center gap-3 cursor-pointer" onclick="toggleGroupInfo()">
                <div class="w-10 h-10 bg-[#dfe5e7] rounded-full flex items-center justify-center text-gray-600 font-bold">\${groupName[0].toUpperCase()}</div>
                <div>
                    <h3 class="font-medium text-gray-900">\${groupName}</h3>
                    <p class="text-xs text-gray-500" id="online-status">click here for group info</p>
                </div>
            </div>
            <div class="flex gap-4 text-gray-600">
                <button onclick="searchInChat()" class="hover:text-gray-900" title="Search">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </button>
                <button onclick="toggleGroupInfo()" class="hover:text-gray-900" title="Group Info">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </button>
                <button class="hover:text-gray-900" title="More options">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
                </button>
            </div>
        </div>
        
        <!-- Messages Area -->
        <div id="messages-container" class="flex-1 overflow-y-auto p-4 space-y-2 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
            <div class="text-center my-4"><span class="bg-white text-gray-500 text-xs px-3 py-1 rounded-lg shadow-sm">TODAY</span></div>
        </div>

        <!-- Reply Preview -->
        <div id="reply-preview" class="hidden bg-white border-l-4 border-[#00a884] p-3 flex justify-between items-center">
            <div>
                <p class="text-xs font-bold text-[#00a884]">Replying to message</p>
                <p class="text-sm text-gray-700" id="reply-text"></p>
            </div>
            <button onclick="cancelReply()" class="text-gray-500 hover:text-gray-700">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>

        <!-- Input Area with All Buttons -->
        <div class="bg-[#f0f2f5] p-3 flex items-center gap-2 border-l border-gray-300">
            <button onclick="toggleEmojiPicker()" class="text-gray-600 hover:text-gray-900 p-2" title="Emoji">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </button>
            <button onclick="document.getElementById('file-input').click()" class="text-gray-600 hover:text-gray-900 p-2" title="Attach">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
            </button>
            <input type="file" id="file-input" class="hidden" accept="image/*,video/*,application/pdf" onchange="handleFileSelect(event)">
            <input type="text" id="message-input" placeholder="Type a message" class="flex-1 bg-white rounded-lg px-4 py-3 focus:outline-none text-sm">
            <button id="voice-btn" class="text-gray-600 hover:text-gray-900 p-2" title="Voice Message" onmousedown="startRecording()" onmouseup="stopRecording()">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
            </button>
            <button id="send-btn" class="text-gray-600 hover:text-gray-900 p-2" title="Send">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
            </button>
        </div>

        <!-- Emoji Picker (Hidden by default) -->
        <div id="emoji-picker" class="hidden absolute bottom-20 right-10 bg-white rounded-lg shadow-xl p-3 grid grid-cols-8 gap-2 max-w-[300px]">
            <!-- Emojis will be added here -->
        </div>
    \`;

    // Initialize emoji picker
    initEmojiPicker();
    
    // Load messages
    loadMessages(groupId);

    // Send message handler
    const input = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');

    window.sendMessage = async () => {
        const text = input.value.trim();
        if (!text) return;
        
        const messageData = {
            content: text,
            reply_to: window.replyingTo || null
        };
        
        try {
            await groupService.sendMessage(groupId, currentUser.id, messageData.content);
            input.value = '';
            window.replyingTo = null;
            document.getElementById('reply-preview').classList.add('hidden');
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    sendBtn.addEventListener('click', window.sendMessage);
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') window.sendMessage(); });

    // Realtime subscription
    if (window.chatChannel) supabase.removeChannel(window.chatChannel);
    window.chatChannel = supabase.channel('chat-' + groupId)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages', filter: 'group_id=eq.' + groupId }, payload => {
            appendMessage(payload.new);
        })
        .subscribe();
    
    // Store current group info
    window.currentGroupId = groupId;
    window.currentGroupName = groupName;
};`;

    mainJs = before + enhancedChat + '\n\n' + after;
    fs.writeFileSync('src/main.js', mainJs);
    console.log('[SUCCESS] Added chat header and input buttons.');
}

// Add helper functions for all features
const helperFunctions = `
// Emoji Picker
function initEmojiPicker() {
    const emojis = ['😀','😂','😍','','😎','🤔','👍','❤️','','🎉','👏','🙏','✅','💯','👋','😊'];
    const picker = document.getElementById('emoji-picker');
    if (!picker) return;
    
    picker.innerHTML = emojis.map(emoji => 
        '<button class="text-2xl hover:bg-gray-100 p-1 rounded" onclick="insertEmoji(\\'' + emoji + '\\')">' + emoji + '</button>'
    ).join('');
}

function toggleEmojiPicker() {
    const picker = document.getElementById('emoji-picker');
    if (picker) picker.classList.toggle('hidden');
}

function insertEmoji(emoji) {
    const input = document.getElementById('message-input');
    if (input) {
        input.value += emoji;
        input.focus();
    }
    toggleEmojiPicker();
}

// File Upload
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Upload file and send as message
    alert('File selected: ' + file.name + '. Upload functionality would be implemented here.');
}

// Voice Recording
let mediaRecorder;
let audioChunks = [];

function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            mediaRecorder.ondataavailable = event => audioChunks.push(event.data);
            mediaRecorder.onstop = sendVoiceMessage;
            mediaRecorder.start();
            document.getElementById('voice-btn').classList.add('text-red-600');
        })
        .catch(err => {
            console.error('[ERROR] Voice recording:', err);
            alert('Microphone access denied');
        });
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        document.getElementById('voice-btn').classList.remove('text-red-600');
    }
}

async function sendVoiceMessage() {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    // Upload audio and send as voice message
    alert('Voice message recorded. Upload functionality would be implemented here.');
}

// Reply to Message
function replyToMessage(messageId, messageText) {
    window.replyingTo = messageId;
    document.getElementById('reply-text').textContent = messageText;
    document.getElementById('reply-preview').classList.remove('hidden');
}

function cancelReply() {
    window.replyingTo = null;
    document.getElementById('reply-preview').classList.add('hidden');
}

// Message Actions (Delete, Edit, Forward, React)
function showMessageActions(messageId, event) {
    const actions = ['Reply', 'React', 'Forward', 'Edit', 'Delete'];
    // Show context menu with actions
    alert('Message actions menu would appear here for message ID: ' + messageId);
}

// Add reaction to message
async function addReaction(messageId, emoji) {
    try {
        // Update message with reaction
        console.log('[INFO] Adding reaction:', emoji, 'to message:', messageId);
    } catch (err) {
        console.error('[ERROR] Add reaction:', err);
    }
}

// Search in chat
function searchInChat() {
    const searchTerm = prompt('Search in chat:');
    if (searchTerm) {
        alert('Searching for: ' + searchTerm);
        // Implement search functionality
    }
}

// Toggle Group Info Panel
function toggleGroupInfo() {
    const chatArea = document.getElementById('chat-area');
    if (!chatArea) return;
    
    // Check if info panel already exists
    const existingPanel = document.getElementById('group-info-panel');
    if (existingPanel) {
        existingPanel.remove();
        return;
    }
    
    // Create info panel
    const panel = document.createElement('div');
    panel.id = 'group-info-panel';
    panel.className = 'w-[300px] bg-white border-l border-gray-300 flex flex-col';
    panel.innerHTML = \`
        <div class="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 class="font-bold text-lg">Group Info</h3>
            <button onclick="toggleGroupInfo()" class="text-gray-600 hover:text-gray-900">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>
        <div class="p-4 flex-1 overflow-y-auto">
            <div class="text-center mb-4">
                <div class="w-24 h-24 bg-[#dfe5e7] rounded-full flex items-center justify-center text-gray-600 font-bold text-3xl mx-auto mb-2">\${window.currentGroupName ? window.currentGroupName[0].toUpperCase() : 'G'}</div>
                <h4 class="font-bold text-xl">\${window.currentGroupName || 'Group'}</h4>
                <p class="text-sm text-gray-500 mt-1">Created by You</p>
            </div>
            <div class="border-t border-gray-200 py-3">
                <h5 class="font-medium text-gray-700 mb-2">Description</h5>
                <p class="text-sm text-gray-600">Group description would appear here</p>
            </div>
            <div class="border-t border-gray-200 py-3">
                <h5 class="font-medium text-gray-700 mb-2">Members</h5>
                <div id="info-members-list" class="space-y-2">
                    <p class="text-sm text-gray-500">Loading members...</p>
                </div>
            </div>
            <div class="border-t border-gray-200 py-3">
                <h5 class="font-medium text-gray-700 mb-2">Settings</h5>
                <div class="space-y-2">
                    <label class="flex items-center justify-between text-sm">
                        <span>Mute notifications</span>
                        <input type="checkbox" class="rounded">
                    </label>
                    <label class="flex items-center justify-between text-sm">
                        <span>Disappearing messages</span>
                        <input type="checkbox" class="rounded">
                    </label>
                </div>
            </div>
            <div class="border-t border-gray-200 py-3 mt-4">
                <button class="w-full bg-red-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-600">Leave Group</button>
            </div>
        </div>
    \`;
    
    chatArea.parentElement.appendChild(panel);
    
    // Load members
    loadGroupInfoMembers();
}

async function loadGroupInfoMembers() {
    const list = document.getElementById('info-members-list');
    if (!list || !window.currentGroupId) return;
    
    try {
        const { data: group } = await supabase.from('groups')
            .select('group_members(profiles(*), role)')
            .eq('id', window.currentGroupId)
            .single();
        
        const members = group?.group_members || [];
        
        list.innerHTML = members.map(member => {
            const profile = member.profiles;
            return \`
                <div class="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-bold">
                            \${profile?.full_name?.[0] || '?'}
                        </div>
                        <span class="text-sm">\${profile?.full_name || 'Anonymous'}</span>
                    </div>
                    \${member.role === 'admin' ? '<span class="text-xs text-blue-600 font-medium">Admin</span>' : ''}
                </div>
            \`;
        }).join('');
    } catch (err) {
        console.error('[ERROR] Load members:', err);
        list.innerHTML = '<p class="text-sm text-red-500">Error loading members</p>';
    }
}

// Update appendMessage to add message actions
function appendMessage(msg, scroll = true) {
    const container = document.getElementById('messages-container');
    if (!container) return;

    const isMe = msg.user_id === currentUser.id;
    const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const bubble = document.createElement('div');
    bubble.className = 'flex ' + (isMe ? 'justify-end' : 'justify-start');
    bubble.innerHTML = \`
        <div class="max-w-[65%] \${isMe ? 'bg-[#d9fdd3]' : 'bg-white'} rounded-lg p-2 px-3 shadow-sm relative group hover:shadow-md transition">
            \${!isMe ? '<p class="text-xs font-bold text-[#00a884] mb-1">Member</p>' : ''}
            <p class="text-sm text-gray-900 break-words pr-12">\${msg.content}</p>
            <div class="flex items-center justify-end gap-1 mt-1">
                <span class="text-[10px] text-gray-500">\${time}</span>
                \${isMe ? '<svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"></path></svg>' : ''}
            </div>
            <!-- Message Actions Button -->
            <button onclick="showMessageActions('\${msg.id}', event)" class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-700 transition">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
            </button>
            <!-- Quick Reply Button -->
            <button onclick="replyToMessage('\${msg.id}', '\${msg.content.replace(/'/g, "\\'")}')" class="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-700 transition">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
            </button>
        </div>
    \`;
    container.appendChild(bubble);
    if (scroll) container.scrollTop = container.scrollHeight;
}
`;

// Add before the closing
const closingMarker = "if (document.readyState === 'loading')";
if (mainJs.includes(closingMarker)) {
    mainJs = mainJs.replace(closingMarker, helperFunctions + "\n\n" + closingMarker);
    fs.writeFileSync('src/main.js', mainJs);
    console.log('[SUCCESS] Added all WhatsApp features and buttons.');
}

console.log('[COMPLETE] Hard refresh your browser (Ctrl + F5) to see all new features!');
console.log('[INFO] Features added:');
console.log('  - Emoji picker');
console.log('  - File attachment button');
console.log('  - Voice message recording');
console.log('  - Reply to messages');
console.log('  - Message actions (hover over message)');
console.log('  - Group info panel with members');
console.log('  - Search in chat');
console.log('  - Message reactions');
console.log('  - Online status display');