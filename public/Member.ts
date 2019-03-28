// import { Session } from "./Session";
// import {sessionStore} from "./sessionstore"

export class Member
{
    
    constructor() {

    }

    static count=0;
    private members = [];
    public connection:any;
    public id:string;
    public name:string;
    public type:string;
    
    // activeClients(): void {
    //     console.log("websoket:"+this.websocket);
    //     if(this.websocket!==undefined)
    //     {
    //         let sessionstore=new sessionStore(); 
    //         Member.count++;
    //         var session={
    //             count:Member.count,
    //             sessionid:sessionstore.createSession(),
    //             connection:this.websocket
    //         }
    //         this.members.push(session);
    //         for(var i=0;i<this.members.length;i++)
    //         {
    //         console.log(this.members[i]);
    //         }  
            
    //     }
    //  }
}