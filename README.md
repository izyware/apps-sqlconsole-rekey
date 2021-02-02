# Izy SQL-Console ReKey Feature 

Use the rekey command to reassign the primary key values for rows within a particular table in your relational database. The mapping for newIds and oldIds must be defined in `batchTrackingTable`.

The workflow consists of:
* for each row, create a record in `batchTrackingTable` with (originalId, newId, tbl) triplet set to the desired values
* run the rekey command

## Features
* The tool automatically builds the dependency graph for Primary and Foreign keys in the database and will update all the neccessary records automaticaly. 
* Record the timestamp for when the changes to rekeying are made: This will allow tracability and rollback


## CLI Schema

For command line access use:

    npm run query queryObject.dbConfigId xxxx-xxxx queryObject.sqlStr "SELECT 1"
    npm run rekey queryObject.dbConfigId xxxx-xxxx queryObject.batchTrackingTable batchTrackingTable_izyware_sqldashboard_rekey queryObject.limit 20000 queryObject.batchSize 20 queryObject.schema dbname queryObject.tbl tablename queryObject.commit false


# External Resources
* [github]
* [npmjs]

# Changelog 

# V1
* support `sql.select`
* support dynamic query generation for `sql.getInsert`.
* add index.js and expose basePath
    * cleaner syntax for referencing in chains by require
* add support for live JSON object config
   * enables direct launch from Proxy Projects
* improve formatting for output
* add query command
* changed lookupConfigFromFile to loadConfigJSONFromID

[github]: https://github.com/izyware/apps-sqlconsole-rekey
[npmjs]: https://www.npmjs.com/package/izyware-sqlconsole-rekey
