var app = (function () {

    var urlDibujo = 0;

    class Point {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
    }

    var stompClient = null;

    var addPointToCanvas = function (point) {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.stroke();
    };

    var addPoligonToCanvas = function (points) {
        console.log(points[1].x);
        var data = points;
        var canvas = document.getElementById("canvas");
        var line = canvas.getContext("2d");
        line.beginPath();
        line.fillStyle = '#f00';
        for (i = 0; i < data.length; i++) {
            line.moveTo(data[i].x, data[i].y);
            var j = i + 1 < data.length ? i + 1 : 0;
            line.lineTo(data[j].x, data[j].y);
        }
        line.closePath();
        line.fill();
        line.stroke();
    }
    var getMousePosition = function (evt) {
        canvas = document.getElementById("canvas");
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };

    var postAtTopic = function (point) {
        //creando un objeto literal
        stompClient.send("/app"+urlDibujo, {}, JSON.stringify(point));
        console.log("Se añadio el punto " + point);
    };

    var connectAndSubscribe = function () {
        console.info('Connecting to WS...');
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);
        //subscribe to /topic/TOPICXX when connections succeed
        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            //enviando un objeto creado a partir de una clase
            stompClient.subscribe("/topic" + urlDibujo, function (eventbody) {
                console.log(JSON.parse(eventbody.body));
                if (urlDibujo.includes("newpoint")) {
                    var point = JSON.parse(eventbody.body);
                    addPointToCanvas(point);
                }
                else{

                    addPoligonToCanvas(JSON.parse(eventbody.body));
                }
            });
        }); 
    };

    return {

        connect: function (dibujo) {
            var can = document.getElementById("canvas");
            //websocket connection
            var selecion = document.getElementById("conexion")
            urlDibujo = selecion.value + dibujo;
            connectAndSubscribe();
            alert("Te conectaste al "+selecion[selecion.selectedIndex].innerHTML+" No" + dibujo);
            if (urlDibujo.includes("newpoint")) {
                if (window.PointerEvent) {
                    can.addEventListener("pointerdown", function (evt) {
                        var point = getMousePosition(evt);
                        console.log(point);
                        addPointToCanvas(point);
                        publicPointAtTopic(point)
                    });
                }
            }
        },

        publishPoint: function (px, py) {
            var pt = new Point(px, py);
            console.info("publishing point at " + pt);
            addPointToCanvas(pt);
            postAtTopic(pt)
        },

        disconnect: function () {
            if (stompClient !== null) {
                stompClient.disconnect();
            }
            setConnected(false);
            console.log("Disconnected");
        }
    };
})();
