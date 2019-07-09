const TableAbstract = require('./abstract').TableAbstract;
const  { Client } = require('pg');
/**
 * this is the actual database object 
 */
class Database{
  
  constructor(creds){
    //  hardcode for now 
    this.hostname = creds.hostname;
    this.username = creds.username;
    this.password = creds.password;
    this.databaseName = creds.databaseName;
    this.schema = creds.schema;
  }


  

  async initalize(){
  
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
      let newTable = false;
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
          constraint: null,
          references : {}
        });
        newTable = true;
      }
    }
    for(var i=0;i<column_schema.length;i++){
      
      //  now that we know if its added we need to determin the rules around te relation 
      //console.log(column_schema[i].column_name,column_schema[i].constraint_name,column_schema[i].unique_constraint_name)
      if(column_schema[i].constraint_name != null){
        
       
        //  if we land here this feild has some sort of contrtaint on it 
        let contraint = column_schema[i].constraint_name.split("_")
        //console.log(contraint)
        if(contraint[contraint.length -1] == "pkey"){
          //  this column is a primary key
          let col = columnInTable(tables[column_schema[i].table_name],column_schema[i].column_name);
          console.log("pk has been found", column_schema[i].column_name,contraint);
          col.is_primary_key = true;
          col.constraint = column_schema[i].constraint_name;
          col.is_foriegn_key = false;
        }else if(contraint[contraint.length -1] == "fkey"){
          console.log("fk has been found", column_schema[i].column_name,contraint,column_schema[i].unique_constraint_name);
          //  this column is a foriegn key so lets find the pk that 
          //  it goes along with and the table name so we can add it 
          //  to the references list 
          let col = columnInTable(tables[contraint[0]],contraint[1]);
          let refernce = {};
          //  this will get is the string name of the table that this relates too
          let masterTable = column_schema[i].unique_constraint_name.split("_")[0];

          //  now we need to add the table that it is referencing and what column 
          //  it is refernceing in the new table 
          refernce.table = masterTable;
          refernce.constraintColumn = column_schema[i].unique_constraint_name; // getPKForTable(masterTable)
          refernce.matchingColumn = column_schema[i].column_name;
          col.references = refernce;
          col.is_foriegn_key = true;
          //console.log(refernce);
        }else if(contraint[contraint.length -1] == "key"){
          //  this column is a key 

          //  we dont really care about that quite yet 
        }
      }
    }

    // now we ahve the tables lets make the  table objects and give them all the information 
    //  needed to manager themselvs 
    var tableNames = Object.keys(tables);
    //console.log(tableNames);
    
    
    
    
    
    //  HERE IS WHERE WE MNAKE THE ABSTRACT OBJECT 
    
    //  first we need to make the scemeas 
    //  this[schemaName] = {};
        // for each table we make a new table abstract 
        // this[schemaName][tableName] = new TableAbstract();
    
    //  now that the basic is set up we need to go through all of the relations 
    //  for each relation in relations 
        //  this[schemaName][relationHolder][relatingTableName] = () =>{
        //    return new Queryable(this[schemaName][relatingTableName]).contrainBy(this[schemaName][relationHolder]);
        //}
            //  this new function will have to be passed down to the the queryale the table abstract will create so that 
            //  it can be called anywhere 

  }
  
  static async create(creds) {
    const o = new Database(creds);
    await o.initalize();
    return o;
  }
}
exports.DatabaseAbstract = Database;






function columnInTable(table,column){
  //  if table is of type string then set table to the actual table 
  for(var col in table){
    col = table[col]
    if(col.column_name == column){
      return col;
    }
  }
  return false;
}



// Returns if a value is a string
function isString (value) {
  return typeof value === 'string' || value instanceof String;
  }
