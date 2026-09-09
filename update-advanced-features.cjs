const fs = require('fs');
const path = require('path');

function writeFile(filePath, content) {
    const fullPath = path.join(__dirname, filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, content);
    console.log('[SUCCESS] Updated: ' + filePath);
}

console.log('[INFO] Updating Advanced Features (Profiles, Chat, Admin)...\n');

// 1. Create Profile Service
writeFile('src/services/profile.service.js', `import { supabase } from '../config/supabase.client.js';

export const profileService = {
    async getProfile(userId) {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },
    async updateProfile(userId, updates) {
        const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId).select().single();
        if (error) throw error;
        return data;
    },
    async uploadAvatar(file) {
        const fileExt = file.name.split('.').pop();
        const fileName = \`\${Date.now()}.\${fileExt}\`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
        return data.publicUrl;
    }
};
`);

// 2. Update Group Service
let groupService = fs.readFileSync('src/services/group.service.js', 'utf8');
if (!groupService.includes('sendMessage')) {
    const chatMethods = `
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
    },`;
    groupService = groupService.replace('export const groupService = {', 'export const groupService = {' + chatMethods);
    fs.writeFileSync('src/services/group.service.js', groupService);
    console.log('[SUCCESS] Updated group.service.js with Chat and Admin methods.');
}

// 3. Update Main.js (Simplified for this prompt - adding Profile and Chat UI)
let mainJs = fs.readFileSync('src/main.js', 'utf8');

// Add Profile Import
if (!mainJs.includes('profile.service.js')) {
    mainJs = mainJs.replace("import { groupService }", "import { profileService } from './services/profile.service.js';\nimport { groupService }");
}

// Add Nav Link
if (!mainJs.includes('nav-profile')) {
    mainJs = mainJs.replace('id="nav-add-product"', 'id="nav-profile" class="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">Profile</a><a href="#" id="nav-add-product"');
}

// Add Navigation Handler
if (!mainJs.includes("id === 'nav-profile'")) {
    mainJs = mainJs.replace("else if (id === 'nav-add-product')", "else if (id === 'nav-profile') navigateTo('profile'); else if (id === 'nav-add-product')");
}

// Add to Render View
if (!mainJs.includes("view === 'profile'")) {
    mainJs = mainJs.replace("else if (view === 'add-product')", "else if (view === 'profile') renderProfile(container); else if (view === 'add-product')");
}

fs.writeFileSync('src/main.js', mainJs);
console.log('[SUCCESS] Added Profile navigation and routing.');

console.log('\n[COMPLETE] Database and Services updated. Next step: Update UI.');