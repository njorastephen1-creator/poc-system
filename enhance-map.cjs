const fs = require('fs');

console.log('Enhancing Map with Uber-style features...\n');

let mainJs = fs.readFileSync('src/main.js', 'utf8');

// Replace the renderMap function with enhanced version
const enhancedMap = `async function renderMap(container) {
    container.innerHTML = '<div class="max-w-7xl mx-auto px-4 py-6"><h2 class="text-2xl font-bold mb-2">Business Map</h2><p class="text-gray-600 mb-4 text-sm">Find businesses near you</p><button id="locate-me-btn" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm mb-4 hover:bg-blue-700"><svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> Find Near Me</button><div id="nearby-businesses" class="mb-4 hidden"></div><div id="map-container" class="h-[500px] w-full rounded-xl shadow-md border border-gray-200"></div></div>';
    
    setTimeout(async () => {
        if (typeof window.L === 'undefined') { container.innerHTML += '<p class="text-red-600">Map library not loaded. Refresh page.</p>'; return; }
        
        const map = window.L.map('map-container').setView([-1.286389, 36.817223], 13);
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(map);

        let userMarker = null;
        let userPos = null;

        try {
            const { data: businesses } = await supabase.from('businesses').select('*, businesses_categories(*)').eq('status', 'active').not('latitude', 'is', null);
            
            if (!businesses || businesses.length === 0) {
                document.getElementById('map-container').innerHTML = '<div class="flex items-center justify-center h-full"><p class="text-gray-500">No businesses with location yet</p></div>';
                return;
            }

            // Add markers for all businesses
            businesses.forEach(b => {
                const popupContent = '<div class="p-2"><h3 class="font-bold">' + b.name + '</h3><p class="text-sm text-gray-600">' + b.description + '</p><p class="text-xs text-gray-500 mt-1">' + (b.county || '') + '</p></div>';
                window.L.marker([b.latitude, b.longitude]).addTo(map).bindPopup(popupContent);
            });

            // Locate me button
            document.getElementById('locate-me-btn').addEventListener('click', () => {
                if (navigator.geolocation) {
                    document.getElementById('locate-me-btn').textContent = 'Locating...';
                    navigator.geolocation.getCurrentPosition(async (pos) => {
                        userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                        
                        // Add/update user marker
                        if (userMarker) map.removeLayer(userMarker);
                        userMarker = window.L.marker([userPos.lat, userPos.lng], {
                            icon: window.L.divIcon({
                                className: 'custom-div-icon',
                                html: "<div style='background-color:#3b82f6;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);'></div>",
                                iconSize: [16, 16],
                                iconAnchor: [8, 8]
                            })
                        }).addTo(map).bindPopup('You are here');
                        
                        map.setView([userPos.lat, userPos.lng], 14);
                        
                        // Calculate and display nearby businesses
                        await displayNearbyBusinesses(userPos, businesses);
                        
                        document.getElementById('locate-me-btn').innerHTML = '<svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> Update Location';
                    }, (err) => {
                        alert('Could not get your location: ' + err.message);
                        document.getElementById('locate-me-btn').textContent = 'Find Near Me';
                    });
                }
            });
        } catch (err) {
            console.error('Map error:', err);
            document.getElementById('map-container').innerHTML = '<div class="flex items-center justify-center h-full"><p class="text-red-500">Error loading map: ' + err.message + '</p></div>';
        }
    }, 100);
};

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function estimateTime(distanceKm) {
    // Assume average speed of 30 km/h in city + traffic
    const timeMinutes = Math.round((distanceKm / 30) * 60);
    if (timeMinutes < 5) return '2-5 mins';
    if (timeMinutes < 15) return timeMinutes + ' mins';
    if (timeMinutes < 60) return Math.round(timeMinutes / 5) * 5 + ' mins';
    return Math.round(timeMinutes / 60) + 'h ' + (timeMinutes % 60) + ' mins';
}

async function displayNearbyBusinesses(userPos, businesses) {
    const nearbyDiv = document.getElementById('nearby-businesses');
    
    // Calculate distances and sort
    const businessesWithDistance = businesses.map(b => {
        const distance = calculateDistance(userPos.lat, userPos.lng, b.latitude, b.longitude);
        return { ...b, distance };
    }).sort((a, b) => a.distance - b.distance);
    
    const top5 = businessesWithDistance.slice(0, 5);
    
    const html = top5.map((b, index) => {
        const time = estimateTime(b.distance);
        const isOpen = true; // Could check business hours
        return '<div class="bg-white p-4 rounded-lg shadow-md border border-gray-200 mb-3 hover:shadow-lg transition cursor-pointer" onclick="focusBusiness(' + b.latitude + ',' + b.longitude + ',\'' + b.name + '\')"><div class="flex justify-between items-start"><div class="flex-1"><div class="flex items-center gap-2"><h4 class="font-bold text-gray-900">' + (index + 1) + '. ' + b.name + '</h4><span class="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">' + (isOpen ? 'Open' : 'Closed') + '</span></div><p class="text-sm text-gray-600 mt-1">' + b.description.substring(0, 60) + (b.description.length > 60 ? '...' : '') + '</p><div class="flex items-center gap-4 mt-2 text-sm"><span class="flex items-center text-blue-600 font-medium"><svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>' + time + '</span><span class="flex items-center text-gray-600"><svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>' + b.distance.toFixed(1) + ' km</span></div>' + (b.phone ? '<p class="text-xs text-gray-500 mt-2">📞 ' + b.phone + '</p>' : '') + (b.opening_days ? '<p class="text-xs text-gray-500 mt-1">🕐 ' + b.opening_days + ' (' + b.business_hours + ')</p>' : '') + '</div><div class="ml-4"><button class="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700">View</button></div></div></div>';
    }).join('');
    
    nearbyDiv.innerHTML = '<h3 class="font-bold text-lg mb-3">Nearby Businesses</h3>' + html;
    nearbyDiv.classList.remove('hidden');
    
    // Make focusBusiness global
    window.focusBusiness = (lat, lng, name) => {
        map.setView([lat, lng], 16);
    };
}

// Add to window scope
window.focusBusiness = function(lat, lng, name) {
    console.log('Focusing on:', name, lat, lng);
};
`;

// Replace the old renderMap function
const oldMapStart = 'async function renderMap(container) {';
const oldMapEnd = "async function renderGroups(container) {";
const startIndex = mainJs.indexOf(oldMapStart);
const endIndex = mainJs.indexOf(oldMapEnd);

if (startIndex !== -1 && endIndex !== -1) {
    const before = mainJs.substring(0, startIndex);
    const after = mainJs.substring(endIndex);
    mainJs = before + enhancedMap + '\n\n' + after;
    fs.writeFileSync('src/main.js', mainJs);
    console.log(' Map enhanced with Uber-style features!');
} else {
    console.log(' Could not find renderMap function to replace');
}