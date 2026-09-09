const fs = require('fs');

console.log('Starting Sprint 6: Location & Groups...\n');

// 1. Update index.html to include Leaflet CSS/JS
let html = fs.readFileSync('index.html', 'utf8');
if (!html.includes('leaflet.css')) {
    html = html.replace('</head>', '<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />\n</head>');
    fs.writeFileSync('index.html', html);
    console.log('Updated index.html with Leaflet CSS');
}

// 2. Create Group Service
fs.writeFileSync('src/services/group.service.js', `import { supabase } from '../config/supabase.client.js';

export const groupService = {
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
`);
console.log('Created group.service.js');

// 3. Update Main App with Map and Groups
let mainJs = fs.readFileSync('src/main.js', 'utf8');

// Add import for group service
if (!mainJs.includes('group.service.js')) {
    mainJs = mainJs.replace("import { orderService }", "import { groupService } from './services/group.service.js';\nimport { orderService }");
}

// Add nav items
if (!mainJs.includes('nav-map')) {
    mainJs = mainJs.replace("id=\"nav-add-product\"", "id=\"nav-map\" class=\"px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg\">Map</a><a href=\"#\" id=\"nav-groups\" class=\"px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg\">Groups</a><a href=\"#\" id=\"nav-add-product\"");
}

// Add to navigation handler
if (!mainJs.includes("id === 'nav-map'")) {
    mainJs = mainJs.replace("else if (id === 'nav-add-product') navigateTo('add-product');", "else if (id === 'nav-map') navigateTo('map');\n    else if (id === 'nav-groups') navigateTo('groups');\n    else if (id === 'nav-add-product') navigateTo('add-product');");
}

// Add to renderView switch
if (!mainJs.includes("view === 'map'")) {
    mainJs = mainJs.replace("else if (view === 'add-product') renderAddProduct(container);", "else if (view === 'map') renderMap(container);\n        else if (view === 'groups') renderGroups(container);\n        else if (view === 'add-product') renderAddProduct(container);");
}

// Append new functions at the end before the DOMContentLoaded listener
const newFunctions = `
async function renderMap(container) {
    container.innerHTML = '<div class="max-w-7xl mx-auto px-4 py-8"><h2 class="text-3xl font-bold mb-2 text-gray-900">Business Map</h2><p class="text-gray-600 mb-6">Find businesses near you</p><button id="locate-me-btn" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm mb-4 hover:bg-blue-700">Find Near Me</button><div id="map-container" class="h-96 w-full rounded-xl shadow-md border border-gray-200 z-0"></div></div>';
    
    setTimeout(async () => {
        if (typeof L === 'undefined') { container.innerHTML += '<p class="text-red-600">Map library not loaded. Refresh page.</p>'; return; }
        
        const map = L.map('map-container').setView([-1.286389, 36.817223], 12); // Default to Nairobi
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        try {
            const { data: businesses } = await supabase.from('businesses').select('*').eq('status', 'active').not('latitude', 'is', null);
            if (businesses) {
                businesses.forEach(b => {
                    L.marker([b.latitude, b.longitude]).addTo(map)
                        .bindPopup('<b>' + b.name + '</b><br/>' + b.description);
                });
            }
        } catch (err) { console.error('Map error:', err); }

        document.getElementById('locate-me-btn').addEventListener('click', () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((pos) => {
                    map.setView([pos.coords.latitude, pos.coords.longitude], 14);
                    L.marker([pos.coords.latitude, pos.coords.longitude]).addTo(map).bindPopup('You are here').openPopup();
                });
            }
        });
    }, 100);
}

async function renderGroups(container) {
    container.innerHTML = '<div class="max-w-4xl mx-auto px-4 py-8"><h2 class="text-3xl font-bold mb-2 text-gray-900">Community Groups</h2><p class="text-gray-600 mb-6">Join groups to unlock exclusive benefits</p><div id="groups-list" class="space-y-4">Loading groups...</div></div>';
    
    try {
        const groups = await groupService.getAllGroups();
        const userGroups = await groupService.getUserGroups(currentUser.id);
        const joinedIds = userGroups.map(g => g.id);

        if (groups.length === 0) {
            document.getElementById('groups-list').innerHTML = '<p class="text-gray-500">No groups available yet.</p>';
            return;
        }

        const html = groups.map(g => {
            const isJoined = joinedIds.includes(g.id);
            const benefit = g.group_benefits?.[0];
            return '<div class="bg-white p-6 rounded-xl shadow-md border border-gray-200"><div class="flex justify-between items-start"><div><h3 class="text-xl font-bold text-gray-900">' + g.name + '</h3><p class="text-gray-600 mt-1">' + g.description + '</p>' + (benefit ? '<div class="mt-3 p-2 bg-green-50 rounded border border-green-200"><p class="text-sm font-bold text-green-800">Benefit: ' + benefit.title + '</p><p class="text-xs text-green-700">' + benefit.description + '</p></div>' : '') + '</div><button class="join-group-btn bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 ' + (isJoined ? 'opacity-50 cursor-not-allowed' : '') + '" data-id="' + g.id + '" ' + (isJoined ? 'disabled' : '') + '>' + (isJoined ? 'Joined' : 'Join Group') + '</button></div></div>';
        }).join('');

        document.getElementById('groups-list').innerHTML = html;

        document.querySelectorAll('.join-group-btn:not([disabled])').forEach(btn => {
            btn.addEventListener('click', async () => {
                try {
                    await groupService.joinGroup(btn.getAttribute('data-id'), currentUser.id);
                    btn.textContent = 'Joined';
                    btn.disabled = true;
                    btn.className = 'join-group-btn bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium opacity-50 cursor-not-allowed';
                } catch (err) { alert('Error joining group: ' + err.message); }
            });
        });
    } catch (err) {
        document.getElementById('groups-list').innerHTML = '<p class="text-red-600">Error loading groups: ' + err.message + '</p>';
    }
}
`;

// Insert before the final DOMContentLoaded block
const domListener = "if (document.readyState === 'loading')";
mainJs = mainJs.replace(domListener, newFunctions + "\n" + domListener);

fs.writeFileSync('src/main.js', mainJs);
console.log('Main app updated with Map and Groups!');
console.log('\nSprint 6 Update Complete. Refresh your browser.');