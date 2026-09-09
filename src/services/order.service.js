import { supabase } from '../config/supabase.client.js';

export const orderService = {
    async createOrder(orderData, orderItems) {
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert([orderData])
            .select()
            .single();
        
        if (orderError) throw orderError;

        const itemsWithOrderId = orderItems.map(item => ({
            order_id: order.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal: item.quantity * item.unit_price
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(itemsWithOrderId);
        
        if (itemsError) throw itemsError;

        return order;
    },

    async getOrdersByBuyer(buyerId) {
        const { data, error } = await supabase
            .from('orders')
            .select('*, order_items(*, products(*, businesses(name)))')
            .eq('buyer_id', buyerId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async getOrdersForSeller(sellerId) {
        const { data, error } = await supabase
            .from('orders')
            .select('*, order_items(*, products(*, businesses(id, owner_id))), buyer:profiles(full_name, email)')
            .eq('order_items.products.businesses.owner_id', sellerId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async updateOrderStatus(orderId, newStatus) {
        const { data, error } = await supabase
            .from('orders')
            .update({ order_status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', orderId)
            .select()
            .single();
        if (error) throw error;
        return data;
    }
};
