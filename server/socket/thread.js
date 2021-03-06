/**
 * Created by Andy on 2017/1/23.
 */
(function () {
    const WebSocket = require("./output.js");
    const tool = require("./tools.js");
    const clients = {};

    const namesMap = [];

    const remoteChanelMap = [];

    global.getChanelMap = function(){
        console.log(remoteChanelMap);
    };
    global.getClients = function(){
        console.log(clients);
    };
    global.getNamesMap = function(){
        console.log(namesMap);
    };

    //远程链接询问，把询问信息推给协助者
    WebSocket.prototype.remoteConnectAsk = function (data, socket) {
        var helper = clients[data.items.remoteUid.helperUid];
        this.send(
            0x02,
            {
                remoteUid: {
                    askerUid: data.items.remoteUid.askerUid,
                    helperUid: data.items.remoteUid.helperUid
                },
                RMTResponse: data.items.RMTResponse
            },
            helper
        );
    };

    WebSocket.prototype.remoteConnectAccept = function (data, socket) {
        var that = this;
        var askerUid = data.items.remoteUid.askerUid;
        var helperUid = data.items.remoteUid.helperUid;

        //存储远程业务中的两端，主要用于在用户未注册的时候，一口气把所有通道发给前端，让前端自己处理
        remoteChanelMap.push({askerUid: askerUid, helperUid: helperUid});

        //通知所有的用户哪两个用户正在进行远程业务
        namesMap.forEach(function (item) {
            if (askerUid == item || helperUid == item)return;
            that.send(0x06,
                {
                    remoteUid: {
                        askerUid: askerUid,
                        helperUid: helperUid
                    }
                },
                clients[item]
            );
        });

        var asker = clients[askerUid];
        var helper = clients[helperUid];

        that.send(0x03, {remoteRole: 1}, asker);
        that.send(0x03, {remoteRole: 2}, helper);
    };

    //远程链接,把应答消息推给询问者
    WebSocket.prototype.remoteConnectReject = function (data, socket) {
        var asker = clients[data.items.remoteUid.askerUid];
        this.send(
            0x04,
            {},
            asker
        );
    };

    //开始远程交互
    WebSocket.prototype.RMTInterActive = function (data) {
        var that = this;

        var asker = clients[data.items.remoteUid.askerUid];
        var helper = clients[data.items.remoteUid.helperUid];
        if (data.items.activeData.remoteRole == 1) {
            that.send(0x05, data.items.activeData, helper);
        }
        else if (data.items.activeData.remoteRole == 2) {
            that.send(0x05, data.items.activeData, asker);
        }
    };

    //用户关闭socket链接
    WebSocket.prototype.close = function (data, socket) {
        this.reduceUserName(data, socket);
        if(data.items.remoteRole != 0)this.disconnectChanel(data, socket);
    };

    WebSocket.prototype.disconnectChanel = function (data, socket) {
        //如果是协助者的断开讯号,
        var that = this;

        var askerUid = data.items.remoteUid.askerUid;
        var helperUid = data.items.remoteUid.helperUid;

        //通知所有的用户哪两个用户结束远程业务
        namesMap.forEach(function (item) {
            if (askerUid == item || helperUid == item)return;
            that.send(0x07,
                {
                    remoteUid: {
                        askerUid: askerUid,
                        helperUid: helperUid
                    }
                },
                clients[item]
            );
        });

        remoteChanelMap.forEach(function (item, index) {
            //不确定请求者或者协助者哪个断开连接，所以两个都要判断
            if (item.askerUid === askerUid || item.helperUid === helperUid) {
                remoteChanelMap.splice(index, 1);
            }
        });

        //通知远程业务中的两方
        if (data.items.remoteRole == 1) {
            var helper = clients[helperUid];
            that.send(0xFF, {remoteChanelMap: remoteChanelMap}, helper);
        } else if (data.items.remoteRole == 2) {
            var asker = clients[askerUid];
            that.send(0xFF, {remoteChanelMap: remoteChanelMap}, asker);
        }
    };

    //通知前端删除断开的用户
    WebSocket.prototype.reduceUserName = function (data, socket) {
        var that = this;

        socket.destroy();   //删除断线的session，

        if (data.uid) {
            delete clients[data.uid];

            //删除断线的用户名，
            var index = namesMap.indexOf(data.uid);
            namesMap.splice(index, 1);
        }

        //刷新用户列表到客户端
        namesMap.forEach(function (item, index) {
            that.send(0xFE, {deadUid: data.uid}, clients[item]);
        });
    };

    //绑定用户信息
    WebSocket.prototype.distributeUid = function (data, socket) {
        var that = this;
        socket.uid = data.uid;

        if (namesMap.indexOf(data.uid) < 0) {
            namesMap.push(data.uid);
        }

        clients[data.uid] = socket;

        //向所有的用户推送用户名
        namesMap.forEach(function (item, index) {
            that.send(0x01, {namesMap: JSON.stringify(namesMap)}, clients[item]);
        });
    };

    WebSocket.prototype.pushNameMap = function (data, socket) {
        var that = this;
        that.send(0x00, {remoteChanelMap: remoteChanelMap,namesMap: JSON.stringify(namesMap)}, socket);
    };



    module.exports = WebSocket;

})();