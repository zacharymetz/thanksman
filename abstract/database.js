const TableAbstract = require('./abstract').TableAbstract;
const  { Client } = require('pg');
/**
 * this is the actual database object 
 */
class Database{
  
  constructor(){
    //  hardcode for now 
    
    
  }


  

  async initalize(){
    this.hostname = "";
    this.username = "";
    this.password = "";
    this.databaseName = "";
    let pool = new Client({
      user: this.username,
      host: this.hostname,
      database: this.databaseName,
      password: this.password,
      port: 5432,
    });
    await pool.connect();
    
    //  now it will go and set up the tables 
    const column_schema_res = await pool.query("select * from INFORMATION_SCHEMA.COLUMNS where table_catalog = 'test' and table_schema in ('public')",[]);
    const column_schema = column_schema_res.rows; 
    //  now we can pase out the response into seperate tables 
    pool.end();
    var tables ={};
    for(var i=0;i<column_schema.length;i++){
      if(tables[column_schema[i].table_name] == null){
        //  we need to make the first table and add the corisopnding column for it 
        tables[column_schema[i].table_name] = []
      }
      tables[column_schema[i].table_name].push({
        //  this is what the column object will look like
        column_name : column_schema[i].column_name,
        column_default : column_schema[i].column_default,
        ordinal_position: column_schema[i].ordinal_position,
        is_nullable: column_schema[i].is_nullable,
        data_type : column_schema[i].data_type,
        character_maximum_length: column_schema[i].character_maximum_length,
        character_octet_length: column_schema[i].character_octet_length,
        numeric_precision: column_schema[i].numeric_precision,
        numeric_precision_radix: column_schema[i].numeric_precision_radix,
        numeric_scale: column_schema[i].numeric_scale,
        datetime_precision: column_schema[i].datetime_precision,
        interval_type: column_schema[i].interval_type,
        interval_precision: column_schema[i].interval_precision,
        is_updatable: column_schema[i].is_updatable
      });
    }

    // now we ahve the tables lets make the  table objects and give them all the information 
    //  needed to manager themselvs 
    var tableNames = Object.keys(tables);
    console.log(tableNames);
    
    for(var i=0;i<tableNames.length;i++){
      var tableName = tableNames[i]

      console.log(tableName);
      this[tableName] = new TableAbstract(this,tableNames[i],'public',tables[tableNames[i]]);
    }

  }
  static async create() {
    const o = new Database();
    await o.initalize();
    return o;
  }
}
exports.DatabaseAbstract = Database;