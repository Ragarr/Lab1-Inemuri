// init position of the map
var map;
// Crear un marcador con un icono personalizado
var userIcon = L.icon({
  iconUrl: "media/current-location-1.svg",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

var userMarker;









function initializeMap(position) {
    map = L.map("map").setView(
        [position.coords.latitude, position.coords.longitude],
        19
    );

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
            '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
}
function onPositionError(error) {
    console.error("Error getting position: ", error, error.message);
}

function drawUserIcon(position) {
    var lat = position.coords.latitude;
    var lon = position.coords.longitude;
    console.log(lat, lon);

    // Si el marcador ya existe, actualiza su ubicación
    if (userMarker) {
        userMarker.setLatLng([lat, lon]);
    } else {
        // Si no, crea un nuevo marcador y añádelo al mapa
        userMarker = L.marker([lat, lon], { icon: userIcon }).addTo(map);
    }

    // Centrar el mapa en la nueva ubicación
    map.setView([lat, lon], 10);
}

// Inicializar el mapa con la ubicación actual
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(initializeMap, onPositionError, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
    });
} else {
    alert("Geolocation is not supported by this browser.");
}

if ("DeviceOrientationEvent" in window) {
    window.addEventListener(
        "deviceorientation",
        function (event) {
            var alpha = event.alpha; // Valor de orientación en grados
        },
        false
    );
} else {
    console.log(
        "La API de orientación del dispositivo no es compatible con este navegador."
    );
}

// Usar la función drawUserIcon en watchPosition
watchPositionId = navigator.geolocation.watchPosition(
    drawUserIcon,
    onPositionError,
    { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
);
