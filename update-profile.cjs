const fs = require('fs');

console.log('[INFO] Updating Professional Profile UI...\n');

let mainJs = fs.readFileSync('src/main.js', 'utf8');

// 1. Ensure 'profile' view is routed correctly
if (!mainJs.includes("else if (view === 'profile') renderProfessionalProfile(container);")) {
    mainJs = mainJs.replace(
        "else if (view === 'groups') renderGroups(container);",
        "else if (view === 'groups') renderGroups(container);\n        else if (view === 'profile') renderProfessionalProfile(container);"
    );
}

// 2. Add the Professional Profile Functions at the end of the file
const profileFunctions = `

// ==========================================
// PROFESSIONAL PROFILE SYSTEM (Version 2.0)
// ==========================================
async function renderProfessionalProfile(container) {
    if (!currentUser) { navigateTo('home'); return; }
    
    // Fetch latest profile data
    let profile = await profileService.getProfile(currentUser.id) || {};
    const businesses = await businessService.getMyBusinesses(currentUser.id) || [];
    
    // Calculate completion score
    let score = 0;
    if (profile.full_name) score += 20;
    if (profile.avatar_url) score += 20;
    if (profile.headline) score += 20;
    if (profile.bio) score += 20;
    if (profile.location_text) score += 20;

    container.innerHTML = \`
        <div class="max-w-5xl mx-auto px-4 py-8">
            <!-- Header Card -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div class="h-32 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
                    \${profile.cover_image_url ? '<img src="' + profile.cover_image_url + '" class="w-full h-full object-cover">' : ''}
                </div>
                <div class="px-6 pb-6 relative">
                    <div class="flex flex-col md:flex-row md:items-end gap-4 -mt-12">
                        <div class="w-24 h-24 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-lg flex-shrink-0 flex items-center justify-center text-3xl font-bold text-gray-500">
                            \${profile.avatar_url ? '<img src="' + profile.avatar_url + '" class="w-full h-full object-cover">' : (profile.full_name || 'U')[0].toUpperCase()}
                        </div>
                        <div class="flex-1 pb-2">
                            <div class="flex items-center gap-2 flex-wrap">
                                <h1 class="text-2xl font-bold text-gray-900">\${profile.full_name || 'Anonymous User'}</h1>
                                \${profile.verification_status === 'verified' ? '<span class="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1"><svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>Verified</span>' : ''}
                            </div>
                            <p class="text-gray-600 font-medium mt-1">\${profile.headline || 'Add your professional headline'}</p>
                            <div class="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                \${profile.location_text ? '<span class="flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>' + profile.location_text + '</span>' : ''}
                            </div>
                        </div>
                        <div class="flex gap-2 pb-2">
                            <button onclick="window.editProfile()" class="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>Edit Profile</button>
                        </div>
                    </div>
                    
                    <!-- Profile Strength -->
                    <div class="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-sm font-medium text-gray-700">Profile Strength</span>
                            <span class="text-sm font-bold text-blue-600">\${score}% Complete</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-blue-600 h-2 rounded-full transition-all" style="width: \${score}%"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Content Grid -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Left Column -->
                <div class="md:col-span-1 space-y-6">
                    <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h3 class="font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            About
                        </h3>
                        <p class="text-gray-600 text-sm leading-relaxed">\${profile.bio || 'No bio yet. Click Edit Profile to add your professional story.'}</p>
                    </div>
                </div>

                <!-- Right Column: Businesses -->
                <div class="md:col-span-2 space-y-6">
                    <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h3 class="font-bold text-gray-900 mb-4 flex items-center justify-between">
                            <span class="flex items-center gap-2">
                                <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                My Businesses
                            </span>
                            <button onclick="navigateTo('my-business')" class="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add Business</button>
                        </h3>
                        \${businesses.length > 0 ? businesses.map(b => \`
                            <div class="border border-gray-100 rounded-xl p-4 mb-3 hover:shadow-md transition cursor-pointer">
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

window.editProfile = () => {
    alert('Edit Profile Modal: This will open a form to update Name, Headline, Bio, and Location. (Integration with Supabase profiles table required).');
    // In a full implementation, this would open a modal similar to the auth modal
    // that calls profileService.updateProfile(currentUser.id, updates);
};
`;

// Append functions if they don't exist
if (!mainJs.includes('async function renderProfessionalProfile')) {
    fs.writeFileSync('src/main.js', mainJs + profileFunctions);
    console.log('[SUCCESS] Professional Profile UI added.');
} else {
    console.log('[INFO] Professional Profile UI already exists.');
}

console.log('[COMPLETE] Ready to push to GitHub.');