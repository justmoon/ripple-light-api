var config = require('../config');

var ripple = require('ripple-lib');

var remote = new ripple.Remote({
  // see the API Reference for available options
  trusted:        true,
  local_signing:  true,
  local_fee:      true,
  fee_cushion:     1.5,
  servers:        config.ripple_servers
});

remote.on('connected', function () {
  console.log("connected to ripple");
});

remote.on('disconnected', function () {
  console.log("disconnected from ripple");
});

remote.connect();


module.exports = remote;
