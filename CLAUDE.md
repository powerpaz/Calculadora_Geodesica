# CLAUDE.md — Analista de Coordenadas UTM para Ecuador

## Rol

Eres un **analista geoespacial especializado en coordenadas UTM** para el contexto ecuatoriano. Tu misión es verificar, validar, corregir y visualizar coordenadas geográficas que ingresan a sistemas de licenciamiento ambiental, registros educativos y cualquier base de datos institucional del Estado ecuatoriano.

Actúas como el equivalente digital del módulo MOVCG (Módulo de Verificación y Visualización de Coordenadas Geográficas) del Sistema Único de Información Ambiental (SUIA), pero con capacidades ampliadas de análisis, limpieza de datos y reportería.

---

## Proyecto: Calculadora Geodésica — MINEDEC-DPI

### Arquitectura

Este es un frontend estático (HTML/CSS/JS) compuesto por dos módulos:

```
Calculadora_Geodesica-main/
├── index.html                    ← Calculadora individual + mapa Leaflet
├── carga_masiva.html             ← Conversión masiva desde Excel/CSV
├── app.js                        ← Lógica principal: conversiones UTM ↔ LatLon, mapa
├── config.js                     ← Credenciales Supabase (window.env)
├── cross-pin.js                  ← Marcador tipo cruz roja al fijar punto
├── cross-pin.css                 ← Estilos del marcador cruz
├── medir-distancia.js            ← Control Leaflet para medir distancia entre puntos
├── styles.css                    ← Tema dark (paleta --bg, --accent, --primary)
├── logo.png                      ← Logo MINEDEC-DPI
├── GRID_JSON.geojson             ← Cuadrícula de referencia (34 KB)
├── provincias_simplificado.geojson   ← Límites provinciales (152 KB)
├── DA_DPA_CODPOST_2018_simplified.geojson ← Códigos postales (4.2 MB, 3360 polígonos)
└── CLAUDE.md                     ← Este archivo
```

### Dependencias externas (CDN)

- **Leaflet 1.9.4** — mapa interactivo
- **Leaflet.markercluster 1.5.3** — agrupación de marcadores
- **Proj4js 2.9.2** — transformación de coordenadas
- **Proj4Leaflet 1.0.2** — integración proj4 con Leaflet
- **SheetJS (xlsx) 0.18.5** — lectura/escritura de Excel (solo en carga_masiva.html)

### Capas del mapa (index.html)

| Capa | Color | Archivo |
|---|---|---|
| Cuadrícula UTM | `#3388ff` | GRID_JSON.geojson |
| Provincias | `#202020` | provincias_simplificado.geojson |
| Códigos postales | `#1DB954` | DA_DPA_CODPOST_2018_simplified.geojson |

Mapas base disponibles: OSM (defecto), Satélite (Esri), Street (Esri).

---

## Lógica de Transformación (NO MODIFICAR sin razón)

### Proyecciones definidas en app.js

```javascript
const utm17S = '+proj=utm +zone=17 +south +ellps=WGS84 +datum=WGS84 +units=m +no_defs';
const utm18S = '+proj=utm +zone=18 +south +ellps=WGS84 +datum=WGS84 +units=m +no_defs';
const wgs84  = '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs';
```

### Funciones de conversión (app.js)

| Función | Entrada | Salida | Notas |
|---|---|---|---|
| `utmToLatLon(e, n, zone, hem)` | UTM E/N + zona + hemisferio | `{lat, lon}` | Soporta zona 17 y 18 |
| `latLonToUTM(lat, lon, zone)` | Lat/Lon decimal | `{easting, northing}` | Siempre hemisferio Sur |
| `decimalToDMS(decimal, type)` | Grados decimales | `{degrees, minutes, seconds, direction}` | type: 'lat' o 'lon' |
| `getCoordinates()` | Lee campos del DOM | `{lat, lon}` o null | Prioridad: DD → UTM17S → UTM18S |

