// --- CONFIGURACIÓN INICIAL ---
const CONFIG = {
    centroInicial: [19.4326, -99.1332],
    zoomInicial: 9,
    zoomEtiquetasMun: 10,
    zoomParaColonias: 13,
    passCorrecto: "2026_SS12"
};

// --- LOGIN ---
function verificarPassword() {
    const pass = document.getElementById('password-input').value;
    if (pass === CONFIG.passCorrecto) {
        document.getElementById('login-overlay').style.display = 'none';
    } else {
        document.getElementById('error-msg').style.display = 'block';
    }
}
document.getElementById('password-input').addEventListener('keypress', (e) => { if (e.key === 'Enter') verificarPassword(); });

// --- MAPA ---
const map = L.map('map').setView(CONFIG.centroInicial, CONFIG.zoomInicial);

const baseMaps = {
    "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OSM' }).addTo(map),
    "Google Híbrido": L.tileLayer('http://mt0.google.com/vt/lyrs=y&hl=es&x={x}&y={y}&z={z}', { attribution: '© Google' }),
    "Google Tráfico": L.tileLayer('https://mt1.google.com/vt/lyrs=m@221097413,traffic&x={x}&y={y}&z={z}', { attribution: '© Google' })
};
L.control.layers(baseMaps).addTo(map);

// --- CAPAS GEOGRÁFICAS ---
let capaMunicipios, capaColonias;

// Cargar Municipios
fetch('municipios.geojson')
    .then(res => res.json())
    .then(data => {
        capaMunicipios = L.geoJSON(data, {
            style: { color: '#333', weight: 1.5, fillColor: '#333', fillOpacity: 0.05 },
            onEachFeature: function (feature, layer) {
                if (feature.properties && feature.properties.nom_mun) {
                    layer.bindTooltip(feature.properties.nom_mun, { 
                        permanent: true, direction: "center", className: "etiqueta-municipio" 
                    });
                }
                layer.on('click', function() {
                    map.fitBounds(layer.getBounds());
                    document.getElementById('btn-reset-vista').style.display = 'block';
                });
            }
        }).addTo(map);
    });

// Cargar Colonias
fetch('colonias.geojson')
    .then(res => res.json())
    .then(data => {
        capaColonias = L.geoJSON(data, {
            style: { color: '#666', weight: 1, dashArray: '3, 4', fillColor: '#000', fillOpacity: 0 },
            onEachFeature: function (feature, layer) {
                let nombre = feature.properties.nom_col || 'S/N';
                layer.bindPopup(`<b>Colonia:</b> ${nombre}`);
            }
        });
    });

// --- GESTIÓN DE VISIBILIDAD DINÁMICA ---
function controlarZoom() {
    let zoom = map.getZoom();
    let container = document.getElementById('map');

    // Etiquetas de municipios
    if (zoom >= CONFIG.zoomEtiquetasMun) container.classList.remove('ocultar-etiquetas');
    else container.classList.add('ocultar-etiquetas');

    // Capa de colonias
    if (capaColonias) {
        if (zoom >= CONFIG.zoomParaColonias) {
            if (!map.hasLayer(capaColonias)) map.addLayer(capaColonias);
        } else {
            if (map.hasLayer(capaColonias)) map.removeLayer(capaColonias);
        }
    }
}

map.on('zoomend', controlarZoom);

// --- UTILIDADES ---
window.resetearVista = function() {
    map.setView(CONFIG.centroInicial, CONFIG.zoomInicial);
    document.getElementById('btn-reset-vista').style.display = 'none';
};

// Clic derecho para coordenadas
map.on('contextmenu', (e) => {
    L.popup()
        .setLatLng(e.latlng)
        .setContent(`<div style="font-size:12px"><b>Coord:</b><br>${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}</div>`)
        .openOn(map);
});