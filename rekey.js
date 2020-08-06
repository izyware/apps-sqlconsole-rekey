const modtask = () => {};
modtask.verbose = {
  logConnectionAttemp: false,
  logQuery: false
};

modtask.table = (queryObject, cb) => {
  const { schema, table, limit, batchSize, mode, dbConfigId } = queryObject;
  let { batchTrackingTable } = queryObject;
  if (!batchTrackingTable) batchTrackingTable = 'batchTrackingTable_izyware_sqldashboard_rekey';
  modtask.doChain([
    ['chain.importProcessor', 'chain', {
      verbose: modtask.verbose
    }],
    ['//inline/rel:json?loadById', { id: dbConfigId }],
    chain => chain(['sql.connect', chain.get('outcome').data]),
    ['//inline/?loopBatch', { mode, schema, table, limit, batchSize, batchTrackingTable }],
    chain => {
      const itemsProcessed = chain.get('outcome').data;
      console.log(itemsProcessed);
      chain(['sql.disconnect']);
    }
  ]);
};

modtask.loopBatch = (queryObject, cb) => {
  const { table, limit, mode, schema, batchTrackingTable } = queryObject;
  let { batchSize } = queryObject;
  let total = 0;
  if (batchSize*1 > limit*1) batchSize = limit;
  modtask.doChain([
    ['log', `processing table "${table}"`],
    ['//inline/rel:sqlschema?getFKs', { schema, table }],
    chain => {
      chain(['//inline/?processNextBatch', { mode, batchTrackingTable, table, batchSize, fks: chain.get('outcome').data }]);
    },
    chain => {
      const processed = chain.get('outcome').data;
      total += processed;
      if (processed == 0 || total > limit) return chain(
        [
          ['log', 'exitting loop'],
          ['outcome', { success: true, data: total}]
        ]);
      chain([
        ['log', `${total} of ${limit}`],
      ]);
    },
    ['replay']
  ]);
};

modtask.consolidateDbPackets = packets => {
  var fields = ['warningCount', 'changedRows'];
  var ret = {};
  packets.forEach(p => {
    fields.forEach(f => {
      if (p[f]) {
        if (!ret[f]) ret[f] = 0;
        ret[f] += p[f];
      }
    });
  });
  return ret;
}

modtask.processNextBatch = (queryObject, cb) => {
  const { table, batchSize, mode, batchTrackingTable } = queryObject;
  
  let { fks } = queryObject;
  const originalIds = [];
  const recordIds = [];
  const cmd = mode == 'commit' ? 'sql.query' : 'log';
  modtask.doChain([
    ['sql.query', `select recordid, originalId, newId from ${batchTrackingTable} where tbl = '${table}' and processed is null limit ${batchSize}`],
    chain => {
      const { data } = chain.get('outcome');
      if (!data.length) return chain(['outcome', { success: true, data: 0 }]);
      let str = ``;
      data.forEach(item => {
        originalIds.push(item.originalId);
        recordIds.push(item.recordid);
        str += ` WHEN ${item.originalId} THEN ${item.newId} `;
      });
      fks.push({ table, column: 'ID' });
      let sql = ``;
      sql += `start transaction;`;
      sql += `SET FOREIGN_KEY_CHECKS = 0;\n`;
      fks.forEach(fk => {
        sql += `UPDATE ${fk.table} SET ${fk.column} = (CASE ${fk.column} ${str} END) WHERE ${fk.column}  IN(${originalIds.join(',')});\n`;
      });
      sql += `SET FOREIGN_KEY_CHECKS = 1;`;
      sql += `commit;`
      chain([cmd, sql]);
    },
    chain => {
      if (mode == 'commit') {
        console.log(`changes batchSize: ${batchSize}`, JSON.stringify(fks), modtask.consolidateDbPackets(chain.get('outcome').data));
      }
      let sql = `UPDATE ${batchTrackingTable} set processed = UTC_TIMESTAMP WHERE recordid IN (${recordIds.join(',')})`;
      chain([cmd, sql]);
    },
    chain => {
      chain(['outcome', { success: true, data: recordIds.length }]);
    }
  ]);
}
