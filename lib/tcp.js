var net = require('net');
var tcp = require('./tcp.js');

function createTcpServer (port, callback) {
	net.createServer(callback).listen(port);
	log('Server listening on port %s', port);
}

function createTcpClient (host, port, callback) {
	var client = new net.Socket();
	client.connect(port, host);
	client.on('error', function (err) {
		setTimeout(function () {
			createTcpClient(host, port, callback);
		}, 1000);
	});
	client.on('connect', function () {
		log('Connected to %s:%s', host, port);
		callback(client);
	});
	client.on('end', function () {
		log('Disconnected from %s:%s', host, port);
		createTcpClient(host, port, callback);
	});
}

module.exports = {
	createServer: createTcpServer,
	createClient: createTcpClient
};
