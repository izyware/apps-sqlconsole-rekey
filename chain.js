
const modtask = (chainItem, cb, $chain) => {
  if (!modtask.__chainProcessorConfig) modtask.__chainProcessorConfig = {};
  const verbose =  modtask.__chainProcessorConfig.verbose || {};
  var i = 0;
  var params = {};
  params.action = modtask.extractPrefix(chainItem[i++]);
  switch (params.action) {
    case 'disconnect':
      if (!modtask.connected) return $chain.chainReturnCB({ reason: 'not connected' });
      modtask.connection.end();
      cb();
      return true;
    case 'connect':
      if (modtask.connected) return $chain.chainReturnCB({ reason: 'already connected' });
      var mysql = require('mysql');
      var config = chainItem[i++] || {};
      if (verbose.logConnectionAttemp) console.log('Connecting to ', config);
      modtask.connection = mysql.createConnection(config);
      modtask.connected = true;
      $chain.set('outcome', { success: true });
      cb();
      return true;
    case 'query':
      if (!modtask.connected) return $chain.chainReturnCB({ reason: 'not connected' });
      var query = chainItem[i++] || {};
      var start = (new Date()).getTime();
      if (verbose.logQuery) console.log(`${params.action}:start`, query);
      modtask.connection.query(query, (err, data) => {
        if (verbose.logQuery) console.log(`${params.action}:finish`, (new Date()).getTime() - start);
        if (err) return $chain.chainReturnCB({ reason: JSON.stringify({
          code: err.code,
          errno: err.errno,
          errno: err.errno,
          errno: err.errno,
          sqlMessage: err.sqlMessage,
          sqlState: err.sqlState,
          sql: err.sql
        })});
        $chain.set('outcome', { success: true, data });
        cb();
      });
      return true;
  }
  return false;
}

modtask.extractPrefix = function(str) {
  var all = ['sql.'];
  for(var i=0; i < all.length; ++i) {
    var prefix = all[i];
    if (str.indexOf(prefix) == 0) {
      return str.substr(prefix.length);
    }
  }
  return str;
}