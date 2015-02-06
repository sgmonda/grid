// Dependencies ################################################################

var util = require('util');
var tcp = require('./tcp.js');

// Module body #################################################################

function Grid(conf) {

	var self = this;

	// Debug global flag
	debug = conf.debug ? true : false;

	/**
	 * Adds a new node to the grid
	 **/
	self.addNode = function (host, port) {
		var hostId = host + ':' + port;
		if (self.cluster[hostId]) {
			return;
		}
		log('Node %s:%s added to the grid', host, port);
		tcp.createClient(host, port, function (tcpClient) {
			self.cluster[hostId] = tcpClient;
		});
	};

	/**
	 * Removes an existing node from the grid
	 **/
	self.removeNode = function (host, port) {
		var hostId = host + ':' + port;
		if (!self.cluster[hostId]) {
			return;
		}
		self.cluster[hostId].destroy();
		delete self.cluster[hostId];
		log('Node %s:%s removed from the grid', host, port);
	};

	/**
	 * Initialization
	 **/
	if (!conf.port) {
		throw new Error('No port specified for this grid instance');
	}
	log('Starting grid node on port %d...', conf.port);
	tcp.createServer(conf.port, function (socket) {
		self.server = socket;
	});
	self.cluster = {};
	conf.cluster.forEach(function (server) {
		self.addNode(server.host, server.port);
	});
}

// Exports #####################################################################

module.exports = Grid;
