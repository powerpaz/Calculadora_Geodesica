// Geoportal App - MINEDEC Calculadora Geodésica
document.addEventListener('DOMContentLoaded', () => {
  // Definir proyecciones para conversión UTM
  const utm17S = '+proj=utm +zone=17 +south +ellps=WGS84 +datum=WGS84 +units=m +no_defs';
  const wgs84 = '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs';

  // Convertir coordenadas UTM a Lat/Lon
  function utmToLatLon(easting, northing, zone = 17, hemisphere = 'S') {
    const utmProj = `+proj=utm +zone=${zone} ${hemisphere === 'S' ? '+south' : ''} +ellps=WGS84 +datum=WGS84 +units=m +no_defs`;
    try {
      const coords = proj4(utmProj, wgs84, [parseFloat(easting), parseFloat(northing)]);
      return { 
        lon: coords[0], 
        lat: coords[1] 
      };
    } catch (error) {
      console.error('Error en conversión UTM:', error);
      return null;
    }
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
      let lat, lon;

      // Primero intentar con coordenadas DD
      lat = parseFloat(document.getElementById('tp-lat').value);
      lon = parseFloat(document.getElementById('tp-lon').value);

      // Si no hay coordenadas DD, intentar con UTM
      if (isNaN(lat) || isNaN(lon)) {
        const utmEasting = document.getElementById('tp-utm-e-17').value;
        const utmNorthing = document.getElementById('tp-utm-n-17').value;
        
        if (utmEasting && utmNorthing) {
          const utmCoords = utmToLatLon(utmEasting, utmNorthing);
          if (utmCoords) {
            lat = utmCoords.lat;
            lon = utmCoords.lon;
            
            // Actualizar campos de coordenadas DD
            document.getElementById('tp-lat').value = lat.toFixed(6);
            document.getElementById('tp-lon').value = lon.toFixed(6);
          }
        }
      }
      
      if (!isNaN(lat) && !isNaN(lon)) {
        if (window.map) {
          window.map.setView([lat, lon], 12);
          
          // Añadir un marcador
          L.marker([lat, lon]).addTo(window.map);
        }
      } else {
        alert('Por favor, ingrese coordenadas válidas');
      }
    });
  }

  // Botón Fijar punto
  const btnPin = document.getElementById('tp-btn-pin');
  if (btnPin) {
    btnPin.addEventListener('click', function() {
      let lat, lon;

      // Primero intentar con coordenadas DD
      lat = parseFloat(document.getElementById('tp-lat').value);
      lon = parseFloat(document.getElementById('tp-lon').value);

      // Si no hay coordenadas DD, intentar con UTM
      if (isNaN(lat) || isNaN(lon)) {
        const utmEasting = document.getElementById('tp-utm-e-17').value;
        const utmNorthing = document.getElementById('tp-utm-n-17').value;
        
        if (utmEasting && utmNorthing) {
          const utmCoords = utmToLatLon(utmEasting, utmNorthing);
          if (utmCoords) {
            lat = utmCoords.lat;
            lon = utmCoords.lon;
            
            // Actualizar campos de coordenadas DD
            document.getElementById('tp-lat').value = lat.toFixed(6);
            document.getElementById('tp-lon').value = lon.toFixed(6);
          }
        }
      }
      
      if (!isNaN(lat) && !isNaN(lon) && window.map) {
        L.marker([lat, lon]).addTo(window.map);
      } else {
        alert('Por favor, ingrese coordenadas válidas');
      }
    });
  }

  // Botón Copiar
  const btnCopy = document.getElementById('tp-btn-copy');
  if (btnCopy) {
    btnCopy.addEventListener('click', function() {
      let lat, lon;

      // Primero intentar con coordenadas DD
      lat = parseFloat(document.getElementById('tp-lat').value);
      lon = parseFloat(document.getElementById('tp-lon').value);

      // Si no hay coordenadas DD, intentar con UTM
      if (isNaN(lat) || isNaN(lon)) {
        const utmEasting = document.getElementById('tp-utm-e-17').value;
        const utmNorthing = document.getElementById('tp-utm-n-17').value;
        
        if (utmEasting && utmNorthing) {
          const utmCoords = utmToLatLon(utmEasting, utmNorthing);
          if (utmCoords) {
            lat = utmCoords.lat;
            lon = utmCoords.lon;
            
            // Actualizar campos de coordenadas DD
            document.getElementById('tp-lat').value = lat.toFixed(6);
            document.getElementById('tp-lon').value = lon.toFixed(6);
          }
        }
      }
      
      if (lat && lon) {
        const coordText = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
        navigator.clipboard.writeText(coordText).then(() => {
          alert('Coordenadas copiadas: ' + coordText);
        });
      } else {
        alert('Por favor, ingrese coordenadas válidas');
      }
    });
  }

  // Iniciar aplicación
  initMap();
});
