var os = require('os');
var static = require('node-static');
var https = require('https');
var socketIO = require('socket.io');
var fs = require('fs');

var options = {
  // key: fs.readFileSync('key.pem'),
  // cert: fs.readFileSync('cert.pem')
};

var fileServer = new(static.Server)();
var app = https.createServer(options, function (req, res) {
  fileServer.serve(req, res);
}).listen(2013);

var io = socketIO.listen(app);
io.sockets.on('connection', function (socket){

    // convenience function to log server messages on the client
    function log(){
		var array = [">>> Message from server:"];
        array.push.apply(array, arguments);
	    socket.emit('log', array);
	}

	socket.on('message', function (message) {
		log('Client said:', message);
        // for a real app, would be room only (not broadcast)
		socket.broadcast.emit('message', message);
	});

	socket.on('create or join', function (room) {
        log('Request to create or join room ' + room);

		var numClients = io.sockets.clients(room).length;
		log('Room ' + room + ' has ' + numClients + ' client(s)');

		if (numClients === 0){
			socket.join(room);
			socket.emit('created', room, socket.id);

		} else if (numClients === 1) {
			socket.join(room);
            socket.emit('joined', room, socket.id);
            io.sockets.in(room).emit('ready');

		} else { // max two clients
			socket.emit('full', room);
		}
	});

    socket.on('ipaddr', function () {
        var ifaces = os.networkInterfaces();
        for (var dev in ifaces) {
            ifaces[dev].forEach(function (details) {
                if (details.family=='IPv4' && details.address != '127.0.0.1') {
                    socket.emit('ipaddr', details.address);
                }
          });
        }
    });

});


