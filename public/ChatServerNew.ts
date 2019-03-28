import { SessionStore } from './sessionstore';
import { Member } from './Member';
import { Session, Message } from './Session';
let mongo = require('./MongoDB');

let Application;

let sessionStore = new SessionStore();

// sessionStore.createSession();
// sessionStore.createSession();

module.exports = function (app) {

    Application = app;

    // Optional. You will see this name in eg. 'ps' or 'top' command
    process.title = 'node-chat';
    // Port where we'll run the websocket server
    var webSocketsServerPort = 1337;
    // websocket and http servers
    var webSocketServer = require('websocket').server;
    var http = require('http');
    var express = require('express');
    var cookieParser = require('cookie-parser');
    /**
     * Global variables
     */
    // latest 100 messages
    var history = [];
    // list of currently connected clients (users)
    var clients = [];
    var agents = [];
    /**
     * Helper function for escaping input strings
     */
    function htmlEntities(str) {
        return String(str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    // Array with some colors
    var colors = ['red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange'];
    // ... in random order
    colors.sort(function (a, b) { return Math.random() > 0.5 ? 1 : -1; });
    /**
     * HTTP server
     */
    var server = http.createServer(function (request, response) {
        // Not important for us. We're writing WebSocket server,
        // not HTTP server
    });
    server.listen(webSocketsServerPort, function () {
        console.log((new Date()) + " Server is listening on port "
            + webSocketsServerPort);
    });
    /**
     * WebSocket server
     */
    var wsServer = new webSocketServer({
        // WebSocket server is tied to a HTTP server. WebSocket
        // request is just an enhanced HTTP request. For more info 
        // http://tools.ietf.org/html/rfc6455#page-6
        httpServer: server
    });
    // This callback function is called every time someone
    // tries to connect to the WebSocket server
    wsServer.on('request', (request) => {
        console.log((new Date()) + ' Connection from origin '
            + request.origin + '.');

        var connection = request.accept(null, request.origin);
    
        let userName = false;
        let token = false;
        let userType = false;
        console.log((new Date()) + ' Connection accepted.');

        connection.on('message', (message) => {
            console.log('onmessage:' + message.type + ":" + message.utf8Data);
            if (message.type === 'utf8') { // accept only text

                let requesttext = (message.utf8Data);

                let request = JSON.parse(requesttext);

                try {
                    switch (request.command) {
                        case 'LOGIN_AGENT': handleAgentLogin(connection, request); break;
                        case 'LOGIN_USER': handleUserLogin(connection, request); break;
                        case 'JOIN': handleJoin(connection, request); break;
                        case 'LEAVE': handleLeave(connection, request); break;
                        case 'MESSAGE': handleMessage(connection, request); break;
                        case 'HISTORY': handleHistory(connection,request);break; 
                    }
                }
                catch (e) {
                    console.log(e);
                }


            }
        });


        // user disconnected
        connection.on('close', function (connection) {
            if (userName !== false) {
                console.log((new Date()) + " Peer "
                    + connection.remoteAddress + " disconnected.");
            }
        });
    });
}

function handleAgentLogin(connection, request) {
    console.log("In handleAgentLogin");
    let token = request.token;
    console.log("Tokenval:"+token);
    mongo.MongoDBQuery('agentnewlogin', { token: token }, (docs) => {
        if (docs.length > 0) {
            connection['agentid'] = docs[0].Id;
            let Name=docs[0].Name;
            console.log("AgentID:"+docs[0].Id);
            console.log("AgentID:"+connection['agentid']);
            connection['usertype'] = 'AGENT';
            connection.sendUTF(JSON.stringify({ command: 'AGENT_LOGIN', status: 'success',Name:Name}));
        }
        else {
            connection.sendUTF(JSON.stringify({ command: 'AGENT_LOGIN', status: 'failed' }));
        }
    });
}

function handleUserLogin(connection, request) {
    console.log("In handleUserLogin");
    let token = request.token;
    console.log("tokenval:"+token);
    mongo.MongoDBQuery('usernewlogin', { token: token }, (docs) => {
        if (docs.length > 0) {
            console.log("docs in handle User Login:"+docs);
            let session = sessionStore.createSession();
            let m = new Member();
            m.connection = connection;
            m.type = 'USER';
            m.id = m.name = docs[0].Name;
            session.user = (m);
            console.log("m.name"+m.name);
            connection['usertype'] = 'USER';
            connection['usersession'] = session;
            connection.sendUTF(JSON.stringify({ command: 'USER_LOGIN', status: 'success', sessionid: session.sessionid,Name:m.name }));
        }
        else {
            connection.sendUTF(JSON.stringify({ command: 'USER_LOGIN', status: 'failed' }));
        }
    });
}

function handleJoin(connection, request) {
    console.log('handleJoin()');
    console.log(sessionStore.sessionMap);
    let count=connection['waitcount']||0;
    
    if(count>0)
    {
        count++;
        connection['waitcount']=count;
        connection.sendUTF(JSON.stringify({ command: 'JOIN', status: 'failed' }));
                
    }
    for (let sessionid in sessionStore.sessionMap) {
        var countval=0;
        let session = sessionStore.getSession(sessionid);
        console.log("Session:"+session);
        if(session.members)
        {
        if (session.members.length == 0) {
            console.log('found session to join', session);
            let m = new Member();
            m.id = m.name = connection['agentid'];
            m.type = 'AGENT';
            m.connection = connection;
            session.members.push(m);

            connection['waitcount']=Math.floor(Math.random()*4);
            console.log("Waitcount"+connection['waitcount']);
            connection['assigncount']=countval++;

            connection['waitcount']=0;
            var agentassigned=connection['assigncount'];
            if(!agentassigned)
            {
                agentassigned=0;
            }
            connection['assigncount']=agentassigned+1;
            connection.sendUTF(JSON.stringify({ command: 'JOIN', status: 'success', sessionid: session.sessionid }));
            return;
        }
    }
}
     
        
    
    connection.sendUTF(JSON.stringify({ command: 'JOIN', status: 'failed' }));
}

function handleLeave(connection, request) {
    if ('USER' === connection['usertype']) {
        let session: Session = connection['usersession'];
        for (let member of session.members) {
            member.connection.sendUTF(JSON.stringify({ command: 'DISCONNECT', sessionid: session.sessionid }));
        }
        sessionStore.removeSession(session.sessionid);
        connection.sendUTF(JSON.stringify({ command: 'LEAVE', status: 'success' }));
    }
    else if ('AGENT' === connection['usertype']) {
        let sessionid = request['sessionid'];
        let agentid = connection['agentid'];

        let session = sessionStore.getSession(sessionid);
        let index = -1;
        session.user.connection.sendUTF({command:'MESSAGE',from:'',text:'Agent is Offline'});
        for (let i = 0; i < session.members.length; i++) {
            if (session.members[i].id === agentid) {

                index = i;
                break;
            }
        }
        if (index >= 0) {
            session.members.splice(index, 1);
        }
        connection.sendUTF(JSON.stringify({ command: 'LEAVE', status: 'success' }));
    }
}

function handleMessage(connection, request) {
    let sessionid = request['sessionid'];
    let session = sessionStore.getSession(sessionid);

    let m = new Message(sessionid);
    m.text = request['text'];
    m.from = request['from'];
    if (session.user) {
        m.userid = session.user.id;
    }

    session.sendMessage(m);
}
function handleHistory(connection, request) {
    let userid = request.userid;
    console.log("Handle History userid:"+userid);
    mongo.MongoDBQuery('messagesstored', { userid:userid }, (docs) => {
        if (docs.length > 0) {

            connection.sendUTF(JSON.stringify({command:'HISTORY',status:'success',docs:docs}));

        }
    });
   
}