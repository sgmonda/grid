Node.js Grid, just a funny experiment to share events in a distributed environment.

# Installation

To install `grid` just use [npm](https://www.npmjs.com/):

	$ npm install grid


Note: To avoid manual installations, remember to add `grid` as a dependency in your [`package.json`](https://docs.npmjs.com/files/package.json).

# Usage

A grid is a set of nodes, sharing common events. A single node is enough to have a grid running:

```javascript
var Grid = require('grid');
var grid = new Grid({
	debug: true,
	port: 9976 // "localhost:9976" from the same machine
});
```

Later other nodes can contact the previous one to be registered as a grid member and start working together:

```javascript
var Grid = require('grid');
var grid = new Grid({
	debug: true,
	port: 9977
});
grid.addNode('localhost', 9976);
```

At this point, the grid is ready and the two nodes can share grid events. New nodes could be added to the grid using any of the current nodes to be registered. In these examples, we're using "localhost" because all nodes run in the same machine, but you can use any public or private IP if used ports are open and every node is accessible from other ones. Try stopping and starting again any node. What happens?

While the grid is running, **any node can be killed without breaking the grid** (even the first node to be started). Once the killed node starts, it is automatically registered in the grid again. If a killed node starts in the same port it was during the util life of the grid, then it does not need to provide a valid node to be registered, because the grid will register it automatically.

A grid is alive if at least one of its nodes is alive.

### Shared events

A Grid shares events accross all its nodes. Events are thrown and received as follows:

```javascript
// Receiving grid events
grid.on('X', function (data) {
	console.log('Event X received!', data);
});
```

```javascript
// Emiting grid events
grid.emit('X', {a: 1, b: 2, c: 3});
```

## A real life example

To be done
