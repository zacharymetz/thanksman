const  { Client } = require('pg');

//  goal is to make it easy to pass a db row from the backend
//  to the front end and track changes between them more 
//  in the background 

//  all this does is represent a table in the database 
//  when extened into other classes it will be able to 
//  querey those tables from strait objects 

/**
 * pretty much this class is meant to represent the actuall table in the database.
 * It has its own internal state of the records its pulled to see if any have been added,
 * modified or deleted and reflect thoses changes in the database (imagine this as 
 * 'borrowing' certian records from the database and 'giving them back' when your done
 * with what ever modifications were made )
 */


class TableAbstract{
  #records = []; // the list of original records that 
  #addedRecords = []; // a list of records to be added to the database 
  #queryState = { //  the query state is what holds all of the modifications to the
                    //  data pull and gets converted to sql when we want to get rows  
                  sort : {  //  
                      column : null,
                      order : null
                  },
                  filters : [
                    {
                      columnName : "",
                      filter : "=",
                      value = "32"
                    }
                  ]

                };

  constructor(name,structure){
    //  so the structure is going to be how 
    //  a row object is going to be built 
    

  }
  /**
   * Pass differnt filters though it to add it to the 
   * resulting querey 
   */
  where(filterObject){
    return this;
  }
  /**
   * set the sort by of the query to the column
   */
  sortBy(columnName){
    this.queryState.sort = columnName;
    return this;
  }
  /**
   * make the query sort by the decending value 
   */
  desc(){
    this.queryState.sort = "DESC";
    return this;
  }
  asc(){
    this.queryState.order = "ASC";
    return this;
  }
  
  /**
   * tells the db to limit the querey to n items 
   */
  limit(n){
    return this;
  }
  /**
   * off set the results by n rows  
   */
  offset(n){
    return this;
  }
  /**
   * this will add a row to the table, however to commint the saveChanges must be called
   */
  add(row){

  }

  /**
   * sees if there are differnces in its own representation of what it pulled and what
   * is the current state and preform the nessisary actions on the changed rows 
   */
  saveChanges(){

  }

  /**
   * executs the internal query and returns the first object 
   * in the list, if there are no objects then it returns 
   * null 
   */
  firstOrDefault(){

  }
  /**
   * this will also execute the qiery and return all the resultsing objects in a list 
   * if there are no objects then it will be an empty list 
   */
  toList(){

  }
  /** 
   * executes the internal query with the limit set at n in a list of model objects 
   */
  first(n){
    
  
  }


  /**
   * There are internal methods that are ment for executing the query and identifying
   * changes after the saveChanges() has been called 
   */
  getQuery(){
    //  should be a copy of 
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


