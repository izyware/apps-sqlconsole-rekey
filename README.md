# Izy SQL-Console ReKey Feature 

For command line access use:

    npm run query queryObject.dbConfigId xxxx-xxxx queryObject.sqlStr "SELECT 1"
    npm run rekey queryObject.dbConfigId xxxx-xxxx queryObject.batchTrackingTable batchTrackingTable_izyware_sqldashboard_rekey queryObject.limit 20000 queryObject.batchSize 20 queryObject.schema dbname queryObject.tbl tablename queryObject.commit false


# External Resources
* [github link]

# Changelog 

# V1
* add support for live JSON object config
   * enables direct launch from Proxy Projects
* improve formatting for output
* add query command
* changed lookupConfigFromFile to loadConfigJSONFromID

[github link]: https://github.com/izyware/apps-sqlconsole-rekey
