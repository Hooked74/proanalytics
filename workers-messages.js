module.exports = function (worker, io) {
  return function (msg) {
    switch (msg.cmd) {
    case 'openChannels':
      io.of('/user_' + msg.id);
      io.of('/company_' + msg.companyId);
      worker.send({
        cmd: 'openChannels'
      });
      break;
    case 'sendReport':
      io.of('/user_' + msg.userId).emit('reportCreated', msg.reportDbId);
      break;
    }
  };
}