import { Session } from "./Session";

export class SessionStore
{
//    public  sessioncontents:any;
    public sessionMap:any={};

    public createSession():Session
    {
        let session=new Session();
        this.sessionMap[session.sessionid]=session;
        return session;
    }

    public removeSession(sessionid: number)
    {
        this.sessionMap[sessionid]=null;
    }

    public getSession(sessionid: any):Session
    {
        return this.sessionMap[sessionid];
    }

    public getWaitingClients():Session[]
    {
        let list:Session[]=[];

        for(let session of this.sessionMap)
        {
            if(session.agent.length==0)
            {
                list.push(session);
            }
        }

        return list;
    }
}

