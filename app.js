// Geoportal App - MINEDEC
document.addEventListener('DOMContentLoaded', () => {
  // Inicialización de la configuración
  const config = { 
    SUPABASE_URL: window.env?.SUPABASE_URL, 
    SUPABASE_KEY: window.env?.SUPABASE_KEY 
  };

  // Limpiar calculadora
  const btnClearCalculator = document.getElementById('tp-btn-clear-calculator');
  if (btnClearCalculator) {
    btnClearCalculator.addEventListener('click', function() {
      // Limpiar campos de Lat, Lon (DD)
      document.getElementById('tp-lat').value = '';
      document.getElementById('tp-lon').value = '';

      // Limpiar campos de DMS
      document.getElementById('tp-lat-d').value = '';
      document.getElementById('tp-lat-m').value = '';
      document.getElementById('tp-lat-s').value = '';
      document.getElementById('tp-lon-d').value = '';
      document.getElementById('tp-lon-m').value = '';
      document.getElementById('tp-lon-s').value = '';

      // Limpiar campos UTM
      document.getElementById('tp-utm-e-17').value = '';
      document.getElementById('tp-utm-n-17').value = '';
      document.getElementById('tp-utm-e-18').value = '';
      document.getElementById('tp-utm-n-18').value = '';

      // Si hay un mapa definido, podrías limpiar marcadores aquí
      if (window.map) {
        window.map.eachLayer((layer) => {
          if (layer instanceof L.Marker) {
            window.map.removeLayer(layer);
          }
        });
      }
    });
  }

  // Función para cargar GeoJSON
  function loadGeoJSON(url, map, style = {}) {
    fetch(url)
      .then(response => response.json())
      .then(data => {
        L.geoJSON(data, {
          style: style,
          onEachFeature: (feature, layer) => {
            if (feature.properties) {
              layer.bindPopup(() => {
                return Object.entries(feature.properties)
                  .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
                  .join('<br>');
              });
            }
          }
        }).addTo(map);
      })
      .catch(error => console.error('Error loading GeoJSON:', error));
  }

  // Inicializar mapa
  function initMap() {
    const map = L.map('map').setView([-1.831, -78.183], 7);
    
    const basemaps = {
      osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
        attribution: '© OpenStreetMap contributors' 
      }),
      esriSat: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri'
      }),
      esriStreet: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri'
      }),
      carto: L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors, © CARTO'
      })
    };

    basemaps.osm.addTo(map);

    // Control de capas base
    L.control.layers(basemaps).addTo(map);

    // Cargar GeoJSON
    loadGeoJSON('GRID_JSON.geojson', map, {
      color: '#3388ff',
      weight: 2,
      opacity: 0.7
    });

    loadGeoJSON('DA_DPA_CODPOST_JSON.geojson', map, {
      color: '#ff0000',
      weight: 1,
      opacity: 0.5,
      fillOpacity: 0.2
    });

    // Añadir medidor de distancia
    initMeasure(map);

    window.map = map;
    return map;
  }

  // Iniciar aplicación
  initMap();
});