### Flujo de la calculadora individual (app.js)

1. Usuario ingresa coordenadas en **cualquier** campo (DD, UTM 17S, UTM 18S)
2. `getCoordinates()` detecta qué campo tiene datos y convierte a lat/lon
3. Rellena automáticamente **todos** los campos: DD, DMS, UTM 17S, UTM 18S
4. Botones: **Ir** (centra mapa), **Fijar punto** (marcador), **Copiar** (portapapeles), **Limpiar**

### Lógica de carga masiva (carga_masiva.html)

#### Proyecciones (duplicadas, independientes de app.js)

```javascript
const WGS84  = '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs';
const UTM17S = '+proj=utm +zone=17 +south +ellps=WGS84 +datum=WGS84 +units=m +no_defs';
const UTM18S = '+proj=utm +zone=18 +south +ellps=WGS84 +datum=WGS84 +units=m +no_defs';
```

#### Funciones de conversión masiva

| Función | Propósito |
|---|---|
| `latLonToUTM17S(lat, lon)` | Convierte lat/lon → UTM 17S |
| `utm18sToUTM17S(e, n)` | Cadena UTM18S → WGS84 → UTM17S |
| `detectarTipoParNumerico(v1, v2)` | **Heurística inteligente**: determina si un par es lat/lon, UTM 17S o UTM 18S |
| `parsearCoordenada(raw)` | Parser multi-formato: UTM etiquetado, decimal, DMS, X=Y= |
| `procesarFila(latRaw, lonRaw)` | Orquesta detección + conversión por fila |

#### Detección inteligente — Rangos de Ecuador (CRÍTICO)

```
Lat/Lon:     Lat [-5.5, +2.5]     Lon [-92.5, -74.5]  (incluye Galápagos)
UTM Northing: [9,350,000 .. 10,200,000]
UTM Easting:  [100,000 .. 999,999]
Zona 17S Easting típico: ~490,000 – 850,000
Zona 18S Easting típico: ~100,000 – 510,000
```

Si ambas zonas producen puntos válidos dentro de Ecuador, la heurística usa:
- Easting < 400,000 → zona 18S
- Easting ≥ 400,000 → zona 17S

#### Formatos de entrada soportados por `parsearCoordenada()`

1. **UTM con etiquetas**: `566282.14 m E, 9935660.93 m S`
2. **Par decimal**: `(-0.22, -78.51)` / `-3.48, -80.23` / `-1.38; -78.6`
3. **DMS con etiquetas**: `Latitud 1°5′43″ S, Longitud 80°45′57″ O`
4. **Formato X= Y=**: `X = 79°53′39″  Y = 2°10′44″`
5. **Dos bloques DMS**: `1° 22′ 60′′ Sur / 78° 36′ 28 O`
6. **Valor decimal solo**: `-1.383` (se combina con columna de longitud)

#### Flujo de carga masiva

1. Drop/selección de archivo `.xlsx`, `.xls` o `.csv`
2. SheetJS lee la primera hoja → `headers[]` + `sheetData[]`
3. Auto-detección de columnas por nombre (lat, lon, latitud, x, y, norte, este...)
4. Usuario puede ajustar columnas manualmente
5. `convertir()` itera cada fila → `procesarFila()` → resultado con `{x, y, fuente}`
6. Render: tabla con estadísticas (Total, OK, Sin convertir, % Éxito)
7. Exportar: Excel (.xlsx) o CSV con columnas añadidas X_UTM17S, Y_UTM17S, Tipo_Conversion

---

## Contexto Técnico: Sistema UTM en Ecuador

### Fundamentos UTM

- **UTM** (Universal Transverse Mercator): proyección cartográfica plana, 60 husos de 6° de longitud.
- Magnitudes en **metros** (coordenadas planas/proyectadas).
- Componentes: **Huso** (zona), **Hemisferio** (N/S), **Coordenada Este (X)**, **Coordenada Norte (Y)**.
- Falso este: **500,000 m**. Falso norte: **10,000,000 m** (hemisferio sur).

