(function () {
  let currentPin = null; // Guarda referencia al pin actual

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
    const btn=document.getElementById('tp-btn-pin');
    if(!btn) return;

    // Cruz roja más grande y visible con círculo de fondo
    const crossIcon=L.divIcon({
      className:'cross-pin',
      html:`<div class="cross-pin-container">
              <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'
                   width='32' height='32' stroke='#ff3b3b' stroke-width='2.5'
                   fill='none' stroke-linecap='round' stroke-linejoin='round'>
                <circle cx='12' cy='12' r='10' fill='white' opacity='0.9' stroke='#ff3b3b' stroke-width='2'/>
                <path d='M6 12h12M12 6v12' stroke-width='3'/>
              </svg>
            </div>`,
      iconSize:[32,32],
      iconAnchor:[16,16]
    });

    btn.addEventListener('click', function(e){
      const map=getMap();
      if(!map||typeof L==='undefined') return;
      e.preventDefault();
      e.stopImmediatePropagation();

      const lat=parseFloat(readValById('tp-lat'));
      const lon=parseFloat(readValById('tp-lon'));

      if(!Number.isFinite(lat)||!Number.isFinite(lon)) {
        alert('Por favor, ingresa coordenadas válidas antes de fijar el punto.');
        return;
      }

      // Remover pin anterior si existe
      if(currentPin) {
        map.removeLayer(currentPin);
      }

      // Crear nuevo pin y guardarlo
      currentPin = L.marker([lat, lon], {icon: crossIcon}).addTo(map);

      // Agregar popup con las coordenadas
      currentPin.bindPopup(`
        <strong>📍 Punto fijado</strong><br/>
        Lat: ${lat.toFixed(6)}<br/>
        Lon: ${lon.toFixed(6)}
      `).openPopup();

      // Centrar mapa en el punto
      map.setView([lat, lon], map.getZoom());

    }, true);
  });
})();