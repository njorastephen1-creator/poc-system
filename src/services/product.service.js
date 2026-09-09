import { supabase } from '../config/supabase.client.js';

export const productService = {
    async createProduct(productData) {
        const { data, error } = await supabase
            .from('products')
            .insert([productData])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async getProductsByBusiness(businessId) {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('business_id', businessId);
        if (error) throw error;
        return data;
    },

    async getAllActiveProducts() {
        const { data, error } = await supabase
            .from('products')
            .select('*, businesses(name, owner_id)')
            .eq('is_active', true);
        if (error) throw error;
        return data;
    },

    async updateStock(productId, newStock) {
        const { data, error } = await supabase
            .from('products')
            .update({ stock_quantity: newStock })
            .eq('id', productId)
            .select()
            .single();
        if (error) throw error;
        return data;
    }
};
