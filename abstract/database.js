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
    this.schema = "";
    let pool = new Client({
      user: this.username,
      host: this.hostname,
      database: this.databaseName,
      password: this.password,
      port: 5432,
    });
    await pool.connect();
    
    //  now it will go and set up the tables 
    const column_schema_res = await pool.query("select INFORMATION_SCHEMA.COLUMNS.* ,INFORMATION_SCHEMA.constraint_column_usage.constraint_name, INFORMATION_SCHEMA.referential_constraints.unique_constraint_name from INFORMATION_SCHEMA.COLUMNS  left join INFORMATION_SCHEMA.constraint_column_usage on INFORMATION_SCHEMA.constraint_column_usage.table_name = INFORMATION_SCHEMA.COLUMNS.table_name and INFORMATION_SCHEMA.constraint_column_usage.column_name = INFORMATION_SCHEMA.COLUMNS.column_name left join INFORMATION_SCHEMA.referential_constraints on INFORMATION_SCHEMA.referential_constraints.constraint_name = INFORMATION_SCHEMA.constraint_column_usage.constraint_name where INFORMATION_SCHEMA.COLUMNS.table_catalog = '"+this.databaseName+"' and INFORMATION_SCHEMA.COLUMNS.table_schema in ('"+this.schema+"')",[]);
    const column_schema = column_schema_res.rows; 
    //  now we can pase out the response into seperate tables 
    pool.end();
    var tables ={};
    for(var i=0;i<column_schema.length;i++){
      if(tables[column_schema[i].table_name] == null){
        //  we need to make the first table and add the corisopnding column for it 
        tables[column_schema[i].table_name] = []
      }

      //  if the column does not exist then we can 
      if(!columnInTable(tables[column_schema[i].table_name],column_schema[i].column_name)){

      
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
          is_updatable: column_schema[i].is_updatable,
          /* these are the most inmporant feilds since its how we can relate on to another */
          is_primary_key : false,
          is_foriegn_key : false,
          references : null
        });
      }
      //  now that we know if its added we need to determin the rules around te relation 
      if(column_schema[i].constraint_name != null){
        
        //  if we land here this feild has some sort of contrtaint on it 
        let contraint = column_schema[i].constraint_name.split("_")
        //console.log(contraint)
        if(contraint[contraint.length -1] == "pkey"){
          //  this column is a primary key
          tables[column_schema[i].table_name][tables[column_schema[i].table_name].length - 1].is_primary_key = true;
        }else if(contraint[contraint.length -1] == "fkey"){
          //  this column is a foriegn key so lets find the pk that 
          //  it goes along with and the table name so we can add it 
          //  to the references list 
          let refernce = {};
          //  this will get is the string name of the table that this relates too
          let masterTable = column_schema[i].unique_constraint_name.split("_")[0];

          //  now we need to add the table that it is referencing and what column 
          //  it is refernceing in the new table 
          refernce.table = masterTable;
          refernce.constraintColumn = column_schema[i].unique_constraint_name; // getPKForTable(masterTable)
          
          tables[column_schema[i].table_name][tables[column_schema[i].table_name].length-1].references = refernce;
          tables[column_schema[i].table_name][tables[column_schema[i].table_name].length-1].is_foriegn_key = true;
          
        }else if(contraint[contraint.length -1] == "key"){
          //  this column is a key 

          //  we dont really care about that quite yet 
        }
      }
    }

    // now we ahve the tables lets make the  table objects and give them all the information 
    //  needed to manager themselvs 
    var tableNames = Object.keys(tables);
    console.log(tableNames);
    
    for(var i=0;i<tableNames.length;i++){
      var tableName = tableNames[i]

      this[tableName] = new TableAbstract(this,tableNames[i],this.schema,tables[tableNames[i]]);
    }

  }
  static async create() {
    const o = new Database();
    await o.initalize();
    return o;
  }
}
exports.DatabaseAbstract = Database;






function columnInTable(table,column){
  for(var col in table){
    if(col.column_name == column){
      return true;
    }
  }
  return false;
}