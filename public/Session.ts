import { Member } from "./Member";
import { userInfo } from "os";

var database;
var MongoClient = require('mongodb').MongoClient
   , assert = require('assert');

// Connection URL
var url = 'mongodb://localhost:27017/mydb';

// Use connect method to connect to the server

function MongoDBOperation(f) {
   MongoClient.connect(url, { useNewUrlParser: true }, function (err, db) {
      assert.equal(null, err);
      console.log("Connected successfully to server");
      database = db.db('24Febdb');
      f(database);
      db.close();
   });
}


function MongoDBQuery(collection, query, f) {
   MongoDBOperation(function (database) {
      database.collection(collection).find(query).toArray().then(f);
   });
}
export class Session {
   static sessioncount: number = 0;

   public sessionid:number;
   public members:Member[]=[];  //agents
   public user:Member;
   public referred = false;

   constructor() {
      this.sessionid=++Session.sessioncount;
   }

   joinSession(member: Member): void {
      console.log("Before joining:" +this.sessionid);
      
      // member.activeClients();
      
      console.log("Member ID:"+member.id);
      console.log("After joining:" + this.sessionid);
   }
   leaveSession(member: Member): void {
      console.log("Before leaving:" + this.sessionid);
      // Session.sessionid--;
      console.log("After leaving:" + this.sessionid);
   }

   public sendMessage(message: Message) {
      console.log('sending message ',message);
      for (let m of this.members) {
         m.connection.sendUTF(JSON.stringify({command:'MESSAGE',sessionid:message.sessionid, from: message.from, text: message.text }));
      }
      if(this.user)
      {
         this.user.connection.sendUTF(JSON.stringify({command:'MESSAGE',sessionid:message.sessionid, from: message.from, text: message.text }));
      }
      var msg = {
         userid:this.user.id,
         time: (new Date()).getTime(),
         from: message.from,
         text: message.text
      }
      MongoDBOperation(function (database) {


         database.collection('messagesstored').insertOne(msg);
      });
   }


}
export class Message {
   sessionid: number;
   from:string;
   text:string;
   userid: string;
   static count = 0;
   constructor(sessionId: number) {
      this.sessionid = sessionId;
   }

   sendMessage(from, text): void {

      console.log("Session ID:" + this.sessionid);
      console.log("from:" + from);
      console.log("text:" + text);

      /* MongoDBOperation(function (database) {
         
          Message.count=database.collection('messagessent').count();
          
      });*/
      var msg = {
         count: Message.count,
         sessionId: this.sessionid,
         from: from,
         text: text
      }
      MongoDBOperation(function (database) {


         database.collection('messagessent').insertOne(msg);
      });

   }
   getNewMessages(): void {
      var newmsg = {
         sessionId: this.sessionid,
         lastmsgid: Message.count
      }
      //display the last message
      /*MongoDBQuery('messagessent', { count: Message.count }, (docs) => {
         console.log('docs', docs);
         console.log("docs lenth" + docs.length);
         if (docs.length > 0) {
             //console.log(docs.Id);
             for (var i = 0; i < docs.length; i++) {
                 //console.log("iteration " + i);
                 //console.log('ID:' + docs[i].Id);
                 var msgnew = docs[i].text;
                 console.log("Message" + msgnew);
                 //console.log(docs[i].title);
   
             }
         }
   
         
     });*/
      console.log("Last Msg:"+newmsg);

   }
   getHistory(fromindex, toindex): void {
      console.log("Session ID:" + this.sessionid);
      console.log("fromindex:" + fromindex);
      console.log("toindex:" + toindex);
      var history = {
         sessionId: this.sessionid,
         from: fromindex,
         to: toindex

      }
      //range from and to of messages display

   }
}
export class Agent {
   sessionid: number;
   constructor(sessionId: number) {
      this.sessionid = sessionId;
   }
   getWaitingClients(userID): void {
      //get waiting userID
      var waitingclient = {
         userID: userID,
         sessionId: this.sessionid
      }
      MongoDBOperation(function (database) {
         database.collection('waitingclient').insertOne(waitingclient);
      });

   }
   getActiveAgents(): void {
      //from login database

   }
   referTheAgents(by, to): void {

      var referals = {
         sessionid: this.sessionid,
         referredby: by,
         referredto: to

      }
      console.log(by);
      console.log(to);
      this.getReferals(by);
   }
   getReferals(by): void {
      //console.log("referals"+referal);
      console.log(this.sessionid + " " + by);
   }

}
//var obj = new Session();
//obj.joinSession(new Member());
//obj.leaveSession(new Member());

//var m = new Message(Session.sessionid);
//console.log(m.sendMessage("ID", "Hi"));
//console.log(m.sendMessage("ID", "bye"));
//console.log(m.getNewMessages());
//console.log(m.getHistory(0, 1));

//var a = new Agent(Session.sessionid);
//console.log(a.getWaitingClients(10));
//console.log(a.referTheAgents('1', '4'));