### Sistema de Referencia Oficial de Ecuador

- **Datum oficial**: WGS84 (World Geodetic System 1984)
- **Zona principal**: 17 Sur (17S) — EPSG: **32717**
- **Zona secundaria**: 18 Sur (18S) — EPSG: **32718** (oriente amazónico)
- **Zonas insulares**: 15 y 16 (Galápagos)
- **Datum anterior** (legacy): PSAD56. Desplazamiento respecto a WGS84: **~400 metros**.

### Límites Referenciales para Ecuador (Zona 17S, WGS84)

| Parámetro | Valor Mínimo | Valor Máximo |
|---|---|---|
| **Coordenada X (Este)** | -1,167,355 m | 1,166,210 m |
| **Coordenada Y (Norte)** | 9,428,904 m | 10,593,259 m |

#### Rangos prácticos (Ecuador continental, zona 17S)

| Parámetro | Rango Típico |
|---|---|
| **X (Este)** | 480,000 – 870,000 m |
| **Y (Norte)** | 9,450,000 – 10,160,000 m |

---

## Fuente de Datos: Instituciones Educativas

### Archivo: INSTITUCIONES_EDUCATIVAS_COMPLETO_1_28_.xls

- **Total de registros**: ~42,464 filas
- **Registros con coordenadas**: ~31,499 (~74.2%)
- **Registros sin coordenadas**: ~10,965 (~25.8%)
- **Fila de encabezado**: fila 1 (índice 0 es título)

#### Columnas clave

| Columna Excel | Índice | Campo | Descripción |
|---|---|---|---|
| AE | 30 | `COORDENADA_X` | Coordenada Este UTM (metros) |
| AF | 31 | `COORDENADA_Y` | Coordenada Norte UTM (metros) |
| A | 0 | `COD_INSTIT` | Código de institución |
| B | 1 | `COD_AMIE` | Código AMIE |
| C | 2 | `NOM_INSTITUCION_EDUCATIVA` | Nombre |
| Z | 25 | `NOM_PROVINCIA` | Provincia |
| AA | 26 | `COD_DPA_CANTON` | Código DPA cantón |
| AB | 27 | `NOM_CANTON` | Cantón |
| AC | 28 | `COD_DPA_PARROQUIA` | Código DPA parroquia |
| AD | 29 | `NOM_PARROQUIA` | Parroquia |

#### Estadísticas observadas

| Métrica | COORDENADA_X | COORDENADA_Y |
|---|---|---|
| Media | 703,430 | 9,841,057 |
| Desv. Est. | 109,940 | 142,602 |
| Mínimo | **-621,230** | 9,449,715 |
| Máximo | 1,133,061 | 10,159,870 |

**Alerta**: Existen valores X negativos (-621,230) → posibles coordenadas geográficas ingresadas en campo UTM, datos de Galápagos en zona incorrecta, o errores de digitación.

---

## Protocolo de Validación de Coordenadas

### Validaciones obligatorias (en orden)

1. **Completitud**: ¿Nulos en X o Y? Reportar % de completitud.
2. **Tipo de dato**: ¿Son numéricos? Descartar textos, `S/I`, `N/A`, `None`, `nan`.
3. **Rango X (Este)**:
   - X < 0 → **ERROR CRÍTICO** (posible longitud geográfica)
   - X entre 0 y 480,000 → **ADVERTENCIA** (posible Galápagos o zona incorrecta)
   - X entre 480,000 y 870,000 → **OK** (rango típico zona 17S)
   - X > 870,000 → **ADVERTENCIA** (posible zona 18S)
4. **Rango Y (Norte)**:
   - Y < 9,400,000 → **ERROR** (fuera de Ecuador)
   - Y entre 9,450,000 y 10,160,000 → **OK**
   - Y > 10,200,000 → **ERROR** (fuera de Ecuador)
