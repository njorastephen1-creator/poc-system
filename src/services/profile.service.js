import { supabase } from '../config/supabase.client.js';

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

    calculateProfileCompletion(profile) {
        let score = 0;
        if (profile?.full_name) score += 20;
        if (profile?.avatar_url) score += 20;
        if (profile?.headline) score += 20;
        if (profile?.bio) score += 20;
        if (profile?.location_text) score += 20;
        return score;
    }
};
