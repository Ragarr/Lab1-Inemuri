

/*
INICIALIZACIÓN DEL MAPA Y UBICACIÓN DEL USUARIO
*/
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

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(initializeMap, onPositionError, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
    });
} else {
    alert("Geolocation is not supported by this browser.");
}

/* 
DIBUJO DEL ICONO DEL USUARIO Y TRACK DE SU UBICACIÓN
*/


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

// Usar la función drawUserIcon en watchPosition
watchPositionId = navigator.geolocation.watchPosition(
    drawUserIcon,
    onPositionError,
    { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
);

/*
CONTROL DEL ZOOM
para que no se reinicie el zoom al cambiar de ubicación
*/
map.on("zoomend", function () {
    zoom = map.getZoom();
});


/*
DESHABILITAR ZOOM CON DOBLE CLIC
*/
map.doubleClickZoom.disable();


/*

AÑADIR Y ELIMINAR MARCADORES
FUNCIONAMIENTO:
1. Al hacer doble clic en el mapa, se añade un marcador en la ubicación seleccionada.
2. Se crea un circulo alrededor del marcador
2. Al hacer clic en el radio exterior del circulo permite cambiar el radio del círculo con un popup 
4. se añade un evento de clic al marcador para eliminarlo
*/

// constantes
const DEFAULT_RADIUS = 100; // radio por defecto del círculo



// detectar dobleclic en el mapa
map.on("dblclick", function (event) {
    var lat = event.latlng.lat;
    var lon = event.latlng.lng;
    console.log(lat, lon);

    var marker = L.marker([lat, lon]).addTo(map);
    markers.push(marker);
    // Crear un círculo alrededor del marcador
    var circle = L.circle([lat, lon], {
        color: "red",
        fillColor: "#f03",
        fillOpacity: 0.5,
        radius: DEFAULT_RADIUS,
    }).addTo(map);
    // Añadir evento de clic al marcador para eliminarlo
    marker.on("click", function () {
        map.removeLayer(marker);
        map.removeLayer(circle);
        markers = markers.filter(function (m) {
            return m !== marker;
        });
    });
    circle.on("click", function () {
        console.log("click en el círculo");
        var popup = L.popup()
            .setLatLng([lat, lon])
            .setContent(
                '<input type="range" id="radius" value="' +
                inverseLogslider(circle.getRadius()) +
                '" min="0" max="100"><label for="radius">Radio: </label><span id="radius-value">' + getDistanceUnits(circle.getRadius()) +'</span>'
            ).openOn(map);
        // Añadir evento de input al selector de rango del popup
        document.getElementById("radius").addEventListener("input", function () {
            var inputValue = document.getElementById("radius").value;
            var newRadius = parseInt(logslider(inputValue));
            document.getElementById("radius-value").innerText = getDistanceUnits(newRadius);
            circle.setRadius(newRadius);
        });
    });

});
function logslider(position) {
    // position will be between 0 and 100
    var minp = 0;
    var maxp = 100;
  
    // The result should be between 100 an 100.000
    var minv = Math.log(100);
    var maxv = Math.log(100000);
  
    // calculate adjustment factor
    var scale = (maxv-minv) / (maxp-minp);
  
    return Math.exp(minv + scale*(position-minp));
}

function inverseLogslider(value) {
    // Los valores min y max son los mismos que en la función logslider
    var minp = 0;
    var maxp = 100;
    var minv = Math.log(100);
    var maxv = Math.log(100000);
    var scale = (maxv-minv) / (maxp-minp);

    // Calcular la posición inversa
    var position = (Math.log(value) - minv) / scale + minp;

    return position;
}

function getDistanceUnits(value) {
    console.log(value);
    if (value < 1000) {
        console.log(value + "m");
        return value + "m";
    } else {
        console.log((value / 1000).toFixed(2) + "km");
        return (value / 1000).toFixed(2) + "km";
    }
}