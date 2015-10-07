var restify = require('restify');
var redisHandler = require('DVP-ARDSCommon/RedisHandler.js');
var util = require('util');
var resourceHandler = require('DVP-ARDSCommon/ResourceHandler.js');
var requestHandler = require('DVP-ARDSCommon/RequestHandler.js');
var reqServerHandler = require('DVP-ARDSCommon/ReqServerHandler.js');
var reqMetaHandler = require('DVP-ARDSCommon/ReqMetaDataHandler.js');
var reqQueueHandler = require('DVP-ARDSCommon/ReqQueueHandler.js');
var continueArdsHandler = require('./ContinueArdsProcess.js');
var infoLogger = require('DVP-ARDSCommon/InformationLogger.js');
var resStateMapper = require('DVP-ARDSCommon/ResourceStateMapper.js');
var authHandler = require('DVP-ARDSCommon/Authorization.js');
var uuid = require('node-uuid');
var startArds = require('./StartArds.js');
var config = require('config');
var messageFormatter = require('DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');

var server = restify.createServer({
    name: 'ArdsServer',
    version: '1.0.0'
});

restify.CORS.ALLOW_HEADERS.push('authorization');
server.use(restify.CORS());
server.use(restify.fullResponse());
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

var hostIp = config.Host.Ip;
var hostPort = config.Host.Port;
var hostVersion = config.Host.Version;

