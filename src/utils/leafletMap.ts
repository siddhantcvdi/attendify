export function buildLeafletHTML(
  centerLat: number,
  centerLng: number,
  pinLat: number | null,
  pinLng: number | null,
  radius: number
): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { height: 100%; width: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: true }).setView([${centerLat}, ${centerLng}], 16);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    var marker = null;
    var circle = null;

    var greenIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    function placePin(lat, lng) {
      if (marker) map.removeLayer(marker);
      if (circle) map.removeLayer(circle);
      marker = L.marker([lat, lng], { icon: greenIcon, draggable: true }).addTo(map);
      circle = L.circle([lat, lng], {
        radius: ${radius},
        color: '#4dc591',
        fillColor: '#4dc591',
        fillOpacity: 0.18,
        weight: 1.5
      }).addTo(map);
      marker.on('dragend', function(e) {
        var pos = e.target.getLatLng();
        circle.setLatLng(pos);
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'pin', lat: pos.lat, lng: pos.lng }));
      });
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'pin', lat: lat, lng: lng }));
    }

    ${pinLat !== null ? `placePin(${pinLat}, ${pinLng});` : ""}

    map.on('click', function(e) {
      placePin(e.latlng.lat, e.latlng.lng);
    });

    function updateRadius(r) {
      if (circle) circle.setRadius(r);
    }

    function flyTo(lat, lng) {
      map.flyTo([lat, lng], 17);
      placePin(lat, lng);
    }
  </script>
</body>
</html>`;
}
