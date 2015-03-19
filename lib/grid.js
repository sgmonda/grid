// Dependencies ################################################################

var util = require('util');
var tcp = require('./tcp.js');
var events = require('events');

// Module body #################################################################

function Grid(conf) {

	var self = this;
	events.EventEmitter.call(this);

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

	function propagateMessage(messageTitle, messageBody) {
		for (var nodeId in self.cluster) {
			self.cluster[nodeId].write(JSON.stringify({title: messageTitle, body: messageBody}));
		}
	}

	/**
	 * Initialization
	 **/
	if (!conf.port) {
		throw new Error('No port specified for this grid instance');
	}
	log('Starting grid node on port %d...', conf.port);
	tcp.createServer(conf.port, function (socket) {
		self.server = socket;
		initServer();
	});
	self.cluster = {};
	conf.cluster.forEach(function (server) {
		self.addNode(server.host, server.port);
	});

	function initServer() {
		self.server.on('data', function (data) {
			try {
				data = JSON.parse(data.toString());
				if (data.title && data.body) {
					self._emit(data.title, data.body);
				}
			} catch (err) {
				log('Unrecognized message: %j. Error: %s', data, err);
			}
		});
	}

	/**
	 * Emit events into the grid scope
	 **/
	self._emit = self.emit;
	self.emit = function (eventId, data) {
		propagateMessage(eventId, data);
	};
}

Grid.prototype.__proto__ = events.EventEmitter.prototype;

// Exports #####################################################################

module.exports = Grid;
