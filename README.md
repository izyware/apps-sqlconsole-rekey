# Izy SQL-Console Connector
This package is the main SQL service consumption layer for Izyware apps. It is written in JavaScript, does not require compiling. 

## Features
* Use the rekey command to reassign the primry key values for rows within a particular table in your relational database. The mapping for newIds and oldIds must be defined in `batchTrackingTable`. The workflow consists of:
    * for each row, create a record in `batchTrackingTable` with (originalId, newId, tbl) triplet set to the desired values
    * run the rekey command
    * The feature automatically builds the dependency graph for Primary and Foreign keys in the database and will update all the neccessary records automaticaly. 
* Record the timestamp for when the changes to rekeying are made: This will allow tracability and rollback
* supports stringified cross platform command pattern chains to simplify components that need to delegate, sequence or execute database interactions in hetergenous cloud environment. In addition, this allows bookkeeping and auditing to be conveniently performed transparently.
* escapes and cleans up parameters. This will protect your components against SQL injection attacks.

## Establishing connections
The library is compatible with standard mysql node configuration files, i.e.:

    const sqlLib = require('izyware-sqlconsole-rekey').basePath;
    const proxyLib = require('izy-proxy').basePath;
    
    ['chain.importProcessor', `${sqlLib}/chain`, {
        verbose: {
            logConnectionAttempt: false,
            logQuery: false
        }
    }],
    [`//inline/${proxyLib}/json?loadById`, { id:
        {
          "host":"example.org"
        }
    }],
    chain => chain(['sql.connect', chain.get('outcome').data]),
    ['sql.query', 'select 1']
    
You can consult the nodejs mysql library for detailed options regarding connection pooling, clustering and SSL management. In addition to all the standard options the library supports custom adapters fot SOCKS5. 

    [`//inline/${proxyLib}/json?loadById`, { id:
        {
          "adapterservice":"//service/rel:adapter/socks5"
        }
    }]

For embedded applications that require unusual networking environments, you may customize the adapter. Refer to the knowledge center on Izyware website for more details and white papers on this topic.

## Commands Syntax
* getUpdate
* getInsert

        ['sql.getInsert', {
            table: 'table1',
            map: [
                { field1: 'value1', ... }
            ]
        ]
        
* getInsertSelect
* select

        ['sql.select', {
            verbose: {
                logQuery: false
            },
            map: {
                jsonField1: 'table1.field1',
                owners: 'NOQUOTE__GROUP_CONCAT(DISTINCT CONCAT(accesscontrol.ownerType , "_", accesscontrol.ownerId) SEPARATOR "__sep__")'
            },
            // // useful for parsing joined groups, i.e owners above
            deserializeGroupConcats: ['owners'],
            from: 'FROM table1 left join table2 ....',
            condition: 'WHERE id = 1 limit 1 group by name'
        }]

* query (if chain verbose.logQuery is set it will log)

        /* returns JSON records */
        ['sql.query', 'string'], 
        /* returns Array records */
        ['sql.query', { queryStr: 'select 1', recordFormat: 'array' }]
        



## CLI Schema

For command line access use:

    npm run query queryObject.dbConfigId xxxx-xxxx queryObject.sqlStr "SELECT 1"
    npm run rekey queryObject.dbConfigId xxxx-xxxx queryObject.batchTrackingTable batchTrackingTable_izyware_sqldashboard_rekey queryObject.limit 20000 queryObject.batchSize 20 queryObject.schema dbname queryObject.tbl tablename queryObject.commit false

# Test

    npm run test

# Known Issues
* support for `?` characters as placeholders for values you would like to have escaped.
* implement chain handlers for
    * escapeRegexpCharsForSingleQoutedRegExpSearch
    * encodeStringToSQLStrSingleQuoted

# Notes
* make sure that `NO_BACKSLASH_ESCAPES` mode is disabled (this is the default state for MySQL servers).


# External Resources
* [github]
* [npmjs]

# Changelog 

# V1
* 5300033: add command line test interface
* 5300032: seperate the mysql adapter from the chain processor
    * enables merging this with frame_getnode and replacing the legacy interface
    * essential for mixed embedded app development
* convert JSON null and undefined values to SQL NULL
* refactor code and remove dead code. Add more documentation.
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