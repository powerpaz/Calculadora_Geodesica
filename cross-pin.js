(function () {
  // Variable global para mantener el pin actual
  if (!window.currentFixedPin) window.currentFixedPin = null;

  function whenReady(cb){
    if (document.readyState==='complete'||document.readyState==='interactive') cb();
    else document.addEventListener('DOMContentLoaded', cb);
  }

  function getMap(){ return window.map || null; }

  function readValById(id){
    const el=document.getElementById(id);
    return el ? (el.value||'').trim() : '';
  }

  whenReady(function(){
    // Esperar a que el mapa esté listo
    const checkMap = setInterval(function(){
      const map = getMap();
      if (!map || typeof L === 'undefined') return;

      clearInterval(checkMap);
      const btn = document.getElementById('tp-btn-pin');
      if (!btn) return;

      // Cruz roja más grande y visible con círculo de fondo
      const crossIcon = L.divIcon({
        className: 'cross-pin',
        html: `
          <div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
              <circle cx="16" cy="16" r="14" fill="white" stroke="#ff3b3b" stroke-width="2.5" opacity="0.95"/>
              <line x1="16" y1="6" x2="16" y2="26" stroke="#ff3b3b" stroke-width="3" stroke-linecap="round"/>
              <line x1="6" y1="16" x2="26" y2="16" stroke="#ff3b3b" stroke-width="3" stroke-linecap="round"/>
            </svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      btn.addEventListener('click', function(e){
        e.preventDefault();
        e.stopPropagation();

        const lat = parseFloat(readValById('tp-lat'));
        const lon = parseFloat(readValById('tp-lon'));

        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
          alert('Por favor, ingresa coordenadas válidas antes de fijar el punto.');
          return;
        }

        // Remover pin anterior si existe
        if (window.currentFixedPin) {
          map.removeLayer(window.currentFixedPin);
        }

        // Crear nuevo pin y guardarlo
        window.currentFixedPin = L.marker([lat, lon], {icon: crossIcon}).addTo(map);

        // Agregar popup con las coordenadas
        window.currentFixedPin.bindPopup(`
          <div style="font-family:system-ui;padding:4px;">
            <strong style="color:#ff3b3b;">📍 Punto fijado</strong><br/>
            <small>Lat: ${lat.toFixed(6)}<br/>
            Lon: ${lon.toFixed(6)}</small>
          </div>
        `).openPopup();

        // Centrar mapa en el punto
        map.setView([lat, lon], Math.max(map.getZoom(), 13));

        // Actualizar estado
        const statusEl = document.getElementById('status');
        if (statusEl) statusEl.textContent = 'Punto fijado';
      });
    }, 100);
  });
})();
