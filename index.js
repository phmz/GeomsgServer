var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
    var socketRequest = socket.request;
    var userId = socketRequest._query['userId'];
    console.log('new client ' + userId);
    var clientIp = socket.request.connection.remoteAddress;

    console.log(clientIp + ' connected');
    socket.on('chat message', function (data) {
        var data = data;
        console.log(data.fromUser + ' SENT A MESSAGE TO '+ data.toUser + '\n' + data.message);
        //console.log(clientIp + ' sent: ' + msg);
        io.emit('chat message', "delivered");
    });
    socket.on('disconnect', function () {
        console.log(clientIp + ' disconnected');
    });
    socket.on('update loc', function (data) {
        var data = data;
        console.log(clientIp + ' updated their location');
        console.log('new location, user : '+data.name+' change position -- latitude = ' + data.latitude + ', longitude = ' + data.longitude);
    });
});

var port = process.env.PORT || 3000;

http.listen(port, function () {
    console.log('listening on : ' + port);
});