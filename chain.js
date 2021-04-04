
const modtask = (chainItem, cb, $chain) => {
  if (!modtask.__chainProcessorConfig) modtask.__chainProcessorConfig = {};
  const verbose =  modtask.__chainProcessorConfig.verbose || {};
  var i = 0;
  var params = {};
  params.action = modtask.extractPrefix(chainItem[i++]);
  switch (params.action) {
    case 'disconnect':
      var session = chainItem[i++];
      if (!session) session = $chain.get('sqlLastSession');
      if (!session) return $chain.chainReturnCB({ reason: 'Cannot find a session to run the query on' });
      if (verbose.logConnectionAttempt) console.log(session.sessionId + ' disconnect ');
      $chain.newChainForProcessor(modtask, cb, {}, [
        [session.adapterservice + '?disconnect', { session: session }],
        function(chain) {
          $chain.set('outcome', chain.get('outcome').data);
          cb();
        }
      ]);
      return true;
    case 'connect':
      var config = chainItem[i++] || {};
      var adapterservice = config.adapterservice;
      if (!adapterservice) adapterservice = '//inline/rel:adapter/mysql';
      var adapterconfig = config.adapterconfig;
      if (!adapterconfig) adapterconfig = config;
      if (verbose.logConnectionAttempt) console.log('Using adapter ', adapterservice, adapterconfig);
      $chain.newChainForProcessor(modtask, cb, {}, [
        [adapterservice + '?connect', { config: adapterconfig }],
        function(chain) {
          var session = chain.get('outcome').data;
          session.adapterservice = adapterservice;
          session.adapterconfig = adapterconfig;
          $chain.set('sqlLastSession', session);
          if (verbose.logConnectionAttempt) console.log(session.sessionId + ' connected ');
          $chain.set('outcome', { success: true, data: session });
          cb();
        }
      ]);
      return true;
    case 'query':
      var queryStr = chainItem[i++];
      var recordFormat = 'json';
      if (!queryStr) return $chain.chainReturnCB({ reason: 'please specify a query' });
      if (typeof(queryStr) == 'object') {
        recordFormat = queryStr.recordFormat;
        queryStr = queryStr.queryStr;
      };
      var session = chainItem[i++];
      if (!session) session = $chain.get('sqlLastSession');
      if (!session) return $chain.chainReturnCB({ reason: 'Cannot find a session to run the query on' });
      if (verbose.logQuery) console.log(session.sessionId + ' ' + queryStr);
      $chain.newChainForProcessor(modtask, cb, {}, [
        [session.adapterservice + '?query', { session: session, queryStr: queryStr, recordFormat: recordFormat }],
        function(chain) {
          if (verbose.logQuery) console.log(session.sessionId + ' endquery');
          $chain.set('outcome', chain.get('outcome'));
          cb();
        }
      ]);
      return true;
    case 'getInsert':
      var params = chainItem[i++] || {};
      $chain.set('outcome', modtask.ldmod('rel:q').getInsert(params.table, params.map, params.operator));
      cb();
      return true;
    case 'select':
      var queryObject = chainItem[i++] || {};
      var _verbose = queryObject.verbose || {};
      var session = chainItem[i++];
      if (!session) session = $chain.get('sqlLastSession');
      if (!session) return $chain.chainReturnCB({ reason: 'Cannot find a session' });
      modtask.ldmod('rel:q').select2(queryObject, $chain, session, function (outcome) {
        if (_verbose.logQuery) console.log('sql.query:', outcome.sql);
        if (!outcome.success) return $chain.chainReturnCB(outcome);
        if (queryObject.deserializeGroupConcats) {
          modtask.ldmod('rel:q').deserializeGroupConcats2(outcome, queryObject.deserializeGroupConcats);
          if (!outcome.success) return $chain.chainReturnCB(outcome);
        }
        $chain.set('outcome', outcome);
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
