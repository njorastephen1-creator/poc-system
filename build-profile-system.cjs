const fs = require('fs');

console.log('[INFO] Building Professional Profile & Business Identity System...\n');

// 1. CREATE REVIEW SERVICE
const reviewService = `import { supabase } from '../config/supabase.client.js';

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
`;
fs.writeFileSync('src/services/review.service.js', reviewService);
console.log('[SUCCESS] Created review.service.js');

// 2. UPDATE PROFILE SERVICE (Add completion score logic)
let profileService = fs.readFileSync('src/services/profile.service.js', 'utf8');
if (!profileService.includes('calculateProfileCompletion')) {
    const addition = `
    calculateProfileCompletion(profile) {
        let score = 0;
        if (profile?.full_name) score += 20;
        if (profile?.avatar_url) score += 20;
        if (profile?.headline) score += 20;
        if (profile?.bio) score += 20;
        if (profile?.location_text) score += 20;
        return score;
    }`;
    // Insert before the last closing brace
    const lastBrace = profileService.lastIndexOf('};');
    profileService = profileService.substring(0, lastBrace) + addition + '\n' + profileService.substring(lastBrace);
    fs.writeFileSync('src/services/profile.service.js', profileService);
    console.log('[SUCCESS] Updated profile.service.js');
}

// 3. UPDATE MAIN.JS WITH NEW UI
let mainJs = fs.readFileSync('src/main.js', 'utf8');

// Add import for review service if not exists
if (!mainJs.includes("import { reviewService }")) {
    mainJs = mainJs.replace("import { profileService }", "import { profileService } from './services/profile.service.js';\nimport { reviewService }");
}

// Add new UI functions before the auth modal functions
const newUIFunctions = `
// ==========================================
// PROFESSIONAL PROFILE UI (Version 2.0)
// ==========================================
async function renderProfessionalProfile(container, userId = currentUser.id) {
    const isMe = userId === currentUser.id;
    const profile = isMe ? userProfile : await profileService.getProfile(userId);
    if (!profile) { container.innerHTML = '<p class="text-center p-8">Profile not found.</p>'; return; }
    
    const completionScore = profileService.calculateProfileCompletion(profile);
    const businesses = profile.businesses || [];
    const isVerified = profile.verification_status === 'verified';
    
    container.innerHTML = \`
        <div class="max-w-5xl mx-auto px-4 py-6">
            <!-- Cover & Header -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div class="h-48 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
                    \${profile.cover_image_url ? '<img src="' + profile.cover_image_url + '" class="w-full h-full object-cover">' : ''}
                </div>
                <div class="px-6 pb-6 relative">
                    <div class="flex flex-col md:flex-row md:items-end gap-4 -mt-16">
                        <div class="w-32 h-32 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-lg flex-shrink-0">
                            \${profile.avatar_url ? '<img src="' + profile.avatar_url + '" class="w-full h-full object-cover">' : '<div class="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-500">' + (profile.full_name || 'U')[0].toUpperCase() + '</div>'}
                        </div>
                        <div class="flex-1 pb-2">
                            <div class="flex items-center gap-2 flex-wrap">
                                <h1 class="text-2xl font-bold text-gray-900">\${profile.full_name || 'Anonymous'}</h1>
                                \${isVerified ? '<span class="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1"><svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>Verified</span>' : ''}
                            </div>
                            <p class="text-gray-600 font-medium mt-1">\${profile.headline || 'Professional Headline'}</p>
                            <div class="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                \${profile.location_text ? '<span class="flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>' + profile.location_text + '</span>' : ''}
                                <span class="flex items-center gap-1">
                                    <svg class="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                                    4.8 (124 reviews)
                                </span>
                            </div>
                        </div>
                        <div class="flex gap-2 pb-2">
                            \${isMe ? '<button onclick="window.editProfile()" class="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>Edit Profile</button>' : '<button class="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition">Message</button><button class="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition">Follow</button>'}
                        </div>
                    </div>
                    
                    <!-- Profile Completion (Only for own profile) -->
                    \${isMe ? \`
                    <div class="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-sm font-medium text-gray-700">Profile Strength</span>
                            <span class="text-sm font-bold text-blue-600">\${completionScore}% Complete</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-blue-600 h-2 rounded-full transition-all" style="width: \${completionScore}%"></div>
                        </div>
                        <p class="text-xs text-gray-500 mt-2">Complete your profile to build trust with buyers and businesses.</p>
                    </div>
                    \` : ''}
                </div>
            </div>

            <!-- Content Grid -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Left Column: About & Details -->
                <div class="md:col-span-1 space-y-6">
                    <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h3 class="font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            About
                        </h3>
                        <p class="text-gray-600 text-sm leading-relaxed">\${profile.bio || 'No bio yet. Click Edit Profile to add your professional story.'}</p>
                    </div>
                    
                    <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h3 class="font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                            Contact
                        </h3>
                        <div class="space-y-2 text-sm">
                            <p class="text-gray-600 break-all">\${currentUser.email}</p>
                            \${profile.phone ? '<p class="text-gray-600">' + profile.phone + '</p>' : ''}
                        </div>
                    </div>
                </div>

                <!-- Right Column: Businesses & Activity -->
                <div class="md:col-span-2 space-y-6">
                    <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h3 class="font-bold text-gray-900 mb-4 flex items-center justify-between">
                            <span class="flex items-center gap-2">
                                <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                Businesses
                            </span>
                            \${isMe ? '<button onclick="navigateTo(\'my-business\')" class="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add Business</button>' : ''}
                        </h3>
                        \${businesses.length > 0 ? businesses.map(b => \`
                            <div class="border border-gray-100 rounded-xl p-4 mb-3 hover:shadow-md transition cursor-pointer" onclick="window.viewBusiness('\${b.id}')">
                                <div class="flex justify-between items-start">
                                    <div>
                                        <h4 class="font-bold text-gray-900">\${b.name}</h4>
                                        <p class="text-sm text-gray-500">\${b.category || 'General Business'}</p>
                                    </div>
                                    <span class="px-2 py-1 rounded-full text-xs font-semibold \${b.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">\${b.status || 'open'}</span>
                                </div>
                                <p class="text-sm text-gray-600 mt-2 line-clamp-2">\${b.description || 'No description'}</p>
                            </div>
                        \`).join('') : '<p class="text-gray-500 text-sm text-center py-4">No businesses connected yet.</p>'}
                    </div>
                </div>
            </div>
        </div>
    \`;
}

// Expose to window
window.renderProfessionalProfile = renderProfessionalProfile;
window.viewBusiness = (id) => alert('View business: ' + id); // Placeholder for next step
`;

// Replace the old renderProfile function with the new one
mainJs = mainJs.replace(/async function renderProfile\(container\) \{[\s\S]*?\n\}\n/, newUIFunctions + '\n');

// Update the renderView switch case to use the new function name if needed, or just keep it mapping to 'profile'
mainJs = mainJs.replace("else if (view === 'profile') renderProfile(container);", "else if (view === 'profile') renderProfessionalProfile(container);");

fs.writeFileSync('src/main.js', mainJs);
console.log('[SUCCESS] Updated main.js with Professional Profile UI.');
console.log('[COMPLETE] Hard refresh your browser (Ctrl + F5) to see the new ecosystem.');