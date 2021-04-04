var modtask = function() {};
modtask.sessions = {};
modtask.connect = function(queryObject, cb) {
  var config = queryObject.config || {};
  var mysql = require('mysql');
  var connectionObj = mysql.createConnection(config);
  connectionObj.connect(function(err) {
    if (err) return cb({ reason: err.sqlMessage, errCode: err.errno });
    var sessionId = 'session.sql.' + Math.floor(Math.random() * (10000000000000)) + '.' + connectionObj.threadId;
    modtask.ldmod('kernel/mod').ldonce(modtask.__myname).sessions[sessionId] = connectionObj;
    var session = { sessionId: sessionId, config: config };
    return cb({ success: true, data: session });
  });
}

modtask.disconnect = function(queryObject, cb) {
  var session = queryObject.session || {};
  var sessionId = session.sessionId;
  if (!sessionId) return cb({ reason: 'invalid sessionId' });
  var connectionObj = modtask.ldmod('kernel/mod').ldonce(modtask.__myname).sessions[sessionId];
  if (!connectionObj) return cb({ reason: 'invalid connectionObj' });
  connectionObj.end(function(err) {
    if (err) return cb({ reason: err });
    delete modtask.ldmod('kernel/mod').ldonce(modtask.__myname).sessions[sessionId];
    return cb({ success: true });
  });
}

modtask.query = function(queryObject, cb) {
  var session = queryObject.session || {};
  var sessionId = session.sessionId;
  if (!sessionId) return cb({ reason: 'invalid sessionId' });
  var connectionObj = modtask.ldmod('kernel/mod').ldonce(modtask.__myname).sessions[sessionId];  
  if (!connectionObj) return cb({ reason: 'invalid connectionObj' });
  var queryStr = queryObject.queryStr;
  var recordFormat = queryObject.recordFormat;
  if (!recordFormat) recordFormat = 'json';
  connectionObj.query(queryStr, function(err, data, fields) {
    if (err) return cb({ reason: err.sqlMessage, errCode: err.errno });
    if (recordFormat == 'array') {
      var arr = [];
      for(var i=0; i < data.length; ++i) {
        arr.push([]);
        for(var j=0; j < fields.length; ++j) {
          arr[arr.length-1].push(data[i][fields[j].name]);
        }
      }
      data = arr;
    }
    cb({ success: true, data: data });
  });
} 
