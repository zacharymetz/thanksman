const DatabaseAbstract = require('./abstract/database').DatabaseAbstract;


async function test(){
    const db = await  DatabaseAbstract.create();
    
    //var currentUser = await db.User.where("userid = 1").firstOrDefault();
   // console.log(currentUser);
   // currentUser.password = "I have been changed lol";
   // currentUser.email = "I haol";
   // db.User.saveChanges()
    var allUsers = await db.User.toList();
   for(var i=0;i<allUsers.length;i++){
       allUsers[i].password = "noice " + i.toString();
   }
   db.User.saveChanges()
}

test()