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

document.body.addEventListener("touchmove", function (event) {
    event.preventDefault();
});

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

//  SIMULAR EVENTOS DE RATÓN PARA EVENTOS TÁCTILES YA QUE MAP. ON NO SOPORTA LOS EVENTOS TÁCTILES
function simulateMouseEvent(event, simulatedType) {
    // Si el evento original es un evento táctil, cambia las coordenadas del evento
    if (event.touches) {
        var touch = event.changedTouches[0];
        var simulatedEvent = new MouseEvent(simulatedType, {
            bubbles: true,
            cancelable: true,
            view: window,
            screenX: touch.screenX,
            screenY: touch.screenY,
            clientX: touch.clientX,
            clientY: touch.clientY,
        });
        event.target.dispatchEvent(simulatedEvent);
        event.preventDefault();
    }
}

document.addEventListener("touchstart", function (e) {
    //console.log("Touchstart detected."); // Mensaje de depuración para mostrar cuando se toca la pantalla
    simulateMouseEvent(e, "mousedown");
});

document.addEventListener("touchend", function (e) {
    //console.log("Touchend detected."); // Mensaje de depuración para mostrar cuando se levanta el dedo de la pantalla
    simulateMouseEvent(e, "mouseup");
});

document.addEventListener("touchmove", function (e) {
    //console.log("Touchmove detected."); // Mensaje de depuración para mostrar cuando se mueve el dedo por la pantalla
    simulateMouseEvent(e, "mousemove");
});

document.addEventListener("touchcancel", function (e) {
    //console.log("Touchcancel detected."); // Mensaje de depuración para mostrar cuando se cancela el evento táctil
    simulateMouseEvent(e, "mouseup");
});


// ACTIONS
// add marker on click
var isDrawing = false; // Variable para indicar si se está dibujando un marcador con círculo
var circle; // Variable para almacenar el círculo que se está dibujando
var startDrawTime; // Tiempo de inicio de dibujo
var initialVelocity = 0.000005; // Velocidad inicial de crecimiento del radio
const INITIAL_ACC_FACTOR = 0.00005; // Factor de aceleración inicial
var accelerationFactor = INITIAL_ACC_FACTOR; // Factor de aceleración

var timeout;
var isLongClick = false;
var MIN_HOLD = 300; // Tiempo mínimo para considerar un clic largo (ms)

// Función para dibujar un marcador con un círculo alrededor
function addMarkerWithCircle(e) {

    // console.log("Mousedown detected."); // Mensaje de depuración para mostrar cuando se hace clic
    var marker = L.marker(e.latlng).addTo(map); // Crea un marcador en la posición del clic
    // Agrega un controlador de eventos para eliminar el marcador en un doble clic
    marker.on("mousedown", function () {
        if (isLongClick) {
            console.log("click largo detectado."); // Mensaje de depuración para mostrar cuando se hace doble clic
            return;
        }
        console.log("stoped interval."); // Mensaje de depuración para mostrar cuando se suelta el clic
        // buscar el marcador y el círculo en el array de marcadores y eliminarlos
        for (var i = 0; i < markers.length; i++) {
            if (markers[i].marker === marker) {
                map.removeLayer(markers[i].marker);
                map.removeLayer(markers[i].circle);
                markers.splice(i, 1);
                break;
            }
        }
    }
    );
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
        var radius =
            initialVelocity * timeDiff +
            accelerationFactor * Math.pow(timeDiff, 2); // Calcular el nuevo radio con aceleración
        circle.setRadius(radius); // Actualizar el radio del círculo
        accelerationFactor *= 1.05; // Aumentar el factor de aceleración para hacerlo "exponencial" - se siente más natural
    }, 50); // Intervalo de actualización del radio (ms)

    // Dejar de actualizar el radio del círculo cuando se suelta el clic
    map.on(
        "mouseup",
        function () {
            // console.log("Mouseup detected."); // Mensaje de depuración para mostrar cuando se suelta el clic
            isDrawing = false; // Indica que se ha terminado de dibujar
            clearInterval(updateRadiusInterval); // Detener la actualización del radio
            accelerationFactor = INITIAL_ACC_FACTOR; // Restablecer el factor de aceleración
            // si el circulo es demasiado pequeño, eliminarlo
            if (circle.getRadius() < 10) {
                map.removeLayer(circle);
            }
            markers.push({ marker: marker, circle: circle }); // Añadir el marcador y el círculo al array de marcadores
        },
        { passive: false }
    );
}

map.on(
    "mousedown",
    function(event) {
        console.log("started Timeout."); // Mensaje de depuración para mostrar cuando se hace clic
        timeout = setTimeout(addMarkerWithCircle, MIN_HOLD, event); // Define el tiempo límite para el clic largo
    });

map.on(
    "mouseup",
    function() {
        console.log("stoped Timeout."); // Mensaje de depuración para mostrar cuando se suelta el clic
        clearTimeout(timeout); // Cancela el clic largo si se suelta el clic antes del tiempo límite
    });



console.log("script.js loaded!");
