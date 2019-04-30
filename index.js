/**
 * index file for orm, this is where the auto generate methods should be to 
 * take the db structure and autogenerate some objects that extend table and 
 * and their rows as model files to be used in projects. Its meant to be a js way 
 * to interact with the database easier in applications. 
 */



//  basic idea usage

//  getting a user from the db by his id and return the 
//  first object from the list 
var currentUser = db.User.where({ userid: 7654 }).firstOrDefault();

// modify the object that was pulled 
currentUser.lastLogin = (new Date()).getTime();

// save any changes that were made 
db.User.saveChanges();


//  a new object can be added like so 
db.User.add(new UserModel("example@example.com","secretPassword"));

db.User.saveChanges();


// for retriving multiple object from the database 
//  an example of getting movies by name 
db.Movies.sortby("name").desc().first(100);
