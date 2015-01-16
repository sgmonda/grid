// Dependencies
// =============================================================================

var util = require('util');
var tcp = require('./tcp.js');

// Globals
// =============================================================================

var debug = false;

// Module body
// =============================================================================

function Grid(conf) {

	var self = this;

	// Debug settings

	debug = conf.debug ? true : false;

	// Check configuration requisites

	if (!Array.isArray(conf.cluster) || conf.cluster.length < 1) {
		throw new Error('No hosts specified in Grid config.');
	}
	log('Grid defined with %d hosts:\n%s', conf.cluster.length, util.inspect(conf.cluster, {colors: true, depth: null}));

	if (!conf.port) {
		throw new Error('No port specified for this grid instance');
	}
	log('Starting grid node on port %d...', conf.port);

	// Connect to hosts

	tcp.createServer(conf.port, function (socket) {
		self.server = socket;
	});
	self.cluster = {};
	conf.cluster.forEach(function (server) {
		if (server.host === 'localhost' && server.port == conf.port) {
			return;
		}
		tcp.createClient(server.host, server.port, function (tcpClient) {
			var hostId = server.host + ':' + server.port;
			self.cluster[hostId] = tcpClient;
		});

	});

	/*console.log(self.cluster);
	for (var host in self.cluster) {
		self.cluster[host].ping();
	}
	*/
}

// Exports
// =============================================================================

module.exports = Grid;
