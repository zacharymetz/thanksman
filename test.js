const DatabaseAbstract = require('./abstract/database').DatabaseAbstract;


async function test(){
    const db = await  DatabaseAbstract.create();
    console.log(db);

    console.log(db.User);
    var currentUser = await db.User.where("userid = 5").firstOrDefault();
}

test()