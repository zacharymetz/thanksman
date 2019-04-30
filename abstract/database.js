const TableAbstract = require('abstract').TableAbstract;
const  { Client } = require('pg');
/**
 * this is the actual database object 
 */
class Database{
  
  constructor(){
    //  hardcode for now 
    this.hostname = "";
    this.username = "";
    this.password = "";
    this.databaseName = "";

    this.pool = new Client({
      user: user,
      host: host,
      database: database,
      password: password,
      port: 5432,
    });
    this.pool.connect();

    //  now it will go and set up the tables 
    column_schema_res = await pool.query("select * from INFORMATION_SCHEMA.COLUMNS where and table_catalog = $1",[]);
    column_schema = column_schema_res.rows; 
    //  now we can pase out the response into seperate tables 
    this.pool.close();
    var tables ={};
    for(var i=0;i<column_schema.length;i++){
      
    }

    // now we ahve the tables lets make the  table objects and give them all the information 
    //  needed to manager themselvs 
    var tableNames = Object.keys(tables);
    
    for(var i=0;i<tableNames.length;i++){
      this[tableNames[i]] = new TableAbstract(tableNames[i],tables[tableNames[i]]);
    }
  }
}