// init position of the map
var map = L.map("map");
// Crear un marcador con un icono personalizado
var userIcon = L.icon({
    iconUrl: "media/current-location-1.svg",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
});

var userMarker;
var markers = []; // Array para almacenar los marcadores creados
var zoom = 17; // Nivel de zoom inicial del mapa

function initializeMap(position) {
    map.setView([position.coords.latitude, position.coords.longitude], zoom);

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
    map.setView([lat, lon], zoom);
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

// ACTIONS
// add marker on click
var isDrawing = false; // Variable para indicar si se está dibujando un marcador con círculo
var circle; // Variable para almacenar el círculo que se está dibujando
var startDrawTime; // Tiempo de inicio de dibujo
var initialVelocity = 0.000005; // Velocidad inicial de crecimiento del radio
const INITIAL_ACC_FACTOR = 0.00005; // Factor de aceleración inicial
var accelerationFactor = INITIAL_ACC_FACTOR; // Factor de aceleración
// Función para dibujar un marcador con un círculo alrededor
function addMarkerWithCircle(e) {
    console.log("Mousedown detected."); // Mensaje de depuración para mostrar cuando se hace clic
    var marker = L.marker(e.latlng).addTo(map); // Crea un marcador en la posición del clic

    var initialRadius = 0; // Radio inicial del círculo
    circle = L.circle(e.latlng, {
        color: "blue", // Color del borde del círculo
        fillColor: "#3388ff", // Color de relleno del círculo
        fillOpacity: 0.3, // Opacidad del relleno
        radius: initialRadius, // Radio inicial del círculo
    }).addTo(map);

    startDrawTime = Date.now(); // Guardar el tiempo de inicio del dibujo
    isDrawing = true; // Indica que se está dibujando

    // Actualizar el radio del círculo mientras se mantiene pulsado el clic
    var updateRadiusInterval = setInterval(function () {
        var timeDiff = Date.now() - startDrawTime; // Tiempo transcurrido desde que se inició el dibujo
        var radius = initialVelocity * timeDiff + accelerationFactor * Math.pow(timeDiff, 2); // Calcular el nuevo radio con aceleración
        circle.setRadius(radius); // Actualizar el radio del círculo
        accelerationFactor *= 1.05; // Aumentar el factor de aceleración
    }, 50); // Intervalo de actualización del radio (ms)

    // Dejar de actualizar el radio del círculo cuando se suelta el clic
    map.on("mouseup touchend", function () {
        console.log("Mouseup detected."); // Mensaje de depuración para mostrar cuando se suelta el clic
        isDrawing = false; // Indica que se ha terminado de dibujar
        clearInterval(updateRadiusInterval); // Detener la actualización del radio
        accelerationFactor = INITIAL_ACC_FACTOR; // Restablecer el factor de aceleración
    });
}

map.on("mousedown touchstart", function (e) {
    if (!isDrawing) {
        addMarkerWithCircle(e); // Agrega un marcador con círculo al hacer clic en el mapa
    }
});


console.log("script.js loaded!");