server.post('/DVP/API/' + hostVersion + '/ARDS/requestserver', function (req, res, next) {
    try {
        authHandler.ValidateAuthToken(req.header('authorization'), function (company, tenant) {
            req.body.Company = parseInt(company);
            req.body.Tenant = parseInt(tenant);
            
            var objkey = util.format('ReqServer:%d:%d:%s', company, tenant, req.body.ServerID);
            var logkey = util.format('[%s]::[%s]', uuid.v1(), objkey);
            
            infoLogger.ReqResLogger.log('info', '%s --------------------------------------------------', logkey);
            infoLogger.ReqResLogger.log('info', '%s Start- requestserver/add #', logkey, { request: req.body });
            
            reqServerHandler.AddRequestServer(logkey, req.body, function (err, result) {
                if (err) {
                    infoLogger.ReqResLogger.log('info', '%s End- requestserver/add :: Result: %s #', logkey, 'false', { request: req.body });
                    infoLogger.ReqResLogger.log('error', '%s End- requestserver/add :: Error: %s #', logkey, err, { request: req.body });
                    
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
                else if (result === "OK") {
                    infoLogger.ReqResLogger.log('info', '%s End- requestserver/add :: Result: %s #', logkey, 'true', { request: req.body });
                    
                    var jsonString = messageFormatter.FormatMessage(err, "Add request server success", true, undefined);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
                else {
                    infoLogger.ReqResLogger.log('info', '%s End- requestserver/add :: Result: %s #', logkey, 'false', { request: req.body });
                    
                    var jsonString = messageFormatter.FormatMessage(err, "Add request server filed", false, undefined);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
            });
        });
    } catch (ex) {
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, undefined);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(jsonString);
    }

    return next();
});

server.put('/DVP/API/' + hostVersion + '/ARDS/requestserver', function (req, res, next) {
    try {
        authHandler.ValidateAuthToken(req.header('authorization'), function (company, tenant) {
            req.body.Company = parseInt(company);
            req.body.Tenant = parseInt(tenant);
            
            var objkey = util.format('ReqServer:%d:%d:%s', req.body.Company, req.body.Tenant, req.body.ServerID);
            var logkey = util.format('[%s]::[%s]', uuid.v1(), objkey);
            
            infoLogger.ReqResLogger.log('info', '%s --------------------------------------------------', logkey);
            infoLogger.ReqResLogger.log('info', '%s Start- requestserver/set #', logkey, { request: req.body });
            reqServerHandler.SetRequestServer(logkey, req.body, function (err, result) {
                if (err) {
                    infoLogger.ReqResLogger.log('info', '%s End- requestserver/set :: Result: %s #', logkey, 'false', { request: req.body });
                    infoLogger.ReqResLogger.log('error', '%s End- requestserver/set :: Error: %s #', logkey, err, { request: req.body });
                    
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
                else if (result === "OK") {
                    infoLogger.ReqResLogger.log('info', '%s End- requestserver/set :: Result: %s #', logkey, 'true', { request: req.body });

                    var jsonString = messageFormatter.FormatMessage(err, "Update request server success", true, undefined);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
                else {
                    infoLogger.ReqResLogger.log('info', '%s End- requestserver/set :: Result: %s #', logkey, 'false', { request: req.body });
                    
                    var jsonString = messageFormatter.FormatMessage(err, "Update request server failed", false, undefined);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
            });
        });
    } catch(ex1) {
        var jsonString = messageFormatter.FormatMessage(ex1, "ERROR", false, undefined);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(jsonString);
    }
    return next();
});

server.get('/DVP/API/' + hostVersion + '/ARDS/requestservers/:class/:type/:category', function (req, res, next) {
    try {
        authHandler.ValidateAuthToken(req.header('authorization'), function (company, tenant) {
            
            var logkey = util.format('[%s]::requestserver-searchbytag', uuid.v1());
            infoLogger.ReqResLogger.log('info', '%s --------------------------------------------------', logkey);
            infoLogger.ReqResLogger.log('info', '%s Start- requestserver/searchbytag #', logkey, { request: req.params });
            
            var data = req.params;
            var tags = ["company_*", "tenant_*", "class_" + data["class"], "type_" + data["type"], "category_" + data["category"]];
            reqServerHandler.SearchReqServerByTags(logkey, tags, function (err, result) {
                if (err != null) {
                    infoLogger.ReqResLogger.log('error', '%s End- requestserver/searchbytag :: Error: %s #', logkey, err, { request: req.params });
                    
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
                else {
                    infoLogger.ReqResLogger.log('info', '%s End- requestserver/searchbytag :: Result: %j #', logkey, result, { request: req.params });
                    
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    var jsonString = messageFormatter.FormatMessage(err, "get request servers success", true, result);
                    res.end(jsonString);
                }
            });
        });
    } catch (ex2) {
        var jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(jsonString);
    }
    return next();
});

server.get('/DVP/API/' + hostVersion + '/ARDS/requestserver/:serverid', function (req, res, next) {
    try {
        authHandler.ValidateAuthToken(req.header('authorization'), function (company, tenant) {
            
            var data = req.params;
            var objkey = util.format('ReqServer:%s:%s:%s', company, tenant, data["serverid"]);
            var logkey = util.format('[%s]::[%s]', uuid.v1(), objkey);
            
            infoLogger.ReqResLogger.log('info', '%s --------------------------------------------------', logkey);
            infoLogger.ReqResLogger.log('info', '%s Start- requestserver/get #', logkey, { request: req.params });
            reqServerHandler.GetRequestServer(logkey, company, tenant, data["serverid"], function (err, result) {
                if (err) {
                    infoLogger.ReqResLogger.log('error', '%s End- requestserver/get :: Error: %s #', logkey, err, { request: req.params });
                    
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
                else {
                    infoLogger.ReqResLogger.log('info', '%s End- requestserver/get :: Result: %s #', logkey, result, { request: req.params });
                    
                    var jsonString = messageFormatter.FormatMessage(err, "get request server success", true, result);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
            });
        });
    } catch (ex2) {
        var jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(jsonString);
    }
    return next();
});

server.del('/DVP/API/' + hostVersion + '/ARDS/requestserver/:serverid', function (req, res, next) {
    try {
        authHandler.ValidateAuthToken(req.header('authorization'), function (company, tenant) {
            
            var data = req.params;
            var objkey = util.format('ReqServer:%s:%s:%s', company, tenant, data["serverid"]);
            var logkey = util.format('[%s]::[%s]', uuid.v1(), objkey);
            
            infoLogger.ReqResLogger.log('info', '%s --------------------------------------------------', logkey);
            infoLogger.ReqResLogger.log('info', '%s Start- requestserver/remove #', logkey, { request: req.params });
            
            reqServerHandler.RemoveRequestServer(logkey, company, tenant, data["serverid"], function (err, result) {
                if (err) {
                    infoLogger.ReqResLogger.log('error', '%s End- requestserver/remove :: Error: %s #', logkey, err, { request: req.params });
                    
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
                else {
                    infoLogger.ReqResLogger.log('info', '%s End- requestserver/remove :: Result: %s #', logkey, result, { request: req.params });
                    
                    var jsonString = messageFormatter.FormatMessage(err, "delete requesr server success", true, undefined);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(result);
                }
            });
        });
    } catch (ex2) {
        var jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(jsonString);
    }
    return next();
});


server.post('/DVP/API/' + hostVersion + '/ARDS/requestmeta', function (req, res, next) {
    try {
        authHandler.ValidateAuthToken(req.header('authorization'), function (company, tenant) {
            req.body.Company = parseInt(company);
            req.body.Tenant = parseInt(tenant);
            
            var objkey = util.format('ReqMETA:%d:%d:%s:%s:%s', req.body.Company, req.body.Tenant, req.body.Class, req.body.Type, req.body.Category);
            var logkey = util.format('[%s]::[%s]', uuid.v1(), objkey);
            
            infoLogger.ReqResLogger.log('info', '%s --------------------------------------------------', logkey);
            infoLogger.ReqResLogger.log('info', '%s Start- requestmeta/add #', logkey, { request: req.body });
            reqMetaHandler.AddMeataData(logkey, req.body, function (err, result) {
                if (err) {
                    infoLogger.ReqResLogger.log('info', '%s End- requestmeta/add :: Result: %s #', logkey, 'false', { request: req.body });
                    infoLogger.ReqResLogger.log('error', '%s End- requestmeta/add :: Error: %s #', logkey, err, { request: req.body });
                    
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
                else if (result === "OK") {
                    infoLogger.ReqResLogger.log('info', '%s End- requestmeta/add :: Result: %s #', logkey, 'true', { request: req.body });
                    
                    var jsonString = messageFormatter.FormatMessage(err, "add request metadata success", true, undefined);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
                else {
                    infoLogger.ReqResLogger.log('info', '%s End- requestmeta/add :: Result: %s #', logkey, 'false', { request: req.body });
                    
                    var jsonString = messageFormatter.FormatMessage(err, "add request metadata failed", false, undefined);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
            });
        });
    } catch (ex2) {
        var jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(jsonString);
    }
    return next();
});

server.put('/DVP/API/' + hostVersion + '/ARDS/requestmeta', function (req, res, next) {
    try {
        authHandler.ValidateAuthToken(req.header('authorization'), function (company, tenant) {
            req.body.Company = parseInt(company);
            req.body.Tenant = parseInt(tenant);
            
            var objkey = util.format('ReqMETA:%d:%d:%s:%s:%s', req.body.Company, req.body.Tenant, req.body.Class, req.body.Type, req.body.Category);
            var logkey = util.format('[%s]::[%s]', uuid.v1(), objkey);
            
            infoLogger.ReqResLogger.log('info', '%s --------------------------------------------------', logkey);
            infoLogger.ReqResLogger.log('info', '%s Start- requestmeta/set #', logkey, { request: req.body });
            reqMetaHandler.SetMeataData(logkey, req.body, function (err, result) {
                if (err) {
                    infoLogger.ReqResLogger.log('info', '%s End- requestmeta/set :: Result: %s #', logkey, 'false', { request: req.body });
                    infoLogger.ReqResLogger.log('error', '%s End- requestmeta/set :: Error: %s #', logkey, err, { request: req.body });
                    
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
                else if (result === "OK") {
                    infoLogger.ReqResLogger.log('info', '%s End- requestmeta/set :: Result: %s #', logkey, 'true', { request: req.body });
                    
                    var jsonString = messageFormatter.FormatMessage(err, "update request metadata success", true, undefined);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
                else {
                    infoLogger.ReqResLogger.log('info', '%s End- requestmeta/set :: Result: %s #', logkey, result, { request: req.body });
                    
                    var jsonString = messageFormatter.FormatMessage(err, "update request metadata failed", false, undefined);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
            });
        });
    } catch (ex2) {
        var jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(jsonString);
    }
    return next();
});

server.get('/DVP/API/' + hostVersion + '/ARDS/requestmeta/:class/:type/:category', function (req, res, next) {
    try {
        authHandler.ValidateAuthToken(req.header('authorization'), function (company, tenant) {
            
            var data = req.params;
            var objkey = util.format('ReqMETA:%s:%s:%s:%s:%s', company, tenant, data["class"], data["type"], data["category"]);
            var logkey = util.format('[%s]::[%s]', uuid.v1(), objkey);
            
            infoLogger.ReqResLogger.log('info', '%s --------------------------------------------------', logkey);
            infoLogger.ReqResLogger.log('info', '%s Start- requestmeta/get #', logkey, { request: req.params });
            reqMetaHandler.GetMeataData(logkey, company, tenant, data["class"], data["type"], data["category"], function (err, result) {
                if (err) {
                    infoLogger.ReqResLogger.log('error', '%s End- requestmeta/get :: Error: %s #', logkey, err, { request: req.params });
                    
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
                else {
                    infoLogger.ReqResLogger.log('info', '%s End- requestmeta/get :: Result: %s #', logkey, result, { request: req.params });
                    
                    var jsonString = messageFormatter.FormatMessage(err, "get request metadata success", true, result);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
            });
        });
    } catch (ex2) {
        var jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(jsonString);
    }
    return next();
});

server.del('/DVP/API/' + hostVersion + '/ARDS/requestmeta/:class/:type/:category', function (req, res, next) {
    try {
        authHandler.ValidateAuthToken(req.header('authorization'), function (company, tenant) {
            
            var data = req.params;
            var objkey = util.format('ReqMETA:%s:%s:%s:%s:%s', company, tenant, data["class"], data["type"], data["category"]);
            var logkey = util.format('[%s]::[%s]', uuid.v1(), objkey);
            
            infoLogger.ReqResLogger.log('info', '%s --------------------------------------------------', logkey);
            infoLogger.ReqResLogger.log('info', '%s Start- requestmeta/remove #', logkey, { request: req.params });
            reqMetaHandler.RemoveMeataData(logkey, company, tenant, data["class"], data["type"], data["category"], function (err, result) {
                if (err) {
                    infoLogger.ReqResLogger.log('error', '%s End- requestmeta/remove :: Error: %s #', logkey, err, { request: req.params });
                    
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
                else {
                    infoLogger.ReqResLogger.log('info', '%s End- requestmeta/remove :: Result: %s #', logkey, result, { request: req.params });
                    
                    var jsonString = messageFormatter.FormatMessage(err, "delete request metadata success", true, undefined);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
            });
        });
    } catch (ex2) {
        var jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(jsonString);
    }
    return next();
});


server.post('/DVP/API/' + hostVersion + '/ARDS/resource', function (req, res, next) {
    try {
        authHandler.ValidateAuthToken(req.header('authorization'), function (company, tenant) {
            req.body.Company = parseInt(company);
            req.body.Tenant = parseInt(tenant);
            
            var objkey = util.format('Resource:%d:%d:%s', req.body.Company, req.body.Tenant, req.body.ResourceId);
            var logkey = util.format('[%s]::[%s]', uuid.v1(), objkey);
            
            infoLogger.ReqResLogger.log('info', '%s --------------------------------------------------', logkey);
            infoLogger.ReqResLogger.log('info', '%s Start- resource/add #', logkey, { request: req.body });
            resourceHandler.AddResource(logkey, req.body, function (err, result, vid) {
                if (err) {
                    infoLogger.ReqResLogger.log('info', '%s End- resource/add :: Result: %s #', logkey, 'false', { request: req.body });
                    infoLogger.ReqResLogger.log('error', '%s End- resource/add :: Error: %s #', logkey, err, { request: req.body });
                    
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
                else if (result === "OK") {
                    infoLogger.ReqResLogger.log('info', '%s End- resource/add :: Result: %s #', logkey, 'true', { request: req.body });
                    
                    var jsonString = messageFormatter.FormatMessage(err, "add resource info success", true, undefined);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
                else {
                    infoLogger.ReqResLogger.log('info', '%s End- resource/add :: Result: %s #', logkey, 'false', { request: req.body });
                    
                    var jsonString = messageFormatter.FormatMessage(err, "add resource info failed", false, undefined);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
            });
        });
    } catch (ex2) {
        var jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(jsonString);
    }
    return next();
});

server.put('/DVP/API/' + hostVersion + '/ARDS/resource', function (req, res, next) {
    try {
        authHandler.ValidateAuthToken(req.header('authorization'), function (company, tenant) {
            req.body.Company = parseInt(company);
            req.body.Tenant = parseInt(tenant);
            
            var objkey = util.format('Resource:%d:%d:%s', req.body.Company, req.body.Tenant, req.body.ResourceId);
            var logkey = util.format('[%s]::[%s]', uuid.v1(), objkey);
            
            infoLogger.ReqResLogger.log('info', '%s --------------------------------------------------', logkey);
            infoLogger.ReqResLogger.log('info', '%s Start- resource/set #', logkey, { request: req.body });
            resourceHandler.SetResource(logkey, req.body.ResourceData, req.body.CVid, function (err, result, vid) {
                if (err) {
                    infoLogger.ReqResLogger.log('info', '%s End- resource/set :: Result: %s #', logkey, 'false', { request: req.body });
                    infoLogger.ReqResLogger.log('error', '%s End- resource/set :: Error: %s #', logkey, err, { request: req.body });
                    
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
                else if (result === "OK") {
                    infoLogger.ReqResLogger.log('info', '%s End- resource/set :: Result: %s #', logkey, 'true', { request: req.body });
                    
                    var jsonString = messageFormatter.FormatMessage(err, "update resource info success", true, undefined);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
                else {
                    infoLogger.ReqResLogger.log('info', '%s End- resource/set :: Result: %s #', logkey, result, { request: req.body });
                    
                    var jsonString = messageFormatter.FormatMessage(err, "update resource info failed", false, undefined);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
            });
        });
    } catch (ex2) {
        var jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(jsonString);
    }
    return next();
});

server.get('/DVP/API/' + hostVersion + '/ARDS/resource/:class/:type/:category', function (req, res, next) {
    try {
        authHandler.ValidateAuthToken(req.header('authorization'), function (company, tenant) {
            
            var logkey = util.format('[%s::resource-searchbytag]', uuid.v1());
            
            infoLogger.ReqResLogger.log('info', '%s --------------------------------------------------', logkey);
            infoLogger.ReqResLogger.log('info', '%s Start- resource/searchbytag #', logkey);
            var data = req.params;
            var tags = ["company_" + company, "tenant_" + tenant, "class_" + data["class"], "type_" + data["type"], "category_" + data["category"]];
            
            resourceHandler.SearchResourcebyTags(logkey, tags, function (err, result) {
                if (err != null) {
                    infoLogger.ReqResLogger.log('error', '%s End- resource/searchbytag :: Error: %s #', logkey, err);
                    
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
                else {
                    infoLogger.ReqResLogger.log('info', '%s End- resource/searchbytag :: Result: %j #', logkey, result);

                    var jsonString = messageFormatter.FormatMessage(err, "get resource info success", true, result);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
            });
        });
    } catch (ex2) {
        var jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(jsonString);
    }
    return next();
});

server.get('/DVP/API/' + hostVersion + '/ARDS/resource/:resourceid', function (req, res, next) {
    try {
        authHandler.ValidateAuthToken(req.header('authorization'), function (company, tenant) {
            
            var data = req.params;
            var objkey = util.format('Resource:%s:%s:%s', company, tenant, data["resourceid"]);
            var logkey = util.format('[%s]::[%s]', uuid.v1(), objkey);
            
            infoLogger.ReqResLogger.log('info', '%s --------------------------------------------------', logkey);
            infoLogger.ReqResLogger.log('info', '%s Start- resource/get #', logkey, { request: req.params });
            resourceHandler.GetResource(logkey, company, tenant, data["resourceid"], function (err, result, vid) {
                if (err) {
                    infoLogger.ReqResLogger.log('error', '%s End- resource/get :: Error: %s #', logkey, err, { request: req.params });
                    
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
                else {
                    infoLogger.ReqResLogger.log('info', '%s End- resource/get :: Result: %s :: Vid: %d #', logkey, result, vid, { request: req.params });
                    var resData = { obj: JSON.parse(result), vid: vid };
                    
                    var jsonString = messageFormatter.FormatMessage(err, "get resource info success", true, resData);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
            });
        });
    } catch (ex2) {
        var jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(jsonString);
    }
    return next();
});

server.del('/DVP/API/' + hostVersion + '/ARDS/resource/:resourceid', function (req, res, next) {
    try {
        authHandler.ValidateAuthToken(req.header('authorization'), function (company, tenant) {
            
            var data = req.params;
            var objkey = util.format('Resource:%s:%s:%s', company, tenant, data["resourceid"]);
            var logkey = util.format('[%s]::[%s]', uuid.v1(), objkey);
            
            infoLogger.ReqResLogger.log('info', '%s --------------------------------------------------', logkey);
            infoLogger.ReqResLogger.log('info', '%s Start- resource/remove #', logkey, { request: req.params });
            
            resourceHandler.RemoveResource(logkey, company, tenant, data["resourceid"], function (err, result) {
                if (err) {
                    infoLogger.ReqResLogger.log('error', '%s End- resource/remove :: Error: %s #', logkey, err, { request: req.params });
                    
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
                else {
                    infoLogger.ReqResLogger.log('info', '%s End- resource/remove :: Result: %s #', logkey, result, { request: req.params });
                    
                    var jsonString = messageFormatter.FormatMessage(err, "delete resource info success", true, undefined);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
            });
        });
    
    } catch (ex2) {
        var jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(jsonString);
    }
    return next();
});

server.put('/DVP/API/' + hostVersion + '/ARDS/resource/:resourceid/concurrencyslot', function (req, res, next) {
    try {
        authHandler.ValidateAuthToken(req.header('authorization'), function (company, tenant) {
            req.body.Company = parseInt(company);
            req.body.Tenant = parseInt(tenant);
            
            var objkey = util.format('Resource:%d:%d:%s', req.body.Company, req.body.Tenant, req.params["resourceid"]);
            var logkey = util.format('[%s]::[%s]', uuid.v1(), objkey);
            
            infoLogger.ReqResLogger.log('info', '%s --------------------------------------------------', logkey);
            infoLogger.ReqResLogger.log('info', '%s Start- resource/cs/update #', logkey, { request: req.body });
            switch (req.body.State) {
                case "Available":
                    resourceHandler.UpdateSlotStateAvailable(logkey, req.body.Company, req.body.Tenant, req.body.Category, req.params["resourceid"], req.body.SlotId, req.body.OtherInfo, function (err, result) {
                        if (err != null) {
                            infoLogger.ReqResLogger.log('error', '%s End- resource/cs/update :: Error: %s #', logkey, err, { request: req.body });
                            
                            var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                            res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                            res.end(jsonString);
                        }
                        else {
                            infoLogger.ReqResLogger.log('info', '%s End- resource/cs/update :: Result: %j #', logkey, result, { request: req.body });
                            
                            var jsonString = messageFormatter.FormatMessage(err, "update concurrency slot state success", true, undefined);
                            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                            res.end(jsonString);
                        }
                    });
                    break;

                case "Reserved":
                    resourceHandler.UpdateSlotStateReserved(logkey, req.body.Company, req.body.Tenant, req.body.Category, req.body.ResourceId, req.body.SlotId, req.body.SessionId, req.body.MaxReservedTime, req.body.OtherInfo, function (err, result) {
                        if (err != null) {
                            infoLogger.ReqResLogger.log('error', '%s End- resource/cs/update :: Error: %s #', logkey, err, { request: req.body });
                            
                            var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                            res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                            res.end(jsonString);
                        }
                        else {
                            infoLogger.ReqResLogger.log('info', '%s End- resource/cs/update :: Result: %j #', logkey, result, { request: req.body });
                            
                            var jsonString = messageFormatter.FormatMessage(err, "update concurrency slot state success", true, undefined);
                            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                            res.end(jsonString);
                        }
                    });
                    break;
        
                case "Connected":
                    resourceHandler.UpdateSlotStateConnected(logkey, req.body.Company, req.body.Tenant, req.body.Category, req.body.ResourceId, req.body.SlotId, req.body.SessionId, req.body.OtherInfo, function (err, result) {
                        if (err != null) {
                            infoLogger.ReqResLogger.log('error', 'End- resource/cs/update :: Error: %s #', err, { request: req.body });
                            
                            var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                            res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                            res.end(jsonString);
                        }
                        else {
                            infoLogger.ReqResLogger.log('info', 'End- resource/cs/update :: Result: %j #', result, { request: req.body });
                            
                            var jsonString = messageFormatter.FormatMessage(err, "update concurrency slot state success", true, undefined);
                            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                            res.end(jsonString);
                        }
                    });
                    break;
            }
        });
    } catch (ex2) {
        var jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(jsonString);
    }
    return next();
});

server.put('/DVP/API/' + hostVersion + '/ARDS/resource/:resourceid/concurrencyslot/session/:sessionid', function (req, res, next) {
    try {
        authHandler.ValidateAuthToken(req.header('authorization'), function (company, tenant) {
            req.body.Company = parseInt(company);
            req.body.Tenant = parseInt(tenant);
            
            var objkey = util.format('%d:%d:Session::%s:res::%s', req.body.Company, req.body.Tenant, req.params["sessionid"], req.params["resourceid"]);
            var logkey = util.format('[%s]::[%s]', uuid.v1(), objkey);
            
            infoLogger.ReqResLogger.log('info', '%s --------------------------------------------------', logkey);
            infoLogger.ReqResLogger.log('info', '%s Start- resource/cs/updatebysessionid #', logkey, { request: req.body });
            
            resourceHandler.UpdateSlotStateBySessionId(logkey, req.body.Company, req.body.Tenant, req.body.ReqCategory, req.params["resourceid"], req.params["sessionid"], req.body.State, req.body.OtherInfo, function (err, result) {
                if (err != null) {
                    infoLogger.ReqResLogger.log('error', 'End- resource/cs/updatebysessionid :: Error: %s #', err, { request: req.body });
                    
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
                else {
                    infoLogger.ReqResLogger.log('info', 'End- resource/cs/updatebysessionid :: Result: %j #', result, { request: req.body });
                    
                    var jsonString = messageFormatter.FormatMessage(err, "update concurrency slot state success", true, undefined);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
            });
        });
    } catch (ex2) {
        var jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(jsonString);
    }
    return next();
});

server.put('/DVP/API/' + hostVersion + '/ARDS/resource/:resourceid/state/:state', function (req, res, next) {
    try {
        authHandler.ValidateAuthToken(req.header('authorization'), function (company, tenant) {
            req.body.Company = parseInt(company);
            req.body.Tenant = parseInt(tenant);
            
            var objkey = util.format('Resource:%d:%d:%s', req.body.Company, req.body.Tenant, req.params["resourceid"]);
            var logkey = util.format('[%s]::[%s]', uuid.v1(), objkey);
            
            infoLogger.ReqResLogger.log('info', '%s --------------------------------------------------', logkey);
            infoLogger.ReqResLogger.log('info', '%s Start- resource/state/push #', logkey, { request: req.params });
            var tags = req.body.Tags;
            resStateMapper.SetResourceState(logkey, req.body.Company, req.body.Tenant, req.params["resourceid"], req.params["state"], function (err, result) {
                if (err != null) {
                    infoLogger.ReqResLogger.log('error', '%s End- resource/state/push :: Error: %s #', logkey, err, { request: req.body });
                    
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
                else {
                    infoLogger.ReqResLogger.log('info', '%s End- resource/state/push :: Result: %j #', logkey, result, { request: req.body });
                    
                    var jsonString = messageFormatter.FormatMessage(err, "update resource state success", true, result);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
            });
        });
    } catch (ex2) {
        var jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(jsonString);
    }
    return next();
});

server.put('/DVP/API/' + hostVersion + '/ARDS/:company/:tenant/resource/:resourceid/state/:state', function (req, res, next) {
    try {
            req.body.Company = parseInt(req.params["company"]);
            req.body.Tenant = parseInt(req.params["tenant"]);

            var objkey = util.format('Resource:%d:%d:%s', req.body.Company, req.body.Tenant, req.params["resourceid"]);
            var logkey = util.format('[%s]::[%s]', uuid.v1(), objkey);

            infoLogger.ReqResLogger.log('info', '%s --------------------------------------------------', logkey);
            infoLogger.ReqResLogger.log('info', '%s Start- resource/state/push #', logkey, { request: req.params });
            var tags = req.body.Tags;
            resStateMapper.SetResourceState(logkey, req.body.Company, req.body.Tenant, req.params["resourceid"], req.params["state"], function (err, result) {
                if (err != null) {
                    infoLogger.ReqResLogger.log('error', '%s End- resource/state/push :: Error: %s #', logkey, err, { request: req.body });

                    var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
                else {
                    infoLogger.ReqResLogger.log('info', '%s End- resource/state/push :: Result: %j #', logkey, result, { request: req.body });

                    var jsonString = messageFormatter.FormatMessage(err, "update resource state success", true, result);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
            });
    } catch (ex2) {
        var jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(jsonString);
    }
    return next();
});

server.get('/DVP/API/' + hostVersion + '/ARDS/:company/:tenant/resource/:resourceid/state', function (req, res, next) {
    try {
        var objkey = util.format('Resource:%d:%d:%s', req.params["company"], req.params["tenant"], req.params["resourceid"]);
        var logkey = util.format('[%s]::[%s]', uuid.v1(), objkey);

        infoLogger.ReqResLogger.log('info', '%s --------------------------------------------------', logkey);
        infoLogger.ReqResLogger.log('info', '%s Start- resource/state/get #', logkey, { request: req.params });
        var tags = req.body.Tags;
        resourceHandler.GetResourceState(logkey, req.params["company"], req.params["tenant"], req.params["resourceid"], function (err, result) {
            if (err != null) {
                infoLogger.ReqResLogger.log('error', '%s End- resource/state/get :: Error: %s #', logkey, err, { request: req.body });

                var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(jsonString);
            }
            else {
                infoLogger.ReqResLogger.log('info', '%s End- resource/state/get :: Result: %j #', logkey, result, { request: req.body });

                var jsonString = messageFormatter.FormatMessage(err, "get resource state success", true, result);
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(jsonString);
            }
        });
    } catch (ex2) {
        var jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(jsonString);
    }
    return next();
});


server.post('/DVP/API/' + hostVersion + '/ARDS/request', function (req, res, next) {
    try {
        authHandler.ValidateAuthToken(req.header('authorization'), function (company, tenant) {
            req.body.Company = parseInt(company);
            req.body.Tenant = parseInt(tenant);
            
            var objkey = util.format('Request:%d:%d:%s', req.body.Company, req.body.Tenant, req.body.SessionId);
            var logkey = util.format('[%s]::[%s]', uuid.v1(), objkey);
            
            infoLogger.ReqResLogger.log('info', '%s --------------------------------------------------', logkey);
            infoLogger.ReqResLogger.log('info', '%s Start- request/add #', logkey, { request: req.body });
            startArds.AddRequest(logkey, req.body, function (err, result, vid) {
                if (err) {
                    infoLogger.ReqResLogger.log('info', '%s End- request/add :: Result: %s #', logkey, 'false', { request: req.body });
                    infoLogger.ReqResLogger.log('error', '%s End- request/add :: Error: %s #', logkey, err, { request: req.body });
                    
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
                else if (result == null) {
                    infoLogger.ReqResLogger.log('info', '%s End- request/add :: Result: %s #', logkey, 'true', { request: req.body });
                    
                    var jsonString = messageFormatter.FormatMessage(err, "add request failed", false, undefined);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
                else {
                    infoLogger.ReqResLogger.log('info', '%s End- request/add :: Result: %s #', logkey, 'false', { request: req.body });
                    
                    var jsonString = messageFormatter.FormatMessage(err, "add request success", true, result);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
            });
        });
    } catch (ex2) {
        var jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(jsonString);
    }
    return next();
});

server.put('/DVP/API/' + hostVersion + '/ARDS/request', function (req, res, next) {
    try {
        authHandler.ValidateAuthToken(req.header('authorization'), function (company, tenant) {
            req.body.Company = parseInt(company);
            req.body.Tenant = parseInt(tenant);
            
            var objkey = util.format('Request:%d:%d:%s', req.body.Company, req.body.Tenant, req.body.SessionId);
            var logkey = util.format('[%s]::[%s]', uuid.v1(), objkey);
            
            infoLogger.ReqResLogger.log('info', '%s --------------------------------------------------', logkey);
            infoLogger.ReqResLogger.log('info', '%s Start- request/set #', logkey, { request: req.body });
            requestHandler.SetRequest(logkey, req.body.RequestData, req.body.CVid, function (err, result, vid) {
                if (err) {
                    infoLogger.ReqResLogger.log('info', '%s End- request/set :: Result: %s #', logkey, 'false', { request: req.body });
                    infoLogger.ReqResLogger.log('error', '%s End- request/set :: Error: %s #', logkey, err, { request: req.body });
                    
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
                else if (result === "OK") {
                    infoLogger.ReqResLogger.log('info', '%s End- request/set :: Result: %s #', logkey, 'true', { request: req.body });
                    
                    var jsonString = messageFormatter.FormatMessage(err, "update request success", true, undefined);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
                else {
                    infoLogger.ReqResLogger.log('info', '%s End- request/set :: Result: %s #', logkey, result, { request: req.body });
                    
                    var jsonString = messageFormatter.FormatMessage(err, "update request failed", false, undefined);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
            });
        });
    } catch (ex2) {
        var jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(jsonString);
    }
    return next();
});

server.get('/DVP/API/' + hostVersion + '/ARDS/request/:class/:type/:category', function (req, res, next) {
    try {
        authHandler.ValidateAuthToken(req.header('authorization'), function (company, tenant) {
            
            var logkey = util.format('[%s::request-searchbytag]', uuid.v1());
            
            infoLogger.ReqResLogger.log('info', '%s --------------------------------------------------', logkey);
            infoLogger.ReqResLogger.log('info', '%s Start- request/searchbytag #', logkey, { request: req.body });
            var data = req.params;
            var tags = ["company_" + company, "tenant_" + tenant, "class_" + data["class"], "type_" + data["type"], "category_" + data["category"]];
            requestHandler.SearchRequestByTags(logkey, tags, function (err, result) {
                if (err != null) {
                    infoLogger.ReqResLogger.log('error', '%s End- request/searchbytag :: Error: %s #', logkey, err, { request: req.body });

                    var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
                else {
                    infoLogger.ReqResLogger.log('info', '%s End- request/searchbytag :: Result: %j #', logkey, result, { request: req.body });

                    var jsonString = messageFormatter.FormatMessage(err, "get request info success", true, result);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
            });
        });
    } catch (ex2) {
        var jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(jsonString);
    }
    return next();
});

server.get('/DVP/API/' + hostVersion + '/ARDS/request/:sessionid', function (req, res, next) {
    try {
        authHandler.ValidateAuthToken(req.header('authorization'), function (company, tenant) {
            
            var data = req.params;
            var objkey = util.format('Request:%s:%s:%s', company, tenant, data["sessionid"]);
            var logkey = util.format('[%s]::[%s]', uuid.v1(), objkey);
            
            infoLogger.ReqResLogger.log('info', '%s --------------------------------------------------', logkey);
            infoLogger.ReqResLogger.log('info', '%s Start- request/get #', logkey, { request: req.params });
            requestHandler.GetRequest(logkey, company, tenant, data["sessionid"], function (err, result, vid) {
                if (err) {
                    infoLogger.ReqResLogger.log('error', '%s End- request/get :: Error: %s #', logkey, err, { request: req.params });
                    
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
                else {
                    infoLogger.ReqResLogger.log('info', '%s End- request/get :: Result: %s :: Vid: %d #', logkey, result, vid, { request: req.params });
                    var resData = { obj: JSON.parse(result), vid: vid };
                    var jsonString = messageFormatter.FormatMessage(err, "get request info success", true, resData);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
            });
        });
    } catch (ex2) {
        var jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(jsonString);
    }
    return next();
});

server.del('/DVP/API/' + hostVersion + '/ARDS/request/:sessionid', function (req, res, next) {
    try {
        authHandler.ValidateAuthToken(req.header('authorization'), function (company, tenant) {
            
            var data = req.params;
            var objkey = util.format('Request:%s:%s:%s', company, tenant, data["sessionid"]);
            var logkey = util.format('[%s]::[%s]', uuid.v1(), objkey);
            
            infoLogger.ReqResLogger.log('info', '%s --------------------------------------------------', logkey);
            infoLogger.ReqResLogger.log('info', '%s Start- request/remove #', logkey, { request: req.params });
            console.log("remove method hit :: SessionID: " + data["sessionid"]);
            requestHandler.RemoveRequest(logkey, company, tenant, data["sessionid"], function (err, result) {
                if (err) {
                    infoLogger.ReqResLogger.log('error', '%s End- request/remove :: Error: %s #', logkey, err, { request: req.params });
                    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                    
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                    res.end(jsonString);
                }
                else {
                    infoLogger.ReqResLogger.log('info', '%s End- request/remove :: Result: %s #', logkey, result, { request: req.params });
                    
                    var jsonString = messageFormatter.FormatMessage(err, "delete request success", true, result);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
            });
        });
    } catch (ex2) {
        var jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(jsonString);
    }
    return next();
});

server.del('/DVP/API/' + hostVersion + '/ARDS/request/:sessionid/reject/:reason', function (req, res, next) {
    try {
        authHandler.ValidateAuthToken(req.header('authorization'), function (company, tenant) {
            
            var data = req.params;
            var objkey = util.format('Request:%s:%s:%s', company, tenant, data["sessionid"]);
            var logkey = util.format('[%s]::[%s]', uuid.v1(), objkey);
            
            infoLogger.ReqResLogger.log('info', '%s --------------------------------------------------', logkey);
            infoLogger.ReqResLogger.log('info', '%s Start- request/reject #', logkey, { request: req.params });
            console.log("reject method hit :: SessionID: " + data["sessionid"] + " :: Reason: " + data["reason"]);
            if (data["reason"] == "NoSession" || data["reason"] == "ClientRejected") {
                requestHandler.RemoveRequest(logkey, company, tenant, data["sessionid"], function (err, result) {
                    if (err) {
                        infoLogger.ReqResLogger.log('error', '%s End- request/reject :: Error: %s #', logkey, err, { request: req.params });
                        var jsonString = messageFormatter.FormatMessage(err, "ERROE", false, result);
                        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                        res.end(jsonString);
                    }
                    else {
                        infoLogger.ReqResLogger.log('info', '%s End- request/reject :: Result: %s #', logkey, result, { request: req.params });
                        console.log(result);
                        var jsonString = messageFormatter.FormatMessage(err, "reject requetst success", true, result);
                        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                        res.end(jsonString);
                    }
                });
            }
            else {
                requestHandler.RejectRequest(logkey, company, tenant, data["sessionid"], data["reason"], function (err, result) {
                    if (err != null) {
                        infoLogger.ReqResLogger.log('error', '%s End- request/reject :: Error: %s #', logkey, err, { request: req.params });
                        
                        var jsonString = messageFormatter.FormatMessage(err, "ERROE", false, result);
                        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                        res.end(jsonString);
                    }
                    else {
                        infoLogger.ReqResLogger.log('info', '%s End- request/reject :: Result: %s #', logkey, result, { request: req.params });
                        console.log(result);
                        var jsonString = messageFormatter.FormatMessage(err, "reject requetst success", true, result);
                        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                        res.end(jsonString);
                    }
                });
            }
        });
    } catch (ex2) {
        var jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(jsonString);
    }
    return next();
});

server.put('/DVP/API/' + hostVersion + '/ARDS/request/:sessionid/state/:state', function (req, res, next) {
    try {
        authHandler.ValidateAuthToken(req.header('authorization'), function (company, tenant) {
            req.body.Company = parseInt(company);
            req.body.Tenant = parseInt(tenant);
            
            var objkey = util.format('Request:%d:%d:%s', req.body.Company, req.body.Tenant, req.params["sessionid"]);
            var logkey = util.format('[%s]::[%s]', uuid.v1(), objkey);
            
            infoLogger.ReqResLogger.log('info', '%s --------------------------------------------------', logkey);
            infoLogger.ReqResLogger.log('info', '%s Start- request/state/update/na #', logkey, { request: req.params });
            switch (req.params["state"]) {
                case "N/A":
                    requestHandler.SetRequestState(logkey, req.body.Company, req.body.Tenant, req.params["sessionid"], "N/A", function (err, result) {
                        if (err != null) {
                            infoLogger.ReqResLogger.log('error', '%s End- request/state/update/na :: Error: %s #', logkey, err, { request: req.params });
                            
                            var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                            res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                            res.end(jsonString);
                        }
                        else {
                            infoLogger.ReqResLogger.log('info', '%s End- request/state/update/na :: Result: %s #', logkey, result, { request: req.params });
                            
                            var jsonString = messageFormatter.FormatMessage(err, "update request State success", true, result);
                            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                            res.end(jsonString);
                        }
                    });
                    break;
                case "QUEUED":
                    requestHandler.SetRequestState(logkey, req.body.Company, req.body.Tenant, req.params["sessionid"], "QUEUED", function (err, result) {
                        if (err != null) {
                            infoLogger.ReqResLogger.log('error', '%s End- request/state/update/queued :: Error: %s #', logkey, err, { request: req.params });
                            
                            var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                            res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                            res.end(jsonString);
                        }
                        else {
                            infoLogger.ReqResLogger.log('info', '%s End- request/state/update/queued :: Result: %s #', logkey, result, { request: req.params });
                            
                            var jsonString = messageFormatter.FormatMessage(err, "update request State success", true, result);
                            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                            res.end(jsonString);
                        }
                    });
                    break;
                case "":
                    requestHandler.SetRequestState(logkey, req.body.Company, req.body.Tenant, req.params["sessionid"], "TRYING", function (err, result) {
                        if (err != null) {
                            infoLogger.ReqResLogger.log('error', '%s End- request/state/update/trying :: Error: %s #', logkey, err, { request: req.params });
                            
                            var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                            res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                            res.end(jsonString);
                        }
                        else {
                            infoLogger.ReqResLogger.log('info', '%s End- request/state/update/trying :: Result: %s #', logkey, result, { request: req.params });
                            
                            var jsonString = messageFormatter.FormatMessage(err, "update request State success", true, result);
                            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                            res.end(jsonString);
                        }
                    });
                    break;
                default:
                    infoLogger.ReqResLogger.log('info', '%s End- invalied state :: Result: %s #', logkey, result, { request: req.params });

                    var jsonString = messageFormatter.FormatMessage(err, "Invalied State", false, undefined);
                    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                    break;
            }
        });
    } catch (ex2) {
        var jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(jsonString);
    }
    return next();
});



server.post('/DVP/API/' + hostVersion + '/ARDS/continueprocess', function (req, res, next) {
    authHandler.ValidateAuthToken(req.header('authorization'), function (company, tenant) {
        req.body.Company = parseInt(company);
        req.body.Tenant = parseInt(tenant);
        
        continueArdsHandler.ContinueArds(req.body, function (result) {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            var resultS = JSON.stringify(result);
            res.end(resultS);
        });
    });
    return next();
});



server.post('/DVP/API/' + hostVersion + '/ARDS/queue', function (req, res, next) {
    try {
        authHandler.ValidateAuthToken(req.header('authorization'), function (company, tenant) {
            req.body.Company = parseInt(company);
            req.body.Tenant = parseInt(tenant);
            
            var objkey = util.format('Request:%d:%d:%s', req.body.Company, req.body.Tenant, req.body.SessionId);
            var logkey = util.format('[%s]::[%s]', uuid.v1(), objkey);
            
            reqQueueHandler.AddRequestToQueue(logkey, req.body, function (err, result) {
                if (err) {
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
                else if (result === "OK") {
                    var jsonString = messageFormatter.FormatMessage(err, "add request to queue success ", true, undefined);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
                else {
                    var jsonString = messageFormatter.FormatMessage(err, "add request to queue failed", false, undefined);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
            });
        });
    } catch (ex2) {
        var jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(jsonString);
    }
    return next();
});

server.put('/DVP/API/' + hostVersion + '/ARDS/queue', function (req, res, next) {
    try {
        authHandler.ValidateAuthToken(req.header('authorization'), function (company, tenant) {
            req.body.Company = parseInt(company);
            req.body.Tenant = parseInt(tenant);
            
            var objkey = util.format('Request:%d:%d:%s', req.body.Company, req.body.Tenant, req.body.SessionId);
            var logkey = util.format('[%s]::[%s]', uuid.v1(), objkey);
            
            reqQueueHandler.ReAddRequestToQueue(logkey, req.body, function (err, result) {
                if (err) {
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
                else if (result === "OK") {
                    var jsonString = messageFormatter.FormatMessage(err, "readd request to queue success", true, undefined);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
                else {
                    var jsonString = messageFormatter.FormatMessage(err, "readd request to queue failed", false, undefined);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
            });
        });
    } catch (ex2) {
        var jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(jsonString);
    }
    return next();
});

server.post('/DVP/API/' + hostVersion + '/ARDS/queue/:queueid/setnextprocessingitem/:processinghashid', function (req, res, next) {
    try {
        authHandler.ValidateAuthToken(req.header('authorization'), function (company, tenant) {
            req.body.Company = parseInt(company);
            req.body.Tenant = parseInt(tenant);
            
            var objkey = util.format('QueueId:%s', req.params["queueid"]);
            var logkey = util.format('[%s]::[%s]', uuid.v1(), objkey);
            
            reqQueueHandler.SetNextProcessingItem(logkey, req.params["queueid"], req.params["processinghashid"]);
            
            var jsonString = messageFormatter.FormatMessage(err, "set next processing request success", true, undefined);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(jsonString);
        });
    } catch (ex2) {
        var jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(jsonString);
    }
    return next();
});

server.del('/DVP/API/' + hostVersion + '/ARDS/queue/:sessionid', function (req, res, next) {
    try {
        authHandler.ValidateAuthToken(req.header('authorization'), function (company, tenant) {
            
            var data = req.params;
            var objkey = util.format('Request:%s:%s:%s', company, tenant, data["sessionid"]);
            var logkey = util.format('[%s]::[%s]', uuid.v1(), objkey);
            
            reqQueueHandler.RemoveRequestFromQueue(logkey, data["queueId"], data["sessionid"], function (err, result) {
                if (err) {
                    var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(jsonString);
                }
                else {
                    var jsonString = messageFormatter.FormatMessage(err, "delete request from queue success", true, result);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(result);
                }
            });
        });
    } catch (ex2) {
        var jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(jsonString);
    }
    return next();
});


server.listen(hostPort, function () {
    console.log('%s listening at %s', server.name, server.url);
});