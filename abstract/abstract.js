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
  
  constructor(database,name,schema,structure){
    this.database = database;
    //  so the structure is going to be how 
    //  a row object is going to be built 
    this.records = []; // the list of original records that 
    this.addedRecords = []; // a list of records to be added to the database 
    this.queryState = { //  the query state is what holds all of the modifications to the
        //  data pull and gets converted to sql when we want to get rows  
      sort : {  //  
          column : null,
          order : null
      },
      limit : 0,
      offset: 0,
      filters : [],
      joins : [],
      select : []
    };

    this.columns = structure;
    this.tableName = name;
    this.schema = schema;


  }
  /**
   * Pass differnt filters though it to add it to the 
   * resulting querey 
   * filter objects can be raw sql, filter objects and working on decoding functions / lambdas 
   */
   where(filterObject){
    if(typeof filterObject === 'string' || filterObject instanceof String){
      //  if the filter object is a striat up string we need to parse it into 
      //  a filter object so we should split it up by " "
      filterObject = filterObject.split(" ");
      for(var i=0;i<filterObject.length;i++){
        if(filterObject[i] == ""){
          //  remove it from the list if its blank 
          filterObject.splice( i, 1 );
        }
      }
      //  the second index is the operator so unless its between there should only be one 
      if(filterObject[1].toLowerCase() != "between"){
        //  there is only one value 
        this.queryState.filters.push({
          columnName : filterObject[0],
          operator : filterObject[1],
          value : filterObject[2]
        })
      }else{
        //  there is an upper and lower value instead of jsut value 
        this.queryState.filters.push({
          columnName : filterObject[0],
          operator : filterObject[1],
          lower_value : filterObject[2],
          upper_value : filterObject[4] //  skip one becasue of the and in the middle 
        })
      }
    }else if(filterObject && typeof filterObject === 'object' && filterObject.constructor === Object ){
      // we know it is a legitament object it will have the operator and value keys 
      if(filterObject.operator && filterObject.value){
        this.queryState.filters.push(filterObject)
      }else{
        //  else it is just a regular object so we need to contruct a simple = filter 
        
        //  since we do not have those in the filter object we are free to see what we do have
        let keys = Object.keys(filterObject);
        for(var i=0;i<keys.lastIndexOf;i++){
          //  for each key we have in the filter lets see if it is either a list or 
          //  a regular 
          if( filters[[keys[i]]] && typeof filters[[keys[i]]] === 'object' && filters[[keys[i]]].constructor === Array){
            // if its an array we need to make sure we do the in operator 
            this.queryState.filters.push({
              columnName : keys[i],
              operator : "in",
              value : filters[[keys[i]]],
              table : this.tableName
            })
          }else{
            //  it is a single value so just equals is good
            this.queryState.filters.push({
              columnName : keys[i],
              operator : "=",
              value : filters[[keys[i]]],
              table : this.tableName
            })
          }
        }
      }
      
    }else if(filterObject && {}.toString.call(filterObject) === '[object Function]'){
      //  if its a lambda function lets see if we can do some basic parsing 
          //  im guessing we can use the array here since it is kind of being passed though by the 
          //  function to check 
      // first we need to get the type of variable that it is 
      let parsed = this.parseLambdaFunction(filterObject);
      
      for(var i=0;i<parsed.length;i++){
        if(parsed[i] && typeof parsed[i] === 'object' ){
          this.queryState.filters.push(parsed[i]);
        }
      }

    }else{
      console.error("Invalid Filter object attempting to be applied");
    }
    return this;
  }

  /**
   * This function is pretty much a copy of where and takes in a grid filter (jsGrid for now)
   * and will apply it to the resulting query so a grid filter can just be passed through to it 
   * 
   * @param {*} gridFilter 
   */
  filter(gridFilter){
    if(gridFilter && typeof gridFilter === 'object' && gridFilter.constructor === Object){
      //  lets set the page index, sortField, sortOrder
      this.offset(gridFilter.pageIndex - 1);
      if(gridFilter.sortField){
        this.sortBy(gridFilter.sortField);
        //  set us to the 
        if(gridFilter.sortOrder == 'desc'){
          this.desc()
        }else{
          this.asc();
        }
      
      }
      
      //  remove these therr properties form the lsit 
      delete gridFilter.pageIndex;
      delete gridFilter.sortField;
      delete gridFilter.sortOrder;
      //  now loop through the rest 
      let keys = Object.keys(gridFilter);
      console.log('sort order keys ',keys);
      for(var i=0;i<keys.length;i++){
        if(gridFilter[keys[i]] != '' && keys[i] != "pageSize"){  //  do a check to see if there is anything to filter by
          //   get the type 
          console.log("asdasd")
            
          let dataType = this.getColumnInfo(keys[i]).dataType;
          if(dataType == 'text'){
            this.where({
              columnName : keys[i],
              operator : "like",
              value : gridFilter[[keys[i]]],
              table : this.tableName
            });
          }else{
            this.where({
              columnName : keys[i],
              operator : "=",
              value : gridFilter[[keys[i]]],
              table : this.tableName
            });
          }
        }
      }

    }else{
      console.error("Invalid Grid Filter object attempting to be applied");
    }
    return this;
  }

  join(tableToJoin,outerColumnName=null,innerColumnName=null){

  }
  innerJoin(tableToJoin,outerColumnName=null,innerColumnName=null){

  }
  outerJoin(){

  }
  /**
   * takes in a list of strings and only selects what you will pass through to it 
   * @param {*sring} toSelect 
   */
  select(toSelect){

  }

  /**
   * Parses a lambda function like x => x.id == 4 or x => x.id > 3 or x => array.includes(x.id) 
   * 
   * The parsing on supports on liners and not code blocks so no {}
   * 
   * Supported logical operations 
   *  == , !=  , > , < , >= , <= , includes
   *    as  well as support for  &&, || and () logical operators  
   */

  parseLambdaFunction(functionToParse){
    let operators = ["==" , "!="   , ">=" , "<=" , ">" , "<"];
    let methods = ["includes"];
    let logical = [")","(","&","|"];
    functionToParse = functionToParse.toString().replace(/ /g,'');
    //  the first thing we should do is seprate the left and right hand of the assignment 
    let leftHand = functionToParse.split("=>")[0];
    
    //  from here lets get rid of any white space and get the variable as a string 
    let parameter = leftHand.trim();

    //  now its time to takle the ever present threat of the left hand 
    let rightHand = functionToParse.split("=>")[1].trim();  // trim get rid of excess white space

    // start simple x => x.userid = 34
    let parsed_expression = [];
    let firstPeriod = rightHand.indexOf(".");
    let bracket = rightHand.indexOf("("); //  only check left cuz cant open with right 
    //  this loop will run until the function to parse is empty 
    
    while(rightHand != ""){
      console.log(rightHand)
      //  lets check to see if there is a ( , ), &&, ||  before anything else 
      if(logical.includes(rightHand.charAt(0)) ){
        let expression = rightHand.charAt(0);
        //  since we only check for the first chracter we need to add the extra bit 
        //  to avoid confusion later down the line 
        if(["&","|"].includes(expression)){
          expression = expression + expression;
        }
        parsed_expression.push(expression);
        
        //  now remove it form the original thing 
        rightHand = rightHand.substr(expression.length);
        
      }else{
        firstPeriod = rightHand.indexOf(".");
        if(firstPeriod > rightHand.indexOf(parameter)){
          let lowestIndex = rightHand.length;
          let operatorIndex = 0;
          for(var i=0;i<operators.length;i++){
            //console.log(rightHand);
            if(rightHand.indexOf(operators[i]) < lowestIndex && rightHand.indexOf(operators[i]) >= 0){
              lowestIndex = rightHand.indexOf(operators[i]);
              operatorIndex = i;
            }
          }
          //  is after the first parameter so it is a normal boolean opperation 
          
          
          let attibute = rightHand.substr(firstPeriod + 1, lowestIndex -2 );

          //  do a check to see if the attibute is in the table here
          
          //  remove the portion of the string 
          rightHand = rightHand.substr(lowestIndex).trim();

          //  after the attribute we wanna parse the operator and the value 
          let operator = rightHand.substr(0,operators[operatorIndex].length );
          // strip the operator 
          rightHand = rightHand.substr(operators[operatorIndex].length).trim();
          // need to find out where the value ends becasue not parsing it 
          let valueEndIndex = rightHand.length;
          for(var i=0;i<logical.length;i++){
            if( rightHand.indexOf(logical[i]) >= 0  && valueEndIndex > rightHand.indexOf(logical[i])){
              valueEndIndex = rightHand.indexOf(logical[i]);
            }
          }
          let value = rightHand.substring(0,valueEndIndex).trim();
          //  preform a catch to make sure we send back the correct 
          //  syntax to the db 
          if(operator == "=="){
            operator = "=";
          }else if(operator == "!="){
            operator = "<>";
          }

          parsed_expression.push({
            columnName : attibute,
            operator : operator,
            value : value
          })
          //console.log(parsed_expression)
          //  remove the value from the string
          console.log(rightHand)
          rightHand = rightHand.substring(value.toString().length)
          
        }else{
          //  if it lands here we know that the column is being compaired to an array or string so
          //  we should act acroding 

          //  we know where the period is so we should find out what operation is being performed 
          let lowestIndex = rightHand.length;
          let operatorIndex = 0;
          for(var i=0;i<methods.length;i++){
            if(rightHand.indexOf(methods[i]) < lowestIndex && rightHand.indexOf(methods[i]) >= 0){
              lowestIndex = rightHand.indexOf(methods[i]);
              operatorIndex = i;
            }
          }
          //  now that we have the correct operator and we can snag it out of the expression and
          //  get the important parts 

        }
      }
        //  if there is then we can add that operator to the pased expresion list 
        //  so we can go though it later and build more complex quries 
      
        //  if there is no one and we jsut jump strati into an expression and do the code we have bellow 
    }
    // now we are gonna build a loop 

    //  find the first . since it should either be x.asd or array.includes
    //  so we want to know if the first instance of x is before or after the first . 
    

    
    //  find the variable 

    //  figure out what is after the . 

    //  whats the operator (includes will be differnt)

    return parsed_expression

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
    this.queryState.order = "DESC";
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
    this.queryState.limit = n.toString();
    return this;
  }
  /**
   * off set the results by n rows  
   */
  offset(n){
    this.queryState.offset = n.toString();
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
  async saveChanges(){
    //for now just tell me the chagnes that have been made 
    for(var i=0;i<this.records.length;i++){
      let keys = Object.keys(this.records[i]);
      //  coppy the object 
      for(var j=0;j<keys.length;j++){
        if(this.records[i]["_original"][keys[j]] != this.records[i][keys[j]] && keys[j] != "_original"){
          console.log([keys[j]]," Has been changed from",this.records[i][keys[j]]," to  ",this.records[i]["_original"][keys[j]])
        }
      }
    }
  }

  /**
   * executs the internal query and returns the first object 
   * in the list, if there are no objects then it returns 
   * null 
   */
   async firstOrDefault(){
    var client = new Client({
      user: this.database.username,
      host: this.database.hostname,
      database: this.database.databaseName,
      password: this.database.password,
      port: 5432,
    });
    let query = this.generateSelectQuery();
    
    await client.connect()
    var res = await client.query(query.string, query.params);
    await client.end();
    //  after we preforema query we need to reset the query state 
    this.resetQueryState();
    // before returning them we need to save the "current state" of them in the db for update changes
    this.initalState(res.rows);
    
    return res.rows[0];
  }
  /**
   * this will also execute the qiery and return all the resultsing objects in a list 
   * if there are no objects then it will be an empty list 
   */
  async toList(){
    var client = new Client({
      user: this.database.username,
      host: this.database.hostname,
      database: this.database.databaseName,
      password: this.database.password,
      port: 5432,
    });
    let query = this.generateSelectQuery();
    console.log(query);
    await client.connect()
    var res = await client.query(query.string, query.params);
    await client.end();
    //  after we preforema query we need to reset the query state 
    
    this.resetQueryState();
    // before returning them we need to save the "current state" of them in the db for update changes
    this.initalState(res.rows);
    return res.rows;
  }
  /** 
   * executes the internal query with the limit set at n in a list of model objects 
   * multiple objects 
   */

  first(n){
    
  }


  /**
   * There are internal methods that are ment for executing the query and identifying
   * changes after the saveChanges() has been called 
   */
  generateSelectQuery(){
    //  should be a copy of query builder word for word 
    let query_string ='SELECT *  , count(*) OVER() AS itemsNumber From ' + this.schema + ".\"" + this.tableName + "\" " ;

    // need to see what to select and as what 
    if(this.queryState.select == []){
      //  if there is no things to select we will begin by adding a bunch of as to the qurey so that we can identify differnt column 
      //  and then when we get the objects we can parse out the idenifiers into actual objects and sub objects 
    }else{
      //  
    }

    let query_options = [];
    let andFlag = false; //if there is only one option no need for and
    let paramsCount = 0;

    //  this is where the join code goes 

    //  it looks at each column in the table and sees if there are any pk constraints and adds them to the join 
    
    let joinPortion = "    ";
    let has_joins = false;
    for(var i=0;i<this.columns.length;i++){
      let column = this.columns[i]
      console.log( column.column_name,column.is_foriegn_key,column.is_primary_key,column.references);
      if(column.is_foriegn_key){
        //  inner join asdfasdfasdf
        joinPortion += "  inner join  " + this.schema + ".\"" + column.references.table + "\"  on  ";
        //  on asd.asd = sdf.asd 
        joinPortion += this.schema + ".\"" + this.tableName + "\"." + column.column_name + " = " +
                      this.schema + ".\"" + column.references.table + "\"." + column.references.matchingColumn;
        has_joins = true;  
      }

    }
    //  now that we have all of the join columns its  time to add them to the
    //  query
    console.log(joinPortion)
    joinPortion += "    ";
    if(has_joins){
      query_string += joinPortion;
    }
    //console.log(joinPortion)
    // we need to add all the where statmetns here 
    if(this.queryState.filters.length > 0){
      let filter_string = " Where ";
    for(var i=0;i<this.queryState.filters.length;i++){
      if(andFlag){
        filter_string += " AND "
      }else{
        andFlag = true;
      }



      //  the structure of the filter object 

      //  standard one way operators 
      if(["=",">","<",">=","<=","<>"].includes(  this.queryState.filters[i].operator) ){
        //  lets get the column and see if its it indeed an fk 
        let column = this.getColumnInfo(this.queryState.filters[i].columnName);
        console.log(column)
        if(column && this.getColumnByConstraint(column.references.constraintColumn)){
          console.log(this.queryState.filters[i].columnName, "  is an fk")
        }

        //  TODO add in checks for differnt data types like string vs integers 
        query_options.push(this.queryState.filters[i].value);
        filter_string += "\"" + this.queryState.filters[i].table + "\"." + this.queryState.filters[i].columnName + "  " + this.queryState.filters[i].operator + "  $"+ query_options.length.toString() + "   ";
      // special case for between since it needs to have 2 vaiables 
      }else if(["between"].includes(this.queryState.filters[i].operator.toLowerCase())){
      
        filter_string;
      //  the in takes in a list of variables so have to handle that differently 
      }else if(["in"].includes(this.queryState.filters[i].operator.toLowerCase())){
        filter_string;
      }
    }
    query_string += filter_string;
    }
    
    console.log(this.queryState)
    // add the sort statements 
    if(this.queryState.sort){
      if(this.queryState.order){
         query_string += "ORDER BY " + this.schema +".\"" + this.tableName +"\"." + this.queryState.sort + " " + this.queryState.order + " ";
      }
    }

    // add the limit and offset statments here 
    if(this.queryState.limit){
      query_string += " LIMIT " + this.queryState.limit + " ";
    }

    if(this.queryState.offset){
      query_string += " OFFSET " + this.queryState.offset + " "
    }
    
    //  return on object with the built queries for 
    return {
      string : query_string,
      params : query_options
    }
  }
  generateInsertQuery(){

  }
  generateUpdateQuery(){

  }
  generateDeleteQuery(){

  }

  async getQueryResults(){
    var client = new Client({
      user: this.database.username,
      host: this.database.hostname,
      database: this.database.databaseName,
      password: this.database.password,
      port: 5432,
    });
    let query = this.generateSelectQuery();
    console.log(query);
    await client.connect()
    var res = await client.query(query.string, query.params);
    await client.end();
    return res.rows;
  }

  /**
   * These are suporting function that will help
   * in validating objects and column values 
   */

  /**
   * All this does is reset the query state for after each time we return an object or something so we
   * get a fresh start 
   */
  resetQueryState(){
    this.queryState = { //  the query state is what holds all of the modifications to the
      //  data pull and gets converted to sql when we want to get rows  
        sort : {  //  
            column : null,
            order : null
        },
        limit : 0,
        offset: 0,
        filters : []
      };
  }
  //  when we select from the database store the rows in here so that any changes made can be tracked with easy 
  initalState(rows){
    if(!(rows && typeof rows === 'object' && rows.constructor === Array)){
      console.error("You must pass an array of objects through");
      return;
    }
    for(var i=0;i<rows.length;i++){
      // it is a list of states 
      if(rows[i] && typeof rows[i] === 'object' && rows[i].constructor === Object){
        let keys = Object.keys(rows[i]);
        let record = {};
        //  coppy the object 
        for(var j=0;j<keys.length;j++){
          record[keys[j]] = rows[i][keys[j]]
        }
        //  now add the original row so we can reference it during the saveChanges()
        record["_original"] = rows[i]
        //  it is just one singular object 
        this.records.push(record)

      }else{
        console.error("Please Feed Me a valid state object or list of state objects")
      }
    }

    
    

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


