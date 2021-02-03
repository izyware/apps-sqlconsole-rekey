var modtask = {};

modtask.encodeStringToSQLStrSingleQuoted = function(str) {
   str += '';
   return str.replace(/'/g, "''").replace(/\\/g, "\\\\");
}

modtask.formatKeyForSqlColumn = function(p1) {
   // This might be a non string (integer, etc.). convert to string to make sure that indexOf works
   p1 = p1 + '';
   if (p1.indexOf('NOQUOTE__') == 0) {
       p1 = p1.replace(/^NOQUOTE__/, '');
   } else {
       if (p1.indexOf('.') == -1) {
           p1 = '`' + p1 + '`';
       }
   }
   return p1;
}

modtask.formatValForSql = function(val) {
  // If NULL or UNDEFINED, return NULL for SQL
  if (val == null) {
    val = 'NULL';
  } else {
    // This might be a non string (integer, etc.). convert to string to make sure that indexOf works
    val = val + '';
    if (val.indexOf('NOQUOTE__') == 0)
        val = val.replace(/^NOQUOTE__/, '');
    else
        val = "'" + modtask.encodeStringToSQLStrSingleQuoted(val) + "'";
  }
   return val;
}

modtask.select2 = function(params, connection, cb) {
 params.dontAddAsToParams = true;
 var jsonKeyToSqlExpressionMap = params.map || {};
 var sqlExprToJsonKeyMap = {};

 // Is it an array?
 if (jsonKeyToSqlExpressionMap.length > 0) {
   sqlExprToJsonKeyMap = jsonKeyToSqlExpressionMap;
 } else {
   for (var p in jsonKeyToSqlExpressionMap) {
     sqlExprToJsonKeyMap[jsonKeyToSqlExpressionMap[p]] = p;
   }
 }
 params.map = sqlExprToJsonKeyMap;
 return modtask.select(params, connection, cb);
}

// params = { map: obj or array, condition: '...', from: ' tbl or join' } 
modtask.select = function(params, connection, cb) {
   var qryStr = '';
   var map = params.map || {};
   var dontAddAsToParams = params.dontAddAsToParams;

   // array? 
   if (typeof(map.length) == 'number') {
       var i, newmap = {};
       for (i = 0; i < map.length; ++i) {
           newmap[map[i]] = map[i];
       }
       map = newmap;
   }
   var fields = [];
   var fieldNames = [];
   var i = 0;
   for (p in map) {
       var p1 = modtask.formatKeyForSqlColumn(p);
       // todo: the as part needs to be removed so that dontAddAsToParams is always true
       // we are keeping this for now to workaround the silly HTTP backend
       if (dontAddAsToParams) {
         fields.push(p1);
       } else {
         fields.push(p1 + ' as ' + 'xxx' + i);
       }
       i++;
       fieldNames.push(map[p]);
   }

   if (fields.length == 0) {
       return cb({
           reason: 'params.map not specified or is empty. Please use an object or an array with at least 1 element. You may use NOQUOTE__ to stop enforcing the back qoutes in the select statement.'
       });
   }
   qryStr += 'select ';
   qryStr += fields.join(',' + Minicore.newLine) + Minicore.newLine;
   qryStr += params.from + Minicore.newLine;
   qryStr += params.condition + Minicore.newLine;
   // Do not put newLine at the begining because crudup won't be able to authorize 
   qryStr = qryStr + Minicore.newLine + Minicore.newLine;
   connection.query(qryStr, function(err, data, fields) {
      if (err) return cb({ 
        sql: qryStr, 
        reason: JSON.stringify({
          code: err.code,
          errno: err.errno,
          errno: err.errno,
          errno: err.errno,
          sqlMessage: err.sqlMessage,
          sqlState: err.sqlState,
          sql: err.sql
        })
      });
       var outcome = {
           success: true,
           data: [],
           sql: qryStr
       };
       var i, j;
       for (i = 0; i < data.length; ++i) {
           var row = data[i];
           var obj = {};
           for (j = 0; j < fields.length; ++j) {
               obj[fieldNames[j]] = row[fields[j].name];
           }
           outcome.data.push(obj);
       }
       return cb(outcome);
   });
}


modtask.getMysqlDateTimeValueInUTC = function(dateObject) {
  if (!dateObject) dateObject = new Date();

  function twoDigits(d) {
     if (0 <= d && d < 10) return "0" + d.toString();
     if (-10 < d && d < 0) return "-0" + (-1 * d).toString();
     return d.toString();
  }

  return dateObject.getUTCFullYear() + "-" + twoDigits(1 + dateObject.getUTCMonth()) + "-" + twoDigits(dateObject.getUTCDate()) + " " + twoDigits(dateObject.getUTCHours()) + ":" + twoDigits(dateObject.getUTCMinutes()) + ":" + twoDigits(dateObject.getUTCSeconds());
}

modtask.getUpdate = function(id, tbl, map) {
  var map;
  var p;
  var ret =  'update ' + tbl  +  ' set ';
  for(p in map) {
     ret += modtask.formatKeyForSqlColumn(p) + ' = ' + modtask.formatValForSql(map[p]) +  ',';
  }
  ret = ret.substr(0, ret.length-1);
  if (typeof(id) != "object")
     id = [id];
  ret += " where id in (" + id.join(",") + ")";
  // Do not put newLine at the begining because crudup won't be able to authorize 
  ret = ret + Minicore.newLine  + Minicore.newLine;
  return ret;    
};

modtask.getUpsert = function(tbl, maps) {
  return modtask.getInsert(tbl, maps, 'upsert');
}

modtask.nop = " select 1 ";

modtask.getInsert  = function(tbl, maps, operator) {
  if (!operator)
     operator = "insert";

  var upsert = false;
  if (operator == 'upsert') {
     operator = 'insert';
     upsert = true;
  }

  var i;
  var p;
  var fields = [], values = [];
  if (maps.length == 0)
     return modtask.nop ;


  var ret = "";

  var j; 
  var map;
  var val;
  for(j=0; j < maps.length; ++j) {
     map = maps[j];
     values = [];
     fields = [];
     for(p in map) {
       fields.push(p);
       values.push(modtask.formatValForSql(map[p]));
     } 
     ret += Minicore.newLine + 
        ("(" + values.join(",") + "),"); 
  }  
  ret =  ret.substr(0, ret.length-1);
  ret =  operator + " INTO " + tbl  +  " " +
     "(`" + fields.join("`,`")  + "`) " + 
       "  VALUES " + 
     ret;

  var j;
  if (upsert) {
     ret += ' ON DUPLICATE KEY UPDATE ';
     for(j=0; j < fields.length; ++j) {
        ret += '`' + fields[j] +'` = VALUES(`' + fields[j] + "`),"
     };
     ret = ret.substr(0, ret.length-1);
  }
  return { success: true, data: ret };     
}

modtask.getInsertSelect = function(params) {
 var qryStr = '';
 var map = Object.assign({}, params.map || {});

 // array?
 if (typeof(map.length) == 'number') {
   var i, newmap = {};
   for (i = 0; i < map.length; ++i) {
     newmap[map[i]] = map[i];
   }
   map = newmap;
 }

 var exactCopies = params.exactCopies || [];
 for (var i = 0; i < exactCopies.length; ++i) {
   map[exactCopies[i]] = 'NOQUOTE__' + exactCopies[i];
 }

 var fields = [];
 var values = [];
 for (p in map) {
   fields.push(modtask.formatKeyForSqlColumn(p));
   values.push(modtask.formatValForSql(map[p]));
 }

 qryStr += 'INSERT INTO ' + params.tbl + Minicore.newLine;
 qryStr += '(' + fields.join(',') + ') ' + Minicore.newLine;
 qryStr += 'SELECT ' + values.join(',') + Minicore.newLine;
 qryStr += 'FROM ' + params.from + ' ' + Minicore.newLine;
 qryStr += params.condition;
 return qryStr;
}

modtask.escapeRegexpCharsForSingleQoutedRegExpSearch = function(text) {
 // Mysql expects backslash to be double escaped or you will get 'trailing backslash (\)' from REGEXP
 text = text.replace(/\\/g, '\\\\');
 // $ sign https://stackoverflow.com/questions/43091621/mysql-regex-escape
 text = text.replace(/$/g, '');
 // we also need to escape paerns or we will get: 'parentheses not balanced' from regexp
 // even putting backslaches behind it wont fix it
 text = text.replace(/\(|\)/g, '');
 // The rest
 text = text.replace(/[+|-|?|*|(]/g, '\\\\$&');
 text = text.replace(/\[/g, '\\[');
 text = text.replace(/\]/g, '\\]');
 text = modtask.encodeStringToSQLStrSingleQuoted(text);
 return text;
}

// Deprecated: still some old pre 5.0 apps using this. Typical usage: deserializeGroupConcats(outcome.data, ['owners']);
modtask.deserializeGroupConcats = function(data, fields) {
 return modtask.deserializeGroupConcats2({ data: data }, fields).data;
}

// useful for parsing joined groups, i.e 'GROUP_CONCAT(DISTINCT CONCAT(accesscontrol.ownerType , "_", accesscontrol.ownerId) SEPARATOR "__sep__")': 'owners'
modtask.deserializeGroupConcats2 = function(_outcome, fields) {
 var seperator = '__sep__';
 var data = _outcome.data;
 function parseField(fieldStr) {
   var ret = [];
   if (fieldStr.indexOf(seperator) == -1)
     fieldStr = [fieldStr];
   else
     fieldStr = fieldStr.split(seperator);
   for (var j = 0; j < fieldStr.length; ++j) {
     ret.push(fieldStr[j]);
   }
   return ret;
 }
 var i;
 for (i = 0; i < data.length; ++i) {
   var item = data[i];
   for (var j = 0; j < fields.length; ++j) {
     var field = fields[j];
     if (!item[field] && item[field] != '') {
       _outcome.success = false;
       _outcome.reason = 'deserializeGroupConcats: "' + field + '" not defined for result set.';
       return ;
     }
     item[field] = parseField(item[field]);
   }
 }
 _outcome.success = true;
 _outcome.data = data;
 return _outcome;
}

modtask.getBySchema = function(keyPath, object, schema, valueWhenDoesntExistsInSchemaAndObject) {
 var p;
 var schemaMap = {};
 for(var i=0; i < schema.length; ++i) {
   var item = schema[i];
   schemaMap[item.key] = item;
 }

 var objectType = typeof(object[keyPath]);
 var schemaType = 'undefined';
 if (typeof(schemaMap[keyPath]) == 'object') {
   schemaType = schemaMap[keyPath].type;
 }
 if (schemaType == 'array') schemaType = 'object';
 if (schemaType == 'number' && objectType == 'string') {
   schemaType = 'string';
 }

 if (objectType == schemaType && objectType != 'undefined') {
   return object[keyPath];
 } else {
   // use the schema's default value if exists
   if (schemaType != 'undefined') {
     return schemaMap[keyPath].default;
   } else {
     return valueWhenDoesntExistsInSchemaAndObject;
   }
 }
}
