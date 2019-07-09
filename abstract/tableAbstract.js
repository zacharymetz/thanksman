const  { Client } = require('pg');


const Querable = require('./Queryable');
//  goal is to make it easy to pass a db row from the backend
//  to the front end and track changes between them more 
//  in the background 

//  all this does is represent a table in the database 
//  when extened into other classes it will be able to 
//  querey those tables from strait objects 

/**
 * Should have the ablility to know the table but has npt state inforamtion 
 */


class TableAbstract{
  
  constructor(database,name,schema,structure){
    this.database = database;
    

    this.columns = structure;
    this.tableName = name;
    this.schema = schema;


  }
  /**
   * All of the Queryable methods are pass thoughs to a new queryable object that 
   * will deal with all the state information 
   */
   where(filterObject){
    return new Queryable(this).where(filterObject);
  }

  /**
   * This function is pretty much a copy of where and takes in a grid filter (jsGrid for now)
   * and will apply it to the resulting query so a grid filter can just be passed through to it 
   * 
   * @param {*} gridFilter 
   */
  filter(gridFilter){
    return new Queryable(this).filter(gridFilter)
  }

  join(tableToJoin,outerColumnName=null,innerColumnName=null){
    return new Queryable(this).join();
  }
  innerJoin(tableToJoin,outerColumnName=null,innerColumnName=null){
    return new Queryable(this).innerJoin();
  }
  outerJoin(){
    return new Queryable(this).innerJoin();
  }
  /**
   * takes in a list of strings and only selects what you will pass through to it 
   * @param {*sring} toSelect 
   */
  select(toSelect){
    return new Queryable(this).select(toSelect);
  }

  
  /**
   * set the sort by of the query to the column
   */
  sortBy(columnName){
    return new Queryable(this).sortBy(columnName);
  }
  /**
   * make the query sort by the decending value 
   */
  desc(){
    return new Queryable(this).decs();
  }
  asc(){
    return new Queryable(this).asc();
  }
  
  /**
   * tells the db to limit the querey to n items 
   */
  limit(n){
    return new Queryable(this).limit(n)
  }
  /**
   * off set the results by n rows  
   */
  offset(n){
    return new Queryable(this).offset(n);
  }
  
   async firstOrDefault(){
    return new Queryable(this).firstOrDefault();
  }
  /**
   * this will also execute the qiery and return all the resultsing objects in a list 
   * if there are no objects then it will be an empty list 
   */
  async toList(){
   return new Queryable(this)
  }
  /** 
   * executes the internal query with the limit set at n in a list of model objects 
   * multiple objects 
   */

  first(n){
    return new Queryable(this).first(n);
  }


  
    
    

  



  /**
     * gets all of the infomration that a column by its string name 
     */
    getColumnInfo(columnName){
      for(var column in this.columns){
        if(column.column_name == columnName){
          return column;
        }
      }

      return null
    }

    getColumnByConstraint(constraintName){
      for(var column in this.columns){
        if(column.constraint == constraintName){
          return column;
        }
      }

      return null
    }



}
exports.TableAbstract = TableAbstract;
/**
 * This is the abstract class that will keep track of all the 
 * changes that a row goes through for the saveChagnes() 
 * function 
 */
class RowAbstract{

}