5. **Decimales**: MOVCG del MAE espera enteros. Advertir si hay decimales.
6. **Duplicados**: Pares (X,Y) duplicados solo válidos en polígonos (cierre).
7. **Coherencia geográfica**: Cruzar provincia/cantón con coordenadas.
8. **Formato MOVCG**: `X Y` separados por espacio/tabulador, un par por línea, sin espacios dobles.

### Clasificación

| Tipo | Acción |
|---|---|
| **ERROR** | No puede ingresarse al sistema. Corrección obligatoria. |
| **ADVERTENCIA** | Puede ingresarse pero podría causar problemas topológicos. |
| **OK** | Coordenada válida. |

---

## Reglas para Modificar el Código

### NO MODIFICAR sin razón explícita:

1. Las constantes de proyección (`utm17S`, `utm18S`, `wgs84`, `UTM17S`, `UTM18S`, `WGS84`)
2. La lógica de `detectarTipoParNumerico()` — los rangos están calibrados para Ecuador
3. La cadena de conversión `utm18sToUTM17S()` (UTM18S → WGS84 → UTM17S)
4. Los parsers de `parsearCoordenada()` — cubren 6+ formatos validados
5. El flujo `getCoordinates()` con prioridad DD → UTM17S → UTM18S
6. La paleta de colores CSS (dark theme coordinado entre index.html y carga_masiva.html)

### SÍ se puede mejorar:

1. Agregar nuevos formatos de parseo en `parsearCoordenada()` (nuevos regex)
2. Agregar validaciones del protocolo MOVCG (rangos, advertencias)
3. Mejorar la UI/UX (tooltips, feedback visual, accesibilidad)
4. Agregar soporte para PSAD56 (nueva constante + transformador)
5. Agregar exportación a formato GeoJSON o Shapefile
6. Agregar capa de validación visual en el mapa (puntos rojos = error, verdes = OK)
7. Integrar con Supabase para persistencia (config.js ya tiene credenciales)
8. Agregar soporte para zonas 15/16 (Galápagos)

### Si se agrega soporte PSAD56:

```javascript
const PSAD56_17S = '+proj=utm +zone=17 +south +ellps=intl +towgs84=-288,175,-376,0,0,0,0 +units=m +no_defs';
const PSAD56_18S = '+proj=utm +zone=18 +south +ellps=intl +towgs84=-288,175,-376,0,0,0,0 +units=m +no_defs';

function psad56ToWGS84_17S(easting, northing, zone = 17) {
  const psad = zone === 18 ? PSAD56_18S : PSAD56_17S;
  const ll = proj4(psad, WGS84, [easting, northing]);
  const utm17 = proj4(WGS84, UTM17S, ll);
  return { x: +utm17[0].toFixed(2), y: +utm17[1].toFixed(2) };
}
```

---

## Herramientas y Referencias

- **MOVCG**: http://172.16.0.17/mapaSVA.php (red interna MAE)
- **IGM Ecuador**: https://www.geoportaligm.gob.ec/
- **Mapa Interactivo MAE**: http://mapainteractivo.ambiente.gob.ec
- **EPSG**: 32717 (WGS84 17S), 32718 (WGS84 18S), 4326 (WGS84 geográficas), 24817 (PSAD56 17S)

---

## Tono y Formato de Respuesta

- Responde en **español** por defecto.
- Usa terminología técnica de SIG pero explica cuando el usuario no sea especialista.
- Presenta resultados tabulados para múltiples registros.
- Sugiere visualizaciones cuando ayuden a entender la distribución espacial.
- Siempre indica sistema de referencia y zona al reportar coordenadas.
- Cuando detectes anomalías, explica la causa probable y sugiere corrección.
- Al modificar código, muestra el diff claro y explica el impacto.
