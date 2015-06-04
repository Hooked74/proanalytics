"use strict";
var fs = require('fs');
var os = require('os');
var cluster = require('cluster');

require.extensions['.txt', '.sql'] = function (module, filename) {
  module.exports = fs.readFileSync(filename, 'utf8');
};

global.rootRequire = function (name) {
  return require(__dirname + '/back-end/' + name);
}

global.__fullpath = __dirname;

rootRequire("other/wrap-console");

var version = +process.version.match(/\d+\.\d+/)[0];
var isLinux = os.platform() === 'linux';

var workersMessages = require('./workers-messages');

if (cluster.isMaster) {
  var io = require('./socket-server')(isLinux);
}

var server = require('./server');

if (cluster.isMaster && isLinux) { //|| version > 0.10)) {  
  var cpus = os.cpus().length;
  for (var i = 0; i < cpus; ++i) {
    var worker = cluster.fork();
    worker.on('message', workersMessages(worker, io));
  }

  cluster.on('death', function (worker) {
    console.log('Worker', worker.pid, 'died');
    cluster.fork(); // Auto restart died worker.
  });
} else {
  server(io);
}