var modtask = function() {};
modtask.sessions = {};
modtask.connect = function(queryObject, cb) {
  var config = queryObject.config || {};
  var sessionId = 'session.sql.' + Math.floor(Math.random() * (10000000000000)) + '.' + 'test';
  modtask.ldmod('kernel/mod').ldonce(modtask.__myname).sessions[sessionId] = {};
  var session = { sessionId: sessionId, config: config };
  return cb({ success: true, data: session });
}

modtask.disconnect = function(queryObject, cb) {
  var session = queryObject.session || {};
  var sessionId = session.sessionId;
  if (!sessionId) return cb({ reason: 'invalid sessionId' });
  delete modtask.ldmod('kernel/mod').ldonce(modtask.__myname).sessions[sessionId];
  return cb({ success: true });
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

  var data = [{ id: 1 }];
  var fields = [{ name: 'id' }];
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
} 
