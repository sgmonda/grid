// Dependencies ################################################################

var util = require('util');
var tcp = require('./tcp.js');
var events = require('events');

// Module body #################################################################

/**
 * Creates a node identifier
 **/
function getId(host, port) {
	return host + ':' + port;
}

/**
 * Grid class
 **/
function Grid(conf) {

	var self = this;
	self.host = conf.host;
	self.port = conf.port;
	self.id = getId(self.host, self.port);
	self.cluster = {};
	events.EventEmitter.call(this);

	// Debug global flag
	debug = conf.debug ? true : false;

	/**
	 * Adds a new node to the grid
	 **/
	self.addNode = function (host, port) {
		var hostId = getId(host, port);
		if (self.cluster[hostId]) {
			return;
		}
		tcp.createClient(host, port, function (tcpClient) {
			self.cluster[hostId] = tcpClient;
		});
	};
	self.addNode(self.host, self.port);

	/**
	 * Removes an existing node from the grid
	 **/
	self.removeNode = function (host, port) {
		var hostId = getId(host, port);
		if (!self.cluster[hostId]) {
			return;
		}
		self.cluster[hostId].destroy();
		delete self.cluster[hostId];
		log('Node %s:%s removed from the grid', host, port);
	};

	/**
	 * Propagates a message to all available nodes in the cluster
	 **/
	function propagateMessage(messageTitle, messageBody, includeSelf) {
		for (var nodeId in self.cluster) {
			if ((nodeId === getId(self.host, self.port)) && !includeSelf) {
				continue;
			}
			try {
				self.cluster[nodeId].write(JSON.stringify({title: messageTitle, body: messageBody}));
			} catch (err) {}
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
	(conf.cluster || []).forEach(function (server) {
		self.addNode(server.host, server.port);
	});

	function initServer() {
		self.server.on('data', function (data) {
			data = data.toString();
			data = data.replace(/\}\{/g, '}###{'); // TODO What happens with joint messages? This approach is not the best
			data = data.split('###');
			data.forEach(function (data) {
				try {
					data = JSON.parse(data);
					if (data.title && data.body) {
						self._emit(data.title, data.body);
					}
				} catch (err) {
					log('Unrecognized message: %j. Error: %s', data.toString(), err);
				}
			});
		});
	}

	/**
	 * Emit events into the grid scope
	 **/
	self._emit = self.emit;
	self.emit = function (eventId, data) {
		propagateMessage(eventId, data, true);
	};

	/**
	 * Keep alive connection with all nodes (including new ones)
	 **/
	setInterval(function () {
		self.emit('alive', {host: self.host, port: self.port, ttl: settings.ALIVE_TTL_STEPS, history: [self.id]});
	}, settings.SYNC_ALIVE_INTERVAL);
	self.on('alive', function (data) {

		// Ignore already received alives
		if (data.history.indexOf(self.id) !== -1) {
			return;
		}

		// Register node
		if (!self.cluster[getId(data.host, data.port)]) {
			self.addNode(data.host, data.port);
			log('New node detected:', getId(data.host, data.port));
		}

		// Propagation
		data.history.push(self.id);
		propagateMessage('alive', data, false);
	});
}

Grid.prototype.__proto__ = events.EventEmitter.prototype;

// Exports #####################################################################

module.exports = Grid;
