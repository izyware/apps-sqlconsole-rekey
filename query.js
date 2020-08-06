
const modtask = () => {};
modtask.verbose = {
  logConnectionAttemp: false,
  logQuery: false
};

modtask.sql = (queryObject, cb) => {
  const { dbConfigId, sqlStr } = queryObject;
  modtask.doChain([
    ['chain.importProcessor', 'chain', {
      verbose: modtask.verbose
    }],
    ['//inline/rel:json?loadById', { id: dbConfigId }],
    chain => chain(['sql.connect', chain.get('outcome').data]),
    ['sql.query', sqlStr],
    chain => {
      const { data } = chain.get('outcome');
      console.log(JSON.stringify(data, null, 2));
      chain(['sql.disconnect']);
    },
    chain => {
      chain(['outcome', { success: true }]);
    }
  ]);
};
