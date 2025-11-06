// Geoportal App - MINEDEC Calculadora Geodésica
document.addEventListener('DOMContentLoaded', () => {
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

    // Añadir medidor de distancia
    initMeasure(map);

    window.map = map;
    return map;
  }

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

      // Si hay un mapa definido, limpiar marcadores
      if (window.map) {
        window.map.eachLayer((layer) => {
          if (layer instanceof L.Marker) {
            window.map.removeLayer(layer);
          }
        });
      }
    });
  }

  // Botón Ir: Centrar mapa en las coordenadas
  const btnCenter = document.getElementById('tp-btn-center');
  if (btnCenter) {
    btnCenter.addEventListener('click', function() {
      const lat = parseFloat(document.getElementById('tp-lat').value);
      const lon = parseFloat(document.getElementById('tp-lon').value);
      
      if (!isNaN(lat) && !isNaN(lon)) {
        if (window.map) {
          window.map.setView([lat, lon], 12);
        }
      }
    });
  }

  // Botón Fijar punto
  const btnPin = document.getElementById('tp-btn-pin');
  if (btnPin) {
    btnPin.addEventListener('click', function() {
      const lat = parseFloat(document.getElementById('tp-lat').value);
      const lon = parseFloat(document.getElementById('tp-lon').value);
      
      if (!isNaN(lat) && !isNaN(lon) && window.map) {
        L.marker([lat, lon]).addTo(window.map);
      }
    });
  }

  // Botón Copiar
  const btnCopy = document.getElementById('tp-btn-copy');
  if (btnCopy) {
    btnCopy.addEventListener('click', function() {
      const lat = document.getElementById('tp-lat').value;
      const lon = document.getElementById('tp-lon').value;
      
      if (lat && lon) {
        const coordText = `${lat}, ${lon}`;
        navigator.clipboard.writeText(coordText).then(() => {
          alert('Coordenadas copiadas: ' + coordText);
        });
      }
    });
  }

  // Iniciar aplicación
  initMap();
});
