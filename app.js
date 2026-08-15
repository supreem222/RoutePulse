// RoutePulse Application Logic & Dynamic Routing Engine

// Locations Data: Cities, Districts, and Remote Villages across Nepal
const locations = [
    { name: "Butwal", type: "City (Lumbini)" },
    { name: "Kathmandu", type: "Capital City (Bagmati)" },
    { name: "Pokhara", type: "City (Gandaki)" },
    { name: "Narayangadh (Chitwan)", type: "City (Bagmati/Gandaki corridor)" },
    { name: "Bhairahawa", type: "City (Lumbini)" },
    { name: "Surkhet", type: "City (Karnali)" },
    { name: "Biratnagar", type: "City (Koshi)" },
    { name: "Dharan", type: "City (Koshi)" },
    { name: "Bandipur", type: "Hill Station Village (Tanahun)" },
    { name: "Gorkha Bazaar", type: "Historical District Hub" },
    { name: "Jomsom (Mustang)", type: "Mountain Village Hub" },
    { name: "Manang Village", type: "High Altitude Village" },
    { name: "Namche Bazaar", type: "Himalayan Village (Solukhumbu)" }
];

// Master Database of Routes & Vehicles
const masterVehicles = [
    {
        id: 1,
        name: "Lumbini Super Deluxe",
        number: "Ba 2 Kha 8921",
        type: "Deluxe AC Bus",
        origin: "Butwal",
        destination: "Kathmandu",
        departure: "07:30 AM",
        price: 1100,
        totalSeats: 32,
        bookedSeats: 21,
        rating: 4.8,
        reviewsCount: 142,
        amenities: ["Air Conditioning", "Air Suspension", "Free Wi-Fi", "Charging Ports"],
        coords: [27.700769, 85.300140]
    },
    {
        id: 2,
        name: "Pokhara Luxury Sofa Express",
        number: "Ga 1 Kha 4012",
        type: "VIP Sofa Seater",
        origin: "Pokhara",
        destination: "Kathmandu",
        departure: "08:15 AM",
        price: 1500,
        totalSeats: 28,
        bookedSeats: 18,
        rating: 4.9,
        reviewsCount: 96,
        amenities: ["Premium Sofa", "Air Suspension", "Air Conditioning"],
        coords: [28.2096, 83.9856]
    },
    {
        id: 3,
        name: "Mustang Mountain Conqueror",
        number: "Ga 2 Pa 9011",
        type: "4x4 Offroad Jeep",
        origin: "Pokhara",
        destination: "Jomsom (Mustang)",
        departure: "06:00 AM",
        price: 2200,
        totalSeats: 8,
        bookedSeats: 5,
        rating: 4.7,
        reviewsCount: 64,
        amenities: ["4WD Terrain Control", "Heated Seats", "Luggage Carrier"],
        coords: [28.7800, 83.7300]
    },
    {
        id: 4,
        name: "Chitwan Micro Express",
        number: "Ba 4 Kha 1920",
        type: "HiAce Microbus",
        origin: "Butwal",
        destination: "Narayangadh (Chitwan)",
        departure: "09:00 AM",
        price: 650,
        totalSeats: 14,
        bookedSeats: 10,
        rating: 4.5,
        reviewsCount: 51,
        amenities: ["Air Conditioning", "Fast Transit"],
        coords: [27.6833, 84.4333]
    }
];

let selectedSeat = null;
let leafletMap = null;
let currentMarker = null;

// Application Initialization
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    populateLocationDropdowns();
    renderVehicles(masterVehicles);
    initMap();
});

// Dynamic Location Populator
function populateLocationDropdowns() {
    const originSel = document.getElementById('origin-select');
    const destSel = document.getElementById('destination-select');
    const opOrigin = document.getElementById('operator-origin');
    const opDest = document.getElementById('operator-destination');

    let html = locations.map(loc => `<option value="${loc.name}">${loc.name} - ${loc.type}</option>`).join('');

    originSel.innerHTML = html;
    destSel.innerHTML = html;
    if (opOrigin) opOrigin.innerHTML = html;
    if (opDest) opDest.innerHTML = html;

    // Set Defaults
    originSel.value = "Butwal";
    destSel.value = "Kathmandu";
}

