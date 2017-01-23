var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

io.on('connection', function (socket) {
    var clientIp = socket.request.connection.remoteAddress;

    console.log(clientIp + ' connected');
    socket.on('chat message', function (msg) {
        console.log('message: ' + msg);
        io.emit('chat message', msg);
    });
    socket.on('disconnect', function () {
        console.log(clientIp + ' deconnected');
    });
});

http.listen(3000, function () {
    console.log('listening on *:3000');
});