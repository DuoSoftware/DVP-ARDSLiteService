//var restClientHandler = require('./RestClient.js');

//restClientHandler.DoGet("http://localhost:2225", "/requestserver/get/1/3/1", function () {
//});

//var pd = "{\"Company\": 1,\"Tenant\": 3,\"Class\": \"TESTERVER\",\"Type\": \"ARDS\",\"Category\": \"CALL\",\"CallbackUrl\": \"http://localhost:5426/Callback\",\"ServerID\": 2}";
//restClientHandler.DoPost("http://localhost:2225/requestserver/add", JSON.parse(pd), function () {
//});

//var configHandler = require('./Config.json');
//console.log(configHandler.basicSelectionUrl);
//console.log("");
//var util = require('util');
//var key = "Resource:1:3:555555555";
//var lockKey = util.format('%s', key.split(":").join(""));
//console.log("key:: " + key);
//console.log("lockKey:: " + lockKey);

//var restify = require('restify');

//var server = restify.createServer({
//    name: 'Test2',
//    version: '1.0.0'
//});
//var internalserver = restify.createServer({
//    name: 'internalserverArdsServer',
//    version: '1.0.0'
//});
//server.use(restify.acceptParser(server.acceptable));
//server.use(restify.queryParser());
//server.use(restify.bodyParser());

//server.post('/callback/print', function (req, res, next) {
//    var resString = JSON.stringify(req.body);
//    console.log(resString);
//    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
//    res.end("true");
//    return next();
//});

//server.listen(2228, function () {
//    console.log('%s listening at %s', server.name, server.url);
//});


///Winston


//var winston = require('winston');
//var config = require('./Config.json');
//var fs = require('fs');

//var logger = module.exports = new (winston.Logger)({
//    transports: [
//        new (winston.transports.Console)({
//            colorize: 'all',
//            level:'debug'
//        })
//    ]
//});

//var logger = new (winston.Logger)({
//    transports: [
//        new (winston.transports.File)({
//            filename: config.winston.filename,
//            level: config.winston.level,
//            json: config.winston.json,
//            maxsize: config.winston.maxsize,
//            maxFiles: config.winston.maxFiles
//        })
//    ]
//});

//logger.log('debug', 'This is an information message.');
//logger.log('info', 'This is an information message.');
//logger.log('error', 'This is an information message.');
//logger.debug('HelloWorld');

//var logger = new (winston.Logger)({
//    transports: [
//        new (winston.transports.Console)({ raw: true }),
//    ]
//});

//logger.log('info', 'Hello, this is a raw logging event', { 'foo': 'bar' });
////logger.log('info', 'Hello, this is a raw logging event 2', { 'foo': 'bar' });

//var path = require('path');

//var filename1 = path.join('C:/IISLogs/Ards_v6/NodeJs/Init', 'log.duo');
//var filename2 = path.join('C:/IISLogs/Ards_v6/NodeJs/Cont', 'log.duo');

//
// Remove the file, ignoring any errors
//

//var result1 = fs.existsSync('C:/IISLogs/Ards_v6/NodeJs/Init');
//if (result1 == false) {
//    try {
//        var rrr = fs.mkdirSync('C:/IISLogs/Ards_v6/NodeJs/Init');
//    }
//    catch (ex) { 
//        console.log(ex);
//    }
//}

//var result2 = fs.existsSync('C:/IISLogs/Ards_v6/NodeJs/Cont');
//if (result2 == false) {
//    try { fs.mkdirSync('C:/IISLogs/Ards_v6/NodeJs/Cont'); }
//    catch (ex) { }
//}

//
// Create a new winston logger instance with two tranports: Console, and File
//
//
//var logger = new (winston.Logger)({
//    transports: [
//        new (winston.transports.Console)(),
//        new (winston.transports.File)({ name: 'Init-file', filename: filename1 }),
//        new (winston.transports.File)({ name: 'Cont-file', filename: filename2 })
//    ]
//});

//logger.

//logger.log('info', 'Hello created log files!', { 'foo': 'bar' });




//var infoLogger = require('./InformationLogger.js');

//infoLogger.log('debug', 'This is an information message.');
//infoLogger.log('info', 'This is an information message.');
//infoLogger.log('error', 'This is an information message.');
//infoLogger.debug('HelloWorld');


// var uuid = require('node-uuid');
// var util = require('util');
//
// var key = util.format('[%s]::[%s]', uuid.v1(), uuid.v1());
//
// console.log(key);

var request = require('./StartArds');
var async = require('async');
var uuid = require('uuid/v4');

var requestAdd = function () {

    try{

        var requestArray = [
            function (callback) {
                var session = uuid();

                var preRequest = {
                    Tenant: 1,
                    Company: 103,
                    ServerType:"CALLSERVER",
                    RequestType:"CALL",
                    SessionId:session,
                    Attributes:["61"],
                    RequestServerId:"1",
                    Priority:"0",
                    ResourceCount:1,
                    OtherInfo:""
                };

                request.AddRequest('Log:'+session, preRequest, function (err, replyObj, vid) {
                    callback(err, replyObj, vid);
                });
            },
            function (callback) {
                var session = uuid();

                var preRequest = {
                    Tenant: 1,
                    Company: 103,
                    ServerType:"CALLSERVER",
                    RequestType:"CALL",
                    SessionId:session,
                    Attributes:["61"],
                    RequestServerId:"1",
                    Priority:"0",
                    ResourceCount:1,
                    OtherInfo:""
                };

                request.AddRequest('Log:'+session, preRequest, function (err, replyObj, vid) {
                    callback(err, replyObj, vid);
                });
            },
            function (callback) {
                var session = uuid();

                var preRequest = {
                    Tenant: 1,
                    Company: 103,
                    ServerType:"CALLSERVER",
                    RequestType:"CALL",
                    SessionId:session,
                    Attributes:["61"],
                    RequestServerId:"1",
                    Priority:"0",
                    ResourceCount:1,
                    OtherInfo:""
                };

                request.AddRequest('Log:'+session, preRequest, function (err, replyObj, vid) {
                    callback(err, replyObj);
                });
            }
        ];

        async.parallel(requestArray, function (err, results) {

            if(err){
                console.log(err);
            }else {
                results.forEach(function (result) {

                    console.log(JSON.stringify(result.replyObj));

                });
            }

        });
        
        
    }catch (ex){

        console.log(ex);
    }

};

requestAdd();