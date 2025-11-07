document.addEventListener('DOMContentLoaded', () => {
  // Definir proyecciones para conversión UTM
  const utm17S = '+proj=utm +zone=17 +south +ellps=WGS84 +datum=WGS84 +units=m +no_defs';
  const utm18S = '+proj=utm +zone=18 +south +ellps=WGS84 +datum=WGS84 +units=m +no_defs';
  const wgs84 = '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs';

  // Función para cargar GeoJSON
  function loadGeoJSON(url, map, style = {}) {
    fetch(url)
      .then(response => response.json())
      .then(data => {
        L.geoJSON(data, {
          style: style,
          onEachFeature: (feature, layer) => {
            if (feature.properties) {
              let popupContent = Object.entries(feature.properties)
                .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
                .join('<br>');
              layer.bindPopup(popupContent);
            }
          }
        }).addTo(map);
      })
      .catch(error => console.error('Error loading GeoJSON:', error));
  }

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

  // Convertir Lat/Lon a UTM
  function latLonToUTM(lat, lon, zone) {
    try {
      const utmProj = `+proj=utm +zone=${zone} +south +ellps=WGS84 +datum=WGS84 +units=m +no_defs`;
      const coords = proj4(wgs84, utmProj, [lon, lat]);
      return { 
        easting: coords[0], 
        northing: coords[1] 
      };
    } catch (error) {
      console.error('Error en conversión Lat/Lon a UTM:', error);
      return null;
    }
  }

  // Convertir Decimal a DMS
  function decimalToDMS(decimal) {
    const degrees = Math.floor(Math.abs(decimal));
    const minutes = Math.floor((Math.abs(decimal) - degrees) * 60);
    const seconds = ((Math.abs(decimal) - degrees - minutes / 60) * 3600).toFixed(2);
    const direction = decimal >= 0 ? (decimal >= 0 ? 'N' : 'S') : (decimal < 0 ? 'S' : 'N');
    return { degrees, minutes, seconds, direction };
  }

  // Inicializar mapa
  function initMap() {
    const map = L.map('map').setView([-1.831, -78.183], 7);
    
    // Mapa base OSM
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
      attribution: '© OpenStreetMap contributors' 
    }).addTo(map);

    // Cargar GeoJSON
    loadGeoJSON('GRID_JSON.geojson', map, {
      color: '#3388ff',
      weight: 2,
      fillOpacity: 0.2
    });

    loadGeoJSON('provincias_simplificado.geojson', map, {
      color: '#ff0000',
      weight: 1,
      fillOpacity: 0.1
    });

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

  // Función para conversión y validación de coordenadas
  function getCoordinates() {
    let lat, lon;

    // Primero intentar con coordenadas DD
    lat = parseFloat(document.getElementById('tp-lat').value);
    lon = parseFloat(document.getElementById('tp-lon').value);

    // Si no hay coordenadas DD, intentar con UTM
    if (isNaN(lat) || isNaN(lon)) {
      // Primero probar UTM 17S
      const utmEasting17 = document.getElementById('tp-utm-e-17').value;
      const utmNorthing17 = document.getElementById('tp-utm-n-17').value;
      
      if (utmEasting17 && utmNorthing17) {
        const utmCoords17 = utmToLatLon(utmEasting17, utmNorthing17, 17);
        if (utmCoords17) {
          lat = utmCoords17.lat;
          lon = utmCoords17.lon;
        }
      }

      // Si UTM 17S no funciona, probar UTM 18S
      if (isNaN(lat) || isNaN(lon)) {
        const utmEasting18 = document.getElementById('tp-utm-e-18').value;
        const utmNorthing18 = document.getElementById('tp-utm-n-18').value;
        
        if (utmEasting18 && utmNorthing18) {
          const utmCoords18 = utmToLatLon(utmEasting18, utmNorthing18, 18);
          if (utmCoords18) {
            lat = utmCoords18.lat;
            lon = utmCoords18.lon;
          }
        }
      }
    }

    // Si tenemos coordenadas válidas, actualizar todos los campos
    if (!isNaN(lat) && !isNaN(lon)) {
      // Actualizar coordenadas DD
      document.getElementById('tp-lat').value = lat.toFixed(6);
      document.getElementById('tp-lon').value = lon.toFixed(6);

      // Actualizar DMS
      const latDMS = decimalToDMS(lat);
      const lonDMS = decimalToDMS(lon);
      document.getElementById('tp-lat-d').value = latDMS.degrees;
      document.getElementById('tp-lat-m').value = latDMS.minutes;
      document.getElementById('tp-lat-s').value = latDMS.seconds;
      document.getElementById('tp-lon-d').value = lonDMS.degrees;
      document.getElementById('tp-lon-m').value = lonDMS.minutes;
      document.getElementById('tp-lon-s').value = lonDMS.seconds;

      // Actualizar UTM 17S
      const utmCoords17 = latLonToUTM(lat, lon, 17);
      if (utmCoords17) {
        document.getElementById('tp-utm-e-17').value = utmCoords17.easting.toFixed(2);
        document.getElementById('tp-utm-n-17').value = utmCoords17.northing.toFixed(2);
      }

      // Actualizar UTM 18S
      const utmCoords18 = latLonToUTM(lat, lon, 18);
      if (utmCoords18) {
        document.getElementById('tp-utm-e-18').value = utmCoords18.easting.toFixed(2);
        document.getElementById('tp-utm-n-18').value = utmCoords18.northing.toFixed(2);
      }

      return { lat, lon };
    }

    return null;
  }

  // Botón Ir: Centrar mapa en las coordenadas
  const btnCenter = document.getElementById('tp-btn-center');
  if (btnCenter) {
    btnCenter.addEventListener('click', function() {
      const coords = getCoordinates();
      
      if (coords) {
        if (window.map) {
          window.map.setView([coords.lat, coords.lon], 12);
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
      const coords = getCoordinates();
      
      if (coords && window.map) {
        L.marker([coords.lat, coords.lon]).addTo(window.map);
      } else {
        alert('Por favor, ingrese coordenadas válidas');
      }
    });
  }

  // Botón Copiar
  const btnCopy = document.getElementById('tp-btn-copy');
  if (btnCopy) {
    btnCopy.addEventListener('click', function() {
      const coords = getCoordinates();
      
      if (coords) {
        // Coordenadas en Grados Decimales
        const ddCoords = `Grados Decimales: ${coords.lat.toFixed(6)}, ${coords.lon.toFixed(6)}`;
        
        // Coordenadas en DMS
        const latDMS = decimalToDMS(coords.lat);
        const lonDMS = decimalToDMS(coords.lon);
        const dmsCoords = `DMS: ${latDMS.degrees}° ${latDMS.minutes}' ${latDMS.seconds}" ${latDMS.direction}, ${lonDMS.degrees}° ${lonDMS.minutes}' ${lonDMS.seconds}" ${lonDMS.direction}`;
        
        // Coordenadas UTM 17S
        const utm17Easting = document.getElementById('tp-utm-e-17').value;
        const utm17Northing = document.getElementById('tp-utm-n-17').value;
        const utm17Coords = `UTM 17S: ${utm17Easting}, ${utm17Northing}`;
        
        // Coordenadas UTM 18S
        const utm18Easting = document.getElementById('tp-utm-e-18').value;
        const utm18Northing = document.getElementById('tp-utm-n-18').value;
        const utm18Coords = `UTM 18S: ${utm18Easting}, ${utm18Northing}`;
        
        // Texto completo para copiar
        const fullCoordsText = `${ddCoords}\n${dmsCoords}\n${utm17Coords}\n${utm18Coords}`;
        
        navigator.clipboard.writeText(fullCoordsText).then(() => {
          alert('Coordenadas copiadas:\n' + fullCoordsText);
        });
      } else {
        alert('Por favor, ingrese coordenadas válidas');
      }
    });
  }

  // Iniciar aplicación
  initMap();
});
