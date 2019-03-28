"use strict";
exports.__esModule = true;
var sessionstore_1 = require("./sessionstore");
var Member_1 = require("./Member");
var Session_1 = require("./Session");
var mongo = require('./MongoDB');
var Application;
var sessionStore = new sessionstore_1.SessionStore();
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
    wsServer.on('request', function (request) {
        console.log((new Date()) + ' Connection from origin '
            + request.origin + '.');
        var connection = request.accept(null, request.origin);
        var userName = false;
        var token = false;
        var userType = false;
        console.log((new Date()) + ' Connection accepted.');
        connection.on('message', function (message) {
            console.log('onmessage:' + message.type + ":" + message.utf8Data);
            if (message.type === 'utf8') { // accept only text
                var requesttext = htmlEntities(message.utf8Data);
                var request_1 = JSON.parse(requesttext);
                switch (request_1.command) {
                    case 'LOGIN_AGENT':
                        handleAgentLogin(connection, request_1);
                        break;
                    case 'LOGIN_USER':
                        handleUserLogin(connection, request_1);
                        break;
                    case 'JOIN':
                        handleJoin(connection, request_1);
                        break;
                    case 'LEAVE':
                        handleLeave(connection, request_1);
                        break;
                    case 'MESSAGE':
                        handleMessage(connection, request_1);
                        break;
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
};
function handleAgentLogin(connection, request) {
    var token = request.token;
    mongo.MongoDBQuery('agentlogin', { token: token }, function (docs) {
        if (docs.length > 0) {
            connection['agentid'] = docs[0].Id;
            connection['usertype'] = 'AGENT';
            connection.sendUTF(JSON.stringify({ command: 'AGENT_LOGIN', status: 'success' }));
        }
        else {
            connection.sendUTF(JSON.stringify({ command: 'AGENT_LOGIN', status: 'failed' }));
        }
    });
}
function handleUserLogin(connection, request) {
    var token = request.token;
    mongo.MongoDBQuery('userlogin', { token: token }, function (docs) {
        if (docs.length > 0) {
            var session = sessionStore.createSession();
            var m = new Member_1.Member();
            m.connection = connection;
            m.type = 'USER';
            m.id = m.name = docs[0].Client_ID;
            session.user = (m);
            connection['usertype'] = 'USER';
            connection['usersession'] = session;
            connection.sendUTF(JSON.stringify({ command: 'USER_LOGIN', status: 'success', sessionid: session.sessionid }));
        }
        else {
            connection.sendUTF(JSON.stringify({ command: 'USER_LOGIN', status: 'failed' }));
        }
    });
}
function handleJoin(connection, request) {
    for (var _i = 0, _a = sessionStore.sessionMap; _i < _a.length; _i++) {
        var sessionid = _a[_i];
        var session = sessionStore.getSession(sessionid);
        if (session.members.length == 0) {
            var m = new Member_1.Member();
            m.id = m.name = connection['agentid'];
            m.type = 'AGENT';
            session.members.push(m);
            connection.sendUTF(JSON.stringify({ command: 'JOIN', status: 'success', sessionid: session.sessionid }));
            return;
        }
    }
    connection.sendUTF(JSON.stringify({ command: 'JOIN', status: 'failed' }));
}
function handleLeave(connection, request) {
    if ('USER' === connection['usertype']) {
        var session = connection['currentsession'];
        for (var _i = 0, _a = session.members; _i < _a.length; _i++) {
            var member = _a[_i];
            member.connection.sendUTF(JSON.stringify({ command: 'DISCONNECT', sessionid: session.sessionid }));
        }
        sessionStore.removeSession(session.sessionid);
        connection.sendUTF(JSON.stringify({ command: 'LEAVE', status: 'success' }));
    }
    else if ('AGENT' === connection['usertype']) {
        var sessionid = request['sessionid'];
        var agentid = connection['agentid'];
        var session = sessionStore.getSession(sessionid);
        var index = -1;
        for (var i = 0; i < session.members.length; i++) {
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
    var sessionid = request['sessionid'];
    var session = sessionStore.getSession(sessionid);
    var m = new Session_1.Message(sessionid);
    m.text = request['text'];
    m.from = request['from'];
    m.userid = session.user.id;
    session.sendMessage(m);
}
