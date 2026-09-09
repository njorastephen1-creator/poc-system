import { supabase } from '../config/supabase.client.js';

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
