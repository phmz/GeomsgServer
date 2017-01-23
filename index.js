var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
    var clientIp = socket.request.connection.remoteAddress;

    console.log(clientIp + ' connected');
    socket.on('chat message', function (msg) {
        console.log(clientIp + ' sent: ' + msg);
        io.emit('chat message', msg);
    });
    socket.on('disconnect', function () {
        console.log(clientIp + ' deconnected');
    });
	socket.on('update loc', function () {
        console.log(clientIp + ' updated their location');
    });    
});

var port = process.env.PORT || 3000;

http.listen(port, function () {
    console.log('listening on *:3000');
});