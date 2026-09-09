import { supabase } from '../config/supabase.client.js';

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