// Render Vehicles Card Generator
function renderVehicles(list) {
    const container = document.getElementById('vehicle-list');
    container.innerHTML = '';

    if (list.length === 0) {
        container.innerHTML = `
            <div class="bg-white p-8 rounded-xl text-center border border-slate-200">
                <i data-lucide="bus" class="w-12 h-12 text-slate-300 mx-auto mb-3"></i>
                <h4 class="font-bold text-slate-700">No Vehicles Direct Match</h4>
                <p class="text-xs text-slate-500 mt-1">Try selecting a major connected hub like Butwal, Kathmandu, or Pokhara.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    list.forEach(v => {
        const availableSeats = v.totalSeats - v.bookedSeats;
        const card = document.createElement('div');
        card.className = "bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-4";
        card.innerHTML = `
            <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-100 pb-3">
                <div>
                    <span class="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">${v.type}</span>
                    <h4 class="text-lg font-bold text-slate-900 mt-1">${v.name} <span class="text-xs text-slate-400 font-normal">(${v.number})</span></h4>
                </div>
                <div class="text-left sm:text-right">
                    <span class="text-2xl font-black text-slate-900">NPR ${v.price}</span>
                    <span class="text-xs text-slate-500 block">per reserved seat</span>
                </div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600">
                <div>
                    <span class="text-slate-400 block">Route</span>
                    <span class="font-bold text-slate-800">${v.origin} → ${v.destination}</span>
                </div>
                <div>
                    <span class="text-slate-400 block">Departure Time</span>
                    <span class="font-bold text-slate-800">${v.departure}</span>
                </div>
                <div>
                    <span class="text-slate-400 block">Available Seats</span>
                    <span class="font-bold ${availableSeats < 5 ? 'text-amber-600' : 'text-emerald-600'}">${availableSeats} Left (${v.totalSeats} Total)</span>
                </div>
                <div>
                    <span class="text-slate-400 block">Rating</span>
                    <span class="font-bold text-slate-800 flex items-center gap-1">
                        <i data-lucide="star" class="w-3.5 h-3.5 fill-amber-400 text-amber-400"></i> ${v.rating} (${v.reviewsCount})
                    </span>
                </div>
            </div>

            <div class="flex flex-wrap gap-1.5 text-[11px] text-slate-500">
                ${v.amenities.map(a => `<span class="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">${a}</span>`).join('')}
            </div>

            <div class="flex flex-col sm:flex-row gap-2 pt-2">
                <button onclick="openBookingModal(${v.id})" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-xs transition-all flex items-center justify-center gap-1">
                    <i data-lucide="ticket" class="w-4 h-4"></i> Reserve Seat
                </button>
                <button onclick="trackVehicle(${v.id})" class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-lg text-xs transition-all flex items-center justify-center gap-1">
                    <i data-lucide="map-pin" class="w-4 h-4"></i> Track Live GPS
                </button>
            </div>
        `;
        container.appendChild(card);
    });
    lucide.createIcons();
}

// Fallback Search Engine Algorithm
function handleSearch(e) {
    e.preventDefault();
    const origin = document.getElementById('origin-select').value;
    const destination = document.getElementById('destination-select').value;

    // Direct Match Search
    let results = masterVehicles.filter(v => v.origin === origin && v.destination === destination);

    // Fallback Dynamic Routing System
    if (results.length === 0) {
        results = [
            {
                id: 99,
                name: `${origin}-${destination} Connecting Transit`,
                number: "Ba 3 Kha 5050",
                type: "Connecting HiAce / Jeep Route",
                origin: origin,
                destination: destination,
                departure: "07:00 AM",
                price: 1450,
                totalSeats: 14,
                bookedSeats: 4,
                rating: 4.6,
                reviewsCount: 28,
                amenities: ["Connecting Route", "Mountain Luggage Rack"],
                coords: [27.700769, 85.300140]
            }
        ];
    }

    renderVehicles(results);
}

// Tab View Switcher
function switchTab(tabId) {
    document.querySelectorAll('.view-panel').forEach(panel => panel.classList.add('hidden'));
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('text-blue-600', 'bg-blue-50');
        btn.classList.add('text-slate-600');
    });

    document.getElementById(`view-${tabId}`).classList.remove('hidden');
    const activeBtn = document.getElementById(`tab-${tabId}`);
    if (activeBtn) {
        activeBtn.classList.add('text-blue-600', 'bg-blue-50');
        activeBtn.classList.remove('text-slate-600');
    }

    if (tabId === 'tracking' && leafletMap) {
        setTimeout(() => leafletMap.invalidateSize(), 200);
    }
}

// Real Leaflet OpenStreetMap Engine
function initMap() {
    leafletMap = L.map('map').setView([27.700769, 85.300140], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(leafletMap);

    currentMarker = L.marker([27.700769, 85.300140]).addTo(leafletMap)
        .bindPopup('<b>Lumbini Super Deluxe</b><br>Speed: 52 km/h')
        .openPopup();

    populateTimeline();
}

function trackVehicle(id) {
    const v = masterVehicles.find(item => item.id === id) || masterVehicles[0];
    switchTab('tracking');
    document.getElementById('active-tracking-title').innerText = `${v.name} (${v.number})`;
    document.getElementById('active-tracking-subtitle').innerText = `Live Route: ${v.origin} to ${v.destination}`;
    
    if (leafletMap && v.coords) {
        leafletMap.setView(v.coords, 12);
        currentMarker.setLatLng(v.coords).bindPopup(`<b>${v.name}</b><br>Speed: 52 km/h`).openPopup();
    }
}

function populateTimeline() {
    const timeline = document.getElementById('station-timeline');
    const steps = [
        { station: "Departure Terminal", info: "Departed", active: false },
        { station: "Highway Checkpoint", info: "In Transit", active: true },
        { station: "Destination Terminal", info: "Scheduled Arrival", active: false }
    ];

    timeline.innerHTML = steps.map(s => `
        <div class="relative">
            <span class="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full ${s.active ? 'bg-blue-600 ring-4 ring-blue-100' : 'bg-slate-300'}"></span>
            <h5 class="font-bold text-slate-800 text-xs">${s.station}</h5>
            <p class="text-[11px] text-slate-500">${s.info}</p>
        </div>
    `).join('');
}

// Modal Helpers & Handlers
function openBookingModal(id) {
    const v = masterVehicles.find(item => item.id === id) || masterVehicles[0];
    document.getElementById('modal-bus-name').innerText = `${v.name} (${v.number})`;
    document.getElementById('modal-fare').innerText = `NPR ${v.price}`;

    const grid = document.getElementById('seat-grid');
    grid.innerHTML = '';
    
    for (let i = 1; i <= v.totalSeats; i++) {
        const isBooked = i <= v.bookedSeats;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `p-2 rounded font-bold text-xs border ${isBooked ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-700 hover:border-blue-500'}`;
        btn.innerText = `S${i}`;
        if (!isBooked) {
            btn.onclick = () => {
                document.querySelectorAll('#seat-grid button').forEach(b => {
                    if (!b.classList.contains('bg-slate-200')) b.className = 'p-2 rounded font-bold text-xs border bg-white text-slate-700 hover:border-blue-500';
                });
                btn.className = 'p-2 rounded font-bold text-xs border bg-blue-600 text-white border-blue-600';
                selectedSeat = `S${i}`;
            };
        }
        grid.appendChild(btn);
    }

    openModal('booking-modal');
}

function confirmBooking(e) {
    e.preventDefault();
    if (!selectedSeat) {
        alert('Please click on an available seat (e.g., S22) to select it before confirming.');
        return;
    }
    alert(`Success! Seat ${selectedSeat} has been booked. Confirmation ticket sent to your mobile.`);
    closeModal('booking-modal');
}

function handleVehicleListing(e) {
    e.preventDefault();
    alert('Vehicle successfully registered to RoutePulse! Your route is live for booking.');
    switchTab('search');
}

function openModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
    if (modalId === 'qr-modal') {
        const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
        scanner.render((text) => {
            alert(`QR Decoded Data: ${text}`);
            scanner.clear();
            closeModal('qr-modal');
        });
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.hidden = true;
    document.getElementById(modalId).classList.add('hidden');
}