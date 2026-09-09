import { supabase } from '../config/supabase.client.js';

export const groupService = {
    async sendMessage(groupId, userId, content) {
        const { data, error } = await supabase.from('group_messages').insert([{ group_id: groupId, user_id: userId, content }]).select().single();
        if (error) throw error;
        return data;
    },
    async getMessages(groupId) {
        const { data, error } = await supabase.from('group_messages').select('*, profiles(full_name, avatar_url)').eq('group_id', groupId).order('created_at', { ascending: true }).limit(50);
        if (error) throw error;
        return data;
    },
    async updateMemberRole(groupId, userId, role) {
        const { error } = await supabase.from('group_members').update({ role }).eq('group_id', groupId).eq('user_id', userId);
        if (error) throw error;
    },
    async removeMember(groupId, userId) {
        const { error } = await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId);
        if (error) throw error;
    },
    async leaveGroup(groupId, userId) {
        const { error } = await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId);
        if (error) throw error;
    },
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

    async getAllGroups() {
        const { data, error } = await supabase
            .from('groups')
            .select('*, group_benefits(*)')
            .eq('status', 'active');
        if (error) throw error;
        return data;
    },

    async joinGroup(groupId, userId) {
        const { data, error } = await supabase
            .from('group_members')
            .insert([{ group_id: groupId, user_id: userId, status: 'active' }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async getUserGroups(userId) {
        const { data, error } = await supabase
            .from('group_members')
            .select('groups(*)')
            .eq('user_id', userId)
            .eq('status', 'active');
        if (error) throw error;
        return data.map(m => m.groups);
    }
};
