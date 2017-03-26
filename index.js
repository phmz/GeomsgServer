var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var users = new Map();
var maxDistance = 10000; // km

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});
io.on('connection', function(socket) {
    var socketRequest = socket.request;
    var userId = socketRequest._query['userId'];
    console.log('new client ' + userId);
    var clientIp = socket.request.connection.remoteAddress;
    console.log(clientIp + ' connected');
    socket.on('chat message', function(data) {
        var data = data;
        console.log(data);
        console.log(data.fromUser + ' SENT A MESSAGE TO ' + data.toUser + '\n' + data.message);
        //console.log(clientIp + ' sent: ' + msg);
        //socket.emit('chat message', data.fromUser + ' SENT A MESSAGE TO ' + data.toUser + '\n' + data.message);
        //users.get(data.toUser)[1].emit('chat message', data.toUser + 'RECEIVE FROM' + data.fromUser +'\n' + data.message);
        var json = {
            userId: data.fromUser,
            message: data.message
        };
        if (users.get(data.toUser).socket.connected) {
            console.log("User is online!");
            socket.broadcast.to(users.get(data.toUser).socket.id).emit('chat message', json);
            socket.broadcast.to(users.get(data.toUser).socket.id).emit('update chat', json);
        } else {
            console.log("User is offline!");
            addMessageToBacklog(data.toUser, json);
        }

    });
    socket.on('disconnect', function() {
        console.log(socket.id);
        console.log(clientIp + ' disconnected');
    });
    socket.on('update loc', function(data) {
        var data = data;
        if (users.get(data.name) === undefined) {
            return;
        }
        console.log(clientIp + ' updated their location');
        console.log('new location, user : ' + data.name + ' change position -- latitude = ' + data.latitude + ', longitude = ' + data.longitude);
        users.get(data.name).latitude = data.latitude;
        users.get(data.name).longitude = data.longitude;
    });

    socket.on('new connection', function(data) {
        var val;
        if (users.get(data.username) !== undefined) {
            if (users.get(data.username).password == data.password) {
                users.get(data.username).socket = socket;
                console.log('New user connected: ' + data.username + ' socket: ' + socket);
                console.log(users.size + ' users currently connected');
                sendBacklog(data.username, socket);
                val = {
                    connected: true
                }
            } else {
                val = {
                    connected: false
                }
            }
        } else {
            val = {
                connected: false
            }
        }
        socket.emit('connection_val', val);

        //getUserList(userId, users.get(userId).latitude, users.get(userId).longitude);
    });

    socket.on('reconnection', function(data){
        if (users.get(userId) === undefined) {
            return;
        }
        users.get(data.username).socket = socket;
    });

    socket.on('register', function(jsonData) {
        var val;
        if (users.get(userId) === undefined) {

            var data = {};
            data.socket = socket;
            data.password = jsonData.password;
            users.set(jsonData.username, data);
            console.log('New user connected: ' + jsonData.username + ' socket: ' + data.socket);
            console.log(users.size + ' users currently connected');
            sendBacklog(jsonData.username, socket);
            val = {
                registered: true
            }
        } else {
            val = {
                registered: false
            }
        }
        socket.emit('register_val', val);
    })

    socket.on('request list', function(userId) {
        console.log(userId + ' requested an update on his list');
        if (users.get(userId) === undefined) {
            return;
        }
        if (users.get(userId).latitude === undefined || users.get(userId).longitude === undefined) {
            users.get(userId).latitude = 0.;
            users.get(userId).longitude = 0.;
            // handle error
            // ask for position update
        } else {
            var listJson = getUserList(userId, users.get(userId).latitude, users.get(userId).longitude);
            socket.emit('update list', listJson);
        }
    });

});

var port = process.env.PORT || 3000;

http.listen(port, function() {
    console.log('listening on : ' + port);
});

function addMessageToBacklog(toUser, json) {
    // Adding message to wait list
}

function sendBacklog(userId, socket) {
    // Sending every waiting message
}

function getUserList(userId, latitude, longitude) {
    var listJson = {
        users: []
    };
    console.log("user " + userId + " is at latitude" + users.get(userId).latitude + " and longitude " + users.get(userId).longitude);
    users.forEach(function(value, key) {
        console.log("checking " + key + " latitude" + value.latitude + " and longitude " + value.longitude);
        if (userId !== key && value.latitude !== undefined && value.longitude !== undefined) {
            var distance = distanceBetween(latitude, longitude, value.latitude, value.longitude);
            console.log("Disntance between " + userId + " and " + key + " is " + distance);
            if (distance < maxDistance) {
                var userJson = userToJsonString(key, distance);
                listJson.users.push(userJson);
                console.log("Adding " + key + " to " + userId + " list");
            }
        }
    });
    console.log("list:");
    console.log(listJson);
    return listJson;
}

function distanceBetween(lat1, lon1, lat2, lon2) {
    var R = 6371e3; // metres
    var φ1 = lat1.toRadians();
    var φ2 = lat2.toRadians();
    var Δφ = (lat2 - lat1).toRadians();
    var Δλ = (lon2 - lon1).toRadians();

    var a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    var d = R * c;
    return d / 1000; // km
}

if (Number.prototype.toRadians === undefined) {
    Number.prototype.toRadians = function() {
        return this * Math.PI / 180;
    };
}

function userToJsonString(userId, distance) {
    var user = {
        userId: userId,
        distance: distance
    };
    return user;
}

function appendUserToJson(completeJsonString, userJsonString) {
    if (completeJsonString === "") {
        return completeJsonString.concat(userJsonString);
    }
    return completeJsonString.concat(',').concat(userJsonString);
}

function closeUserListJson(jsonList) {
    return '{'.concat(jsonList).concat('}');
}
