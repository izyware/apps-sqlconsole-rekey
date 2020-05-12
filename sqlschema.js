const modtask = () => {};
modtask.getFKs = (queryObject, cb) => {
  const { table, schema } = queryObject;
  let { column } = queryObject;
  if (!column) column = 'id';
  modtask.doChain([
    ['sql.query', `SELECT
      TABLE_NAME \`table\`, COLUMN_NAME \`column\`
      FROM
      INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE
      REFERENCED_TABLE_SCHEMA = '${schema}' AND
      REFERENCED_TABLE_NAME = '${table}' AND
      REFERENCED_COLUMN_NAME = '${column}'
    `]
  ]);
};
