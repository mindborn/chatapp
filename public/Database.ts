var MongoClient = require('mongodb').MongoClient
    , assert = require('assert');

let database;
var url = 'mongodb://localhost:27017/mydb';

MongoClient.connect(url, { useNewUrlParser: true },  function (err, db) {
    assert.equal(null, err);
    console.log("Connected successfully to server");
    database = db.db('mydb');
});

export class Database
{
    public static async getAgentId(token: string): Promise<string>
    {
        let agentid:string=null;
        await database.collection('agentlogin').findOne({token:token},(err,doc)=>{
            console.log(err,doc);
            agentid=doc.Id;
        });

        return agentid;
    }
}

let id=Database.getAgentId("p7w5b5e7d8mlc8lml4vxsk");
console.log(id);