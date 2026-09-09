import { supabase } from '../config/supabase.client.js';

export const authService = {
    async signUp(email, password, fullName) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } }
        });
        if (error) throw error;
        return data;
    },

    async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        return data;
    },

    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    async getSession() {
        const { data } = await supabase.auth.getSession();
        return data.session;
    },

    async getCurrentUser() {
        const { data } = await supabase.auth.getUser();
        return data.user;
    }
};
