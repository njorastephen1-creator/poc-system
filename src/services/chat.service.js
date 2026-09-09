import { supabase } from '../config/supabase.client.js';

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
