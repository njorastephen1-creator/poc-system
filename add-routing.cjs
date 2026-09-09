const fs = require('fs');

console.log('Adding Uber-style route visualization...\n');

// Update index.html to include routing libraries
let html = fs.readFileSync('index.html', 'utf8');

// Add Leaflet Routing Machine CSS if not present
if (!html.includes('leaflet-routing-machine')) {
    html = html.replace('</head>', '<link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.css" />\n</head>');
    fs.writeFileSync('index.html', html);
    console.log('Added routing CSS');
}

// Update main.js to add routing functionality
let mainJs = fs.readFileSync('src/main.js', 'utf8');

// Replace the renderMap function with enhanced routing version
const enhancedMap = `async function renderMap(container) {
    container.innerHTML = '<div class="max-w-7xl mx-auto px-4 py-6"><h2 class="text-2xl font-bold mb-2">Business Map</h2><p class="text-gray-600 mb-4 text-sm">Find businesses near you</p><button id="locate-me-btn" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm mb-4 hover:bg-blue-700 flex items-center gap-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> Find Near Me</button><div id="route-info" class="hidden mb-4 bg-blue-50 p-4 rounded-lg border border-blue-200"><div class="flex justify-between items-center"><div><h3 class="font-bold text-blue-900">Route to <span id="route-destination">Destination</span></h3><p class="text-sm text-blue-700 mt-1">Distance: <span id="route-distance">-</span> | Time: <span id="route-time">-</span></p></div><button id="cancel-route" class="text-red-600 hover:text-red-800 text-sm font-medium">Cancel</button></div></div><div id="nearby-list" class="mb-4 space-y-3"></div><div id="map-container" class="h-[500px] w-full rounded-xl shadow-md border border-gray-200 z-0"></div></div>';
    
    setTimeout(async () => {
        if (typeof window.L === 'undefined') { document.getElementById('map-container').innerHTML = '<div class="flex h-full items-center justify-center text-red-500">Map library not loaded. Refresh page.</div>'; return; }
        
        const map = window.L.map('map-container').setView([-1.286389, 36.817223], 12);
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
        
        let userMarker = null;
        let userPos = null;
        let routeControl = null;
        let animationMarker = null;
        let animationInterval = null;

        try {
            const { data: businesses } = await supabase.from('businesses').select('*').eq('status', 'active').not('latitude', 'is', null);
            if (!businesses || businesses.length === 0) { document.getElementById('map-container').innerHTML = '<div class="flex h-full items-center justify-center text-gray-500">No businesses with location data yet.</div>'; return; }

            // Add business markers
            businesses.forEach(b => {
                window.L.marker([b.latitude, b.longitude]).addTo(map)
                    .bindPopup('<b>' + b.name + '</b><br/>' + b.description + '<br/><button class="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-xs" onclick="window.showRouteToBusiness(' + b.latitude + ',' + b.longitude + ',\'' + b.name + '\')">Get Directions</button>');
            });

            // Locate me button
            document.getElementById('locate-me-btn').addEventListener('click', () => {
                if (navigator.geolocation) {
                    const btn = document.getElementById('locate-me-btn');
                    btn.innerHTML = 'Locating...'; btn.disabled = true;
                    navigator.geolocation.getCurrentPosition(async (pos) => {
                        userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                        
                        if (userMarker) map.removeLayer(userMarker);
                        userMarker = window.L.marker([userPos.lat, userPos.lng], {
                            icon: window.L.divIcon({
                                className: 'user-location',
                                html: "<div style='background:#3b82f6;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);animation: pulse 2s infinite;'></div>",
                                iconSize: [16, 16],
                                iconAnchor: [8, 8]
                            })
                        }).addTo(map).bindPopup('You are here');
                        
                        map.setView([userPos.lat, userPos.lng], 13);
                        
                        // Calculate and display nearby businesses
                        const nearby = businesses.map(b => {
                            const dist = calculateDistance(userPos.lat, userPos.lng, b.latitude, b.longitude);
                            return { ...b, distance: dist };
                        }).sort((a, b) => a.distance - b.distance);

                        const listHtml = nearby.slice(0, 5).map((b, i) => {
                            const time = Math.round((b.distance / 30) * 60);
                            return '<div class="bg-white p-4 rounded-lg shadow border border-gray-200 flex justify-between items-center cursor-pointer hover:shadow-md transition" onclick="window.showRouteToBusiness(' + b.latitude + ',' + b.longitude + ',\'' + b.name + '\')"><div><h4 class="font-bold text-gray-900">' + (i+1) + '. ' + b.name + '</h4><p class="text-xs text-gray-500">' + b.county + '</p><div class="flex gap-3 mt-1 text-xs"><span class="text-blue-600 font-medium">~' + (time < 5 ? '5' : time) + ' mins</span><span class="text-gray-600">📍 ' + b.distance.toFixed(1) + ' km</span></div></div><button class="bg-blue-50 text-blue-600 px-3 py-1 rounded text-xs font-medium">Directions</button></div>';
                        }).join('');
                        
                        document.getElementById('nearby-list').innerHTML = '<h3 class="font-bold text-sm text-gray-700 mb-2">Nearest to you:</h3>' + listHtml;
                        btn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Location Found'; btn.disabled = false;
                    }, (err) => { alert('Location access denied'); btn.innerHTML = 'Find Near Me'; btn.disabled = false; });
                }
            });

            // Cancel route button
            document.getElementById('cancel-route').addEventListener('click', () => {
                if (routeControl) { map.removeControl(routeControl); routeControl = null; }
                if (animationInterval) { clearInterval(animationInterval); animationInterval = null; }
                if (animationMarker) { map.removeLayer(animationMarker); animationMarker = null; }
                document.getElementById('route-info').classList.add('hidden');
            });

            // Global function to show route
            window.showRouteToBusiness = async (lat, lng, name) => {
                if (!userPos) { alert('Please click "Find Near Me" first to set your location'); return; }
                
                document.getElementById('route-destination').textContent = name;
                document.getElementById('route-info').classList.remove('hidden');
                
                // Remove existing route
                if (routeControl) { map.removeControl(routeControl); }
                if (animationInterval) { clearInterval(animationInterval); }
                if (animationMarker) { map.removeLayer(animationMarker); }

                // Use OSRM for routing (free, open-source)
                const osrmUrl = 'https://router.project-osrm.org/route/v1/driving/' + userPos.lng + ',' + userPos.lat + ';' + lng + ',' + lat + '?overview=full&geometries=geojson';
                
                try {
                    const response = await fetch(osrmUrl);
                    const data = await response.json();
                    
                    if (data.routes && data.routes.length > 0) {
                        const route = data.routes[0];
                        const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]); // Convert to lat/lng
                        
                        // Draw route line (black like Uber)
                        const routeLine = window.L.polyline(coordinates, {
                            color: '#000000',
                            weight: 5,
                            opacity: 0.8,
                            smoothFactor: 1
                        }).addTo(map);
                        
                        // Fit map to show both points
                        map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
                        
                        // Display route info
                        const distanceKm = (route.distance / 1000).toFixed(1);
                        const durationMins = Math.round(route.duration / 60);
                        document.getElementById('route-distance').textContent = distanceKm + ' km';
                        document.getElementById('route-time').textContent = durationMins + ' mins';
                        
                        // Animate marker along route
                        animateAlongRoute(coordinates, routeLine);
                    } else {
                        alert('No route found');
                    }
                } catch (err) {
                    console.error('Routing error:', err);
                    alert('Could not calculate route: ' + err.message);
                }
            };

            function animateAlongRoute(coordinates, routeLine) {
                let currentIndex = 0;
                const speed = 100; // ms between points
                
                // Create animated marker (car icon)
                const carIcon = window.L.divIcon({
                    className: 'car-marker',
                    html: "<div style='background:#000;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.5);transform:rotate(45deg);'></div>",
                    iconSize: [12, 12],
                    iconAnchor: [6, 6]
                });
                
                animationMarker = window.L.marker(coordinates[0], { icon: carIcon }).addTo(map);
                
                animationInterval = setInterval(() => {
                    if (currentIndex < coordinates.length - 1) {
                        currentIndex++;
                        animationMarker.setLatLng(coordinates[currentIndex]);
                        
                        // Calculate bearing for rotation
                        if (currentIndex > 0) {
                            const prev = coordinates[currentIndex - 1];
                            const curr = coordinates[currentIndex];
                            const bearing = Math.atan2(curr[1] - prev[1], curr[0] - prev[0]) * 180 / Math.PI;
                            const markerEl = animationMarker.getElement();
                            if (markerEl) {
                                const iconEl = markerEl.querySelector('div');
                                if (iconEl) {
                                    iconEl.style.transform = 'rotate(' + (bearing + 45) + 'deg)';
                                }
                            }
                        }
                    } else {
                        clearInterval(animationInterval);
                        animationInterval = null;
                    }
                }, speed);
            }

        } catch (err) { console.error(err); }
    }, 100);
};

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; const dLat = (lat2 - lat1) * Math.PI / 180; const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}`;

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
    console.log('[SUCCESS] Added Uber-style routing with animated movement!');
} else {
    console.log('[ERROR] Could not find renderMap function');
}