'use strict';
module.exports = function (isAddRedis) {
  var app = require('express')();
  var http = require('http');

  var config = rootRequire('config');

  var server = http.createServer(app);
  var port = config.get("socketServerPort");
  var io = require('socket.io')(server, {
    origins: config.get("domains").join()
  });

  if (isAddRedis) {
    var redis = require('socket.io-redis');
    io.adapter(redis({
      host: config.get('redisHost'),
      port: config.get('redisPort')
    }));
  }

  io.of('/allCompanies');

  server.listen(port, function (req, res) {
    console.log('Socket Server started on port ' + port);
  });

  return io;
}