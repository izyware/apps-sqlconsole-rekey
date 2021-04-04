/* izy-loadobject nodejs-require */

const proxyLib = require('izy-proxy').basePath;
const sqlLib = require('../index').basePath;

var modtask = function() {};

modtask.test = function() {
  modtask.doChain([
    ['chain.importProcessor', `${sqlLib}/chain`, {
      verbose: {
          logConnectionAttempt: true,
          logQuery: true
      }
    }],
    [`//inline/${proxyLib}/json?loadById`, { 
      id: {
          "adapterservice": "//inline/adapter/test"
      }
    }],
    chain => chain(['sql.connect', chain.get('outcome').data]),
    ['sql.query', 'select 1'],
    ['sql.disconnect'],
    ['outcome', { success: true, data: 'All tests passed' }]
  ]);
}

module.exports = modtask;
