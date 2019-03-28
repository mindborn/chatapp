"use strict";
exports.__esModule = true;
var Session_1 = require("./Session");
var SessionStore = /** @class */ (function () {
    function SessionStore() {
        //    public  sessioncontents:any;
        this.sessionMap = {};
    }
    SessionStore.prototype.createSession = function () {
        var session = new Session_1.Session();
        this.sessionMap[session.sessionid] = session;
        return session;
    };
    SessionStore.prototype.removeSession = function (sessionid) {
        this.sessionMap[sessionid] = null;
    };
    SessionStore.prototype.getSession = function (sessionid) {
        return this.sessionMap[sessionid];
    };
    SessionStore.prototype.getWaitingClients = function () {
        var list = [];
        for (var _i = 0, _a = this.sessionMap; _i < _a.length; _i++) {
            var session = _a[_i];
            if (session.agent.length == 0) {
                list.push(session);
            }
        }
        return list;
    };
    return SessionStore;
}());
exports.SessionStore = SessionStore;
