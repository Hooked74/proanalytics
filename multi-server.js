"use strict";
var os = require('os');
var	cluster = require('cluster');
var version = +process.version.match(/\d+\.\d+/)[0];

if (cluster.isMaster && os.platform() === 'linux') {  //|| version > 0.10)) {
	var cpus = os.cpus().length;
	for (var i = 0; i < cpus; ++i) {
		cluster.fork();
	}

	cluster.on('death', function(worker) {
		console.log('Worker', worker.pid, 'died');
		cluster.fork(); // Auto restart died worker.
	});
} else {
	require('./server');
}
