const fs = require('fs');

console.log('[INFO] Building Service Layer Architecture...\n');

const servicesDir = 'src/services';
if (!fs.existsSync(servicesDir)) fs.mkdirSync(servicesDir);

// 1. Profile Service (Handles Professional Identity)
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
            .update({ ...updates, updated_at: new Date().toISOString() })
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
            .select('*, businesses(*), reviews(rating)')
            .eq('id', userId)
            .single();
        if (error) throw error;
        return data;
    }
};
`;
fs.writeFileSync(`${servicesDir}/profile.service.js`, profileService);
console.log('[SUCCESS] Created profile.service.js');

// 2. Business Service (Handles Business Identity & Products)
const businessService = `import { supabase } from '../config/supabase.client.js';

export const businessService = {
    async getBusiness(businessId) {
        const { data, error } = await supabase
            .from('businesses')
            .select('*, products(*), group_benefits(*)')
            .eq('id', businessId)
            .single();
        if (error) throw error;
        return data;
    },

    async getMyBusinesses(userId) {
        const { data, error } = await supabase
            .from('businesses')
            .select('*')
            .eq('owner_id', userId);
        if (error) throw error;
        return data;
    },

    async createBusiness(businessData) {
        const { data, error } = await supabase
            .from('businesses')
            .insert([businessData])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateBusinessStatus(businessId, status) {
        const { error } = await supabase
            .from('businesses')
            .update({ status: status })
            .eq('id', businessId);
        if (error) throw error;
    }
};
`;
fs.writeFileSync(`${servicesDir}/business.service.js`, businessService);
console.log('[SUCCESS] Created business.service.js');

// 3. Chat Service (Handles Real-Time Communication)
const chatService = `import { supabase } from '../config/supabase.client.js';

export const chatService = {
    async getConversations(userId) {
        const { data, error } = await supabase
            .from('conversation_members')
            .select('conversations(id, type, created_at), profiles(id, full_name, avatar_url)')
            .eq('user_id', userId);
        if (error) throw error;
        return data;
    },

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
fs.writeFileSync(`${servicesDir}/chat.service.js`, chatService);
console.log('[SUCCESS] Created chat.service.js');

console.log('\n[COMPLETE] Service Layer ready. Next: Update UI.');