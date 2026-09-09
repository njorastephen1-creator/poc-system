const fs = require('fs');

console.log('[INFO] Initializing Version 0.1 Architecture...\n');

// 1. Update Navigation: "Groups" -> "Let's Connect"
let mainJs = fs.readFileSync('src/main.js', 'utf8');

// Replace the nav link text
mainJs = mainJs.replace(
    /id="nav-groups" class="([^"]*)">Groups<\/a>/, 
    'id="nav-groups" class="$1">Let\'s Connect</a>'
);

// Replace the view title if it exists
mainJs = mainJs.replace(
    /<h2 class="text-3xl font-bold mb-2 text-gray-900">Community Groups<\/h2>/,
    '<h2 class="text-3xl font-bold mb-2 text-gray-900">Let\'s Connect</h2>'
);

fs.writeFileSync('src/main.js', mainJs);
console.log('[SUCCESS] Navigation updated to "Let\'s Connect".');

// 2. Create the Service Layer Structure (Point #37 in your prompt)
// We need to separate logic from UI.

const servicesDir = 'src/services';
if (!fs.existsSync(servicesDir)) fs.mkdirSync(servicesDir);

// Create Messaging Service (For 1-on-1 and Group Chat)
const messagingService = `import { supabase } from '../config/supabase.client.js';

export const messagingService = {
    // Create a new 1-on-1 conversation
    async createConversation(user1Id, user2Id) {
        const { data, error } = await supabase
            .from('conversations')
            .insert([{ type: 'direct' }])
            .select()
            .single();
        if (error) throw error;
        
        // Add members
        const { error: memberError } = await supabase
            .from('conversation_members')
            .insert([
                { conversation_id: data.id, user_id: user1Id },
                { conversation_id: data.id, user_id: user2Id }
            ]);
        if (memberError) throw memberError;
        
        return data;
    },

    // Get all conversations for a user
    async getMyConversations(userId) {
        const { data, error } = await supabase
            .from('conversation_members')
            .select('conversations(id, type, created_at), profiles(id, full_name, avatar_url)')
            .eq('user_id', userId);
        if (error) throw error;
        return data;
    },

    // Send a message
    async sendMessage(conversationId, senderId, content, type = 'text') {
        const { data, error } = await supabase
            .from('messages')
            .insert([{
                conversation_id: conversationId,
                sender_id: senderId,
                content: content,
                type: type
            }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // Get messages for a conversation
    async getMessages(conversationId) {
        const { data, error } = await supabase
            .from('messages')
            .select('*, profiles(full_name, avatar_url)')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data;
    }
};
`;
fs.writeFileSync(`${servicesDir}/messaging.service.js`, messagingService);
console.log('[SUCCESS] Created messaging.service.js');

// Create Enhanced Profile Service
const profileService = `import { supabase } from '../config/supabase.client.js';

export const profileService = {
    async getProfile(userId) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    async updateProfile(userId, updates) {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async getPublicProfile(userId) {
        // Fetch profile + their businesses + their reviews
        const { data, error } = await supabase
            .from('profiles')
            .select('*, businesses(*), reviews(*)')
            .eq('id', userId)
            .single();
        if (error) throw error;
        return data;
    }
};
`;
// Note: If file exists, we might overwrite, but for now we ensure it's there.
if (!fs.existsSync(`${servicesDir}/profile.service.js`)) {
    fs.writeFileSync(`${servicesDir}/profile.service.js`, profileService);
    console.log('[SUCCESS] Created profile.service.js');
} else {
    console.log('[INFO] profile.service.js already exists.');
}

console.log('\n[COMPLETE] Architecture foundation laid.');
console.log('[NEXT STEP] Run the SQL script in Supabase to create the tables.');