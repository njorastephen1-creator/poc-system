import { supabase } from '../config/supabase.client.js';

export const reviewService = {
    async getReviewsForBusiness(businessId) {
        const { data, error } = await supabase
            .from('reviews')
            .select('*, profiles(full_name, avatar_url)')
            .eq('business_id', businessId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async submitReview(businessId, reviewerId, orderId, rating, comment) {
        const { data, error } = await supabase
            .from('reviews')
            .insert([{
                business_id: businessId,
                reviewer_id: reviewerId,
                order_id: orderId,
                rating: rating,
                comment: comment
            }])
            .select()
            .single();
        if (error) throw error;
        return data;
    }
};
