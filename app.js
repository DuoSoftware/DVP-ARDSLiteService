var restify = require('restify');
var redisHandler = require('dvp-ardscommon/RedisHandler.js');
var util = require('util');
var resourceHandler = require('dvp-ardscommon/ResourceHandler.js');
var requestHandler = require('dvp-ardscommon/RequestHandler.js');
var reqServerHandler = require('dvp-ardscommon/ReqServerHandler.js');
var reqMetaHandler = require('dvp-ardscommon/ReqMetaDataHandler.js');
var reqQueueHandler = require('dvp-ardscommon/ReqQueueHandler.js');
var continueArdsHandler = require('./ContinueArdsProcess.js');
var logger = require("dvp-common-lite/LogHandler/CommonLogHandler.js").logger;
var resStateMapper = require('dvp-ardscommon/ResourceStateMapper.js');
var notificationService = require('dvp-ardscommon/services/notificationService.js');
var uuid = require('uuid/v4');
var startArds = require('./StartArds.js');
var config = require('config');
var messageFormatter = require('dvp-common-lite/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var jwt = require('restify-jwt');
var secret = require('dvp-common-lite/Authentication/Secret.js');
var authorization = require('dvp-common-lite/Authentication/Authorization.js');
var healthcheck = require("dvp-healthcheck/DBHealthChecker");

process.on("uncaughtException", function (err) {
    console.error(err);
    console.log("[Unhandled Exception] Node Exiting...");
    process.exit(1);
});

process.on("unhandledRejection", err => {
    console.error(err);
    console.log("[Unhandled Rejection] Node Exiting...");
    process.exit(1);
});

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
server.use(jwt({ secret: secret.Secret }).unless({ path: ['/healthcheck'] }));

var hostIp = config.Host.Ip;
var hostPort = config.Host.Port;
var hostVersion = config.Host.Version;

var hc = new healthcheck(server, {
    redis: redisHandler.RedisCon
});
hc.Initiate();


server.post('/DVP/API/:version/ARDS/requestserver', authorization({ resource: "requestserver", action: "write" }), function (req, res, next) {

    var jsonString;
    try {
        req.body.Company = parseInt(req.user.company);
        req.body.Tenant = parseInt(req.user.tenant);

        var objkey = util.format('ReqServer:%s:%s:%s', "*", "*", req.body.ServerID);
        var logkey = util.format('[%s]::[%s]', uuid(), objkey);

        logger.info('%s --------------------------------------------------', logkey);
        logger.info('%s Start- requestserver/add #', logkey, { request: req.body });

        reqServerHandler.AddRequestServer(logkey, req.body, function (err, result) {
            if (err) {
                logger.info('%s End- requestserver/add :: Result: %s #', logkey, 'false', { request: req.body });
                logger.error('%s End- requestserver/add :: Error: %s #', logkey, err, { request: req.body });

                jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                res.end(jsonString);
            }
            else if (result === "OK") {
                logger.info('%s End- requestserver/add :: Result: %s #', logkey, 'true', { request: req.body });

                jsonString = messageFormatter.FormatMessage(undefined, "Add request server success", true, undefined);
                res.end(jsonString);
            }
            else {
                logger.info('%s End- requestserver/add :: Result: %s #', logkey, 'false', { request: req.body });

                jsonString = messageFormatter.FormatMessage(undefined, "Add request server filed", false, undefined);
                res.end(jsonString);
            }
        });
    } catch (ex) {
        jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, undefined);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(jsonString);
    }

    return next();
});

server.put('/DVP/API/:version/ARDS/requestserver', authorization({ resource: "requestserver", action: "write" }), function (req, res, next) {

    var jsonString;

    try {
        req.body.Company = parseInt(req.user.company);
        req.body.Tenant = parseInt(req.user.tenant);

        var objkey = util.format('ReqServer:%d:%d:%s', "*", "*", req.body.ServerID);
        var logkey = util.format('[%s]::[%s]', uuid(), objkey);

        logger.info('%s --------------------------------------------------', logkey);
        logger.info('%s Start- requestserver/set #', logkey, { request: req.body });
        reqServerHandler.SetRequestServer(logkey, req.body, function (err, result) {
            if (err) {
                logger.info('%s End- requestserver/set :: Result: %s #', logkey, 'false', { request: req.body });
                logger.error('%s End- requestserver/set :: Error: %s #', logkey, err, { request: req.body });

                jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                res.end(jsonString);
            }
            else if (result === "OK") {
                logger.info('%s End- requestserver/set :: Result: %s #', logkey, 'true', { request: req.body });

                jsonString = messageFormatter.FormatMessage(undefined, "Update request server success", true, undefined);
                res.end(jsonString);
            }
            else {
                logger.info('%s End- requestserver/set :: Result: %s #', logkey, 'false', { request: req.body });

                jsonString = messageFormatter.FormatMessage(undefined, "Update request server failed", false, undefined);
                res.end(jsonString);
            }
        });
    } catch (ex1) {
        jsonString = messageFormatter.FormatMessage(ex1, "ERROR", false, undefined);
        res.end(jsonString);
    }
    return next();
});

server.get('/DVP/API/:version/ARDS/requestservers/:serverType/:requestType', authorization({ resource: "requestserver", action: "read" }), function (req, res, next) {

    var jsonString;
    try {

        var logkey = util.format('[%s]::requestserver-searchbytag', uuid());
        logger.info('%s --------------------------------------------------', logkey);
        logger.info('%s Start- requestserver/searchbytag #', logkey, { request: req.params });

        var data = req.params;
        var tags = ["company_*", "tenant_*", "serverType_" + data["serverType"], "requestType_" + data["requestType"]];
        reqServerHandler.SearchReqServerByTags(logkey, tags, function (err, result) {
            if (err != null) {
                logger.error('%s End- requestserver/searchbytag :: Error: %s #', logkey, err, { request: req.params });
                jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                res.end(jsonString);
            }
            else {
                logger.info('%s End- requestserver/searchbytag :: Result: %j #', logkey, result, { request: req.params });
                jsonString = messageFormatter.FormatMessage(undefined, "get request servers success", true, result);
                res.end(jsonString);
            }
        });
    } catch (ex2) {
        jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.end(jsonString);
    }
    return next();
});

server.get('/DVP/API/:version/ARDS/requestserver/:serverid', authorization({ resource: "requestserver", action: "read" }), function (req, res, next) {
    var jsonString;

    try {

        var data = req.params;
        var objkey = util.format('ReqServer:%s:%s:%s', "*", "*", data["serverid"]);
        var logkey = util.format('[%s]::[%s]', uuid(), objkey);

        logger.info('%s --------------------------------------------------', logkey);
        logger.info('%s Start- requestserver/get #', logkey, { request: req.params });
        reqServerHandler.GetRequestServer(logkey, "*", "*", data["serverid"], function (err, result) {
            if (err) {
                logger.error('%s End- requestserver/get :: Error: %s #', logkey, err, { request: req.params });
                jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                res.end(jsonString);
            }
            else {
                logger.info('%s End- requestserver/get :: Result: %s #', logkey, result, { request: req.params });
                jsonString = messageFormatter.FormatMessage(undefined, "get request server success", true, result);
                res.end(jsonString);
            }
        });
    } catch (ex2) {
        jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.end(jsonString);
    }
    return next();
});

server.del('/DVP/API/:version/ARDS/requestserver/:serverid', authorization({ resource: "requestserver", action: "delete" }), function (req, res, next) {
    var jsonString;
    try {

        var data = req.params;
        var objkey = util.format('ReqServer:%s:%s:%s', "*", "*", data["serverid"]);
        var logkey = util.format('[%s]::[%s]', uuid(), objkey);

        logger.info('%s --------------------------------------------------', logkey);
        logger.info('%s Start- requestserver/remove #', logkey, { request: req.params });

        reqServerHandler.RemoveRequestServer(logkey, "*", "*", data["serverid"], function (err, result) {
            if (err) {
                logger.error('%s End- requestserver/remove :: Error: %s #', logkey, err, { request: req.params });

                jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                res.end(jsonString);
            }
            else {
                logger.info('%s End- requestserver/remove :: Result: %s #', logkey, result, { request: req.params });

                jsonString = messageFormatter.FormatMessage(undefined, "delete requesr server success", true, undefined);
                res.end(result);
            }
        });
    } catch (ex2) {
        jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.end(jsonString);
    }
    return next();
});


server.post('/DVP/API/:version/ARDS/requestmeta', authorization({ resource: "requestmeta", action: "write" }), function (req, res, next) {
    var jsonString;
    try {
        req.body.Company = parseInt(req.user.company);
        req.body.Tenant = parseInt(req.user.tenant);

        var objkey = util.format('ReqMETA:%d:%d:%s:%s', req.body.Company, req.body.Tenant, req.body.ServerType, req.body.RequestType);
        var logkey = util.format('[%s]::[%s]', uuid(), objkey);

        logger.info('%s --------------------------------------------------', logkey);
        logger.info('%s Start- requestmeta/add #', logkey, { request: req.body });
        reqMetaHandler.AddMeataData(logkey, req.body, function (err, result) {
            if (err) {
                logger.info('%s End- requestmeta/add :: Result: %s #', logkey, 'false', { request: req.body });
                logger.error('%s End- requestmeta/add :: Error: %s #', logkey, err, { request: req.body });

                jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                res.end(jsonString);
            }
            else if (result === "OK") {
                logger.info('%s End- requestmeta/add :: Result: %s #', logkey, 'true', { request: req.body });

                jsonString = messageFormatter.FormatMessage(undefined, "add request metadata success", true, undefined);
                res.end(jsonString);
            }
            else {
                logger.info('%s End- requestmeta/add :: Result: %s #', logkey, 'false', { request: req.body });

                jsonString = messageFormatter.FormatMessage(undefined, "add request metadata failed", false, undefined);
                res.end(jsonString);
            }
        });
    } catch (ex2) {
        jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.end(jsonString);
    }
    return next();
});

server.put('/DVP/API/:version/ARDS/requestmeta', authorization({ resource: "requestmeta", action: "write" }), function (req, res, next) {
    var jsonString;
    try {
        req.body.Company = parseInt(req.user.company);
        req.body.Tenant = parseInt(req.user.tenant);

        var objkey = util.format('ReqMETA:%d:%d:%s:%s', req.body.Company, req.body.Tenant, req.body.ServerType, req.body.RequestType);
        var logkey = util.format('[%s]::[%s]', uuid(), objkey);

        logger.info('%s --------------------------------------------------', logkey);
        logger.info('%s Start- requestmeta/set #', logkey, { request: req.body });
        reqMetaHandler.SetMeataData(logkey, req.body, function (err, result) {
            if (err) {
                logger.info('%s End- requestmeta/set :: Result: %s #', logkey, 'false', { request: req.body });
                logger.error('%s End- requestmeta/set :: Error: %s #', logkey, err, { request: req.body });

                jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                res.end(jsonString);
            }
            else if (result === "OK") {
                logger.info('%s End- requestmeta/set :: Result: %s #', logkey, 'true', { request: req.body });

                jsonString = messageFormatter.FormatMessage(undefined, "update request metadata success", true, undefined);
                res.end(jsonString);
            }
            else {
                logger.info('%s End- requestmeta/set :: Result: %s #', logkey, result, { request: req.body });

                jsonString = messageFormatter.FormatMessage(undefined, "update request metadata failed", false, undefined);
                res.end(jsonString);
            }
        });
    } catch (ex2) {
        jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.end(jsonString);
    }
    return next();
});

server.get('/DVP/API/:version/ARDS/requestmeta/:serverType/:requestType', authorization({ resource: "requestmeta", action: "read" }), function (req, res, next) {
    var jsonString;
    try {
        var company = req.user.company;
        var tenant = req.user.tenant;
        var data = req.params;
        var objkey = util.format('ReqMETA:%s:%s:%s:%s', company, tenant, data["serverType"], data["requestType"]);
        var logkey = util.format('[%s]::[%s]', uuid(), objkey);

        logger.info('%s --------------------------------------------------', logkey);
        logger.info('%s Start- requestmeta/get #', logkey, { request: req.params });
        reqMetaHandler.GetMeataData(logkey, company, tenant, data["serverType"], data["requestType"], function (err, result) {
            if (err) {
                logger.error('%s End- requestmeta/get :: Error: %s #', logkey, err, { request: req.params });

                jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                res.end(jsonString);
            }
            else {
                logger.info('%s End- requestmeta/get :: Result: %s #', logkey, result, { request: req.params });

                jsonString = messageFormatter.FormatMessage(undefined, "get request metadata success", true, result);
                res.end(jsonString);
            }
        });
    } catch (ex2) {
        jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.end(jsonString);
    }
    return next();
});

server.get('/DVP/API/:version/ARDS/requestmeta', authorization({ resource: "requestmeta", action: "read" }), function (req, res, next) {
    var jsonString;
    try {
        var company = req.user.company;
        var tenant = req.user.tenant;
        var data = req.params;
        var tags = ["company_" + company, "tenant_" + tenant, "serverType_*", "requestType_*"];
        var logkey = util.format('[%s]::requestmeta-searchbytag', uuid());

        logger.info('%s --------------------------------------------------', logkey);
        logger.info('%s Start- requestmeta/get #', logkey, { request: req.params });
        reqMetaHandler.SearchMeataDataByTags(logkey, tags, function (err, result) {
            if (err) {
                logger.error('%s End- requestmeta/get :: Error: %s #', logkey, err, { request: req.params });

                jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                res.end(jsonString);
            }
            else {
                logger.info('%s End- requestmeta/get :: Result: %s #', logkey, result, { request: req.params });

                jsonString = messageFormatter.FormatMessage(undefined, "get request metadata success", true, result);
                res.end(jsonString);
            }
        });
    } catch (ex2) {
        jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.end(jsonString);
    }
    return next();
});

server.del('/DVP/API/:version/ARDS/requestmeta/:serverType/:requestType', authorization({ resource: "requestmeta", action: "delete" }), function (req, res, next) {
    var jsonString;
    try {
        var company = req.user.company;
        var tenant = req.user.tenant;
        var data = req.params;
        var objkey = util.format('ReqMETA:%s:%s:%s:%s', company, tenant, data["serverType"], data["requestType"]);
        var logkey = util.format('[%s]::[%s]', uuid(), objkey);

        logger.info('%s --------------------------------------------------', logkey);
        logger.info('%s Start- requestmeta/remove #', logkey, { request: req.params });
        reqMetaHandler.RemoveMeataData(logkey, company, tenant, data["serverType"], data["requestType"], function (err, result) {
            if (err) {
                logger.error('%s End- requestmeta/remove :: Error: %s #', logkey, err, { request: req.params });

                jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                res.end(jsonString);
            }
            else {
                logger.info('%s End- requestmeta/remove :: Result: %s #', logkey, result, { request: req.params });

                jsonString = messageFormatter.FormatMessage(undefined, "delete request metadata success", true, undefined);
                res.end(jsonString);
            }
        });
    } catch (ex2) {
        jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.end(jsonString);
    }
    return next();
});


server.post('/DVP/API/:version/ARDS/resource', authorization({ resource: "ardsresource", action: "write" }), function (req, res, next) {
    var jsonString;
    try {
        req.body.Company = parseInt(req.user.company);
        req.body.Tenant = parseInt(req.user.tenant);
        req.body.UserName = req.user.iss;

        var objkey = util.format('Resource:%d:%d:%s', req.body.Company, req.body.Tenant, req.body.ResourceId);
        var logkey = util.format('[%s]::[%s]', uuid(), objkey);

        logger.info('%s --------------------------------------------------', logkey);
        logger.info('%s Start- resource/add #', logkey, { request: req.body });
        resourceHandler.AddResource(logkey, req.body, function (err, result, vid) {
            if (err) {
                logger.info('%s End- resource/add :: Result: %s #', logkey, 'false', { request: req.body });
                logger.error('%s End- resource/add :: Error: %s #', logkey, err, { request: req.body });

                jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                res.end(jsonString);
            }
            else if (result === "OK") {
                logger.info('%s End- resource/add :: Result: %s #', logkey, 'true', { request: req.body });

                jsonString = messageFormatter.FormatMessage(undefined, "add resource info success", true, undefined);
                res.end(jsonString);
            }
            else {
                logger.info('%s End- resource/add :: Result: %s #', logkey, 'false', { request: req.body });

                jsonString = messageFormatter.FormatMessage(undefined, "add resource info failed", false, undefined);
                res.end(jsonString);
            }
        });
    } catch (ex2) {
        jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.end(jsonString);
    }
    return next();
});

server.put('/DVP/API/:version/ARDS/resource', authorization({ resource: "ardsresource", action: "write" }), function (req, res, next) {
    var jsonString;
    try {
        var company = parseInt(req.user.company);
        var tenant = parseInt(req.user.tenant);

        var objkey = util.format('Resource:%d:%d:%s', company, tenant, req.body.ResourceId);
        var logkey = util.format('[%s]::[%s]', uuid(), objkey);

        logger.info('%s --------------------------------------------------', logkey);
        logger.info('%s Start- resource/set #', logkey, { request: req.body });
        resourceHandler.SetResource(logkey, company, tenant, req.body, function (err, result, vid) {
            if (err) {
                logger.info('%s End- resource/set :: Result: %s #', logkey, 'false', { request: req.body });
                logger.error('%s End- resource/set :: Error: %s #', logkey, err, { request: req.body });

                jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                res.end(jsonString);
            }
            else if (result === "OK") {
                logger.info('%s End- resource/set :: Result: %s #', logkey, 'true', { request: req.body });

                jsonString = messageFormatter.FormatMessage(undefined, "update resource info success", true, undefined);
                res.end(jsonString);
            }
            else {
                logger.info('%s End- resource/set :: Result: %s #', logkey, result, { request: req.body });

                jsonString = messageFormatter.FormatMessage(undefined, "update resource info failed", false, undefined);
                res.end(jsonString);
            }
        });
    } catch (ex2) {
        jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.end(jsonString);
    }
    return next();
});

server.put('/DVP/API/:version/ARDS/resource/share', authorization({ resource: "ardsresource", action: "write" }), function (req, res, next) {
    var jsonString;
    try {
        req.body.Company = parseInt(req.user.company);
        req.body.Tenant = parseInt(req.user.tenant);
        req.body.UserName = req.user.iss;

        var objkey = util.format('Resource:%d:%d:%s', req.body.Company, req.body.Tenant, req.body.ResourceId);
        var logkey = util.format('[%s]::[%s]', uuid(), objkey);

        logger.info('%s --------------------------------------------------', logkey);
        logger.info('%s Start- resource/share #', logkey, { request: req.body });
        resourceHandler.ShareResource(logkey, req.body, function (err, result, vid) {
            if (err) {
                logger.info('%s End- resource/share :: Result: %s #', logkey, 'false', { request: req.body });
                logger.error('%s End- resource/share :: Error: %s #', logkey, err, { request: req.body });

                jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                res.end(jsonString);
            }
            else if (result === "OK") {
                logger.info('%s End- resource/share :: Result: %s #', logkey, 'true', { request: req.body });

                jsonString = messageFormatter.FormatMessage(undefined, "share resource info success", true, undefined);
                res.end(jsonString);
            }
            else {
                logger.info('%s End- resource/share :: Result: %s #', logkey, 'false', { request: req.body });

                var jsonString = messageFormatter.FormatMessage(undefined, "share resource info failed", false, undefined);
                res.end(jsonString);
            }
        });
    } catch (ex2) {
        jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.end(jsonString);
    }
    return next();
});

server.del('/DVP/API/:version/ARDS/resource/:resourceid/removesSharing/:handlingType', authorization({ resource: "ardsresource", action: "write" }), function (req, res, next) {
    var jsonString;
    try {
        var company = req.user.company;
        var tenant = req.user.tenant;
        var data = req.params;
        var objkey = util.format('Resource:%s:%s:%s', company, tenant, data["resourceid"]);
        var logkey = util.format('[%s]::[%s]', uuid(), objkey);

        logger.info('%s --------------------------------------------------', logkey);
        logger.info('%s Start- resource/removesSharing #', logkey, { request: req.params });

        resourceHandler.RemoveShareResource(logkey, company, tenant, data["resourceid"], data["handlingType"], function (err, result) {
            if (err) {
                logger.error('%s End- resource/removesSharing :: Error: %s #', logkey, err, { request: req.params });

                jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                res.end(jsonString);
            }
            else {
                logger.info('%s End- resource/removesSharing :: Result: %s #', logkey, result, { request: req.params });

                jsonString = messageFormatter.FormatMessage(undefined, "delete resource info success", true, undefined);
                res.end(jsonString);
            }
        });
    } catch (ex2) {
        jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.end(jsonString);
    }
    return next();
});

server.get('/DVP/API/:version/ARDS/resource/:class/:type/:category', authorization({ resource: "ardsresource", action: "write" }), function (req, res, next) {
    var jsonString;
    try {
        var company = req.user.company;
        var tenant = req.user.tenant;
        var logkey = util.format('[%s::resource-searchbytag]', uuid());

        logger.info('%s --------------------------------------------------', logkey);
        logger.info('%s Start- resource/searchbytag #', logkey);
        var data = req.params;
        var tags = ["company_" + company, "tenant_" + tenant, "class_" + data["class"], "type_" + data["type"], "category_" + data["category"]];

        resourceHandler.SearchResourcebyTags(logkey, tags, function (err, result) {
            if (err != null) {
                logger.error('%s End- resource/searchbytag :: Error: %s #', logkey, err);

                jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                res.end(jsonString);
            }
            else {
                logger.info('%s End- resource/searchbytag :: Result: %j #', logkey, result);

                jsonString = messageFormatter.FormatMessage(undefined, "get resource info success", true, result);
                res.end(jsonString);
            }
        });
    } catch (ex2) {
        jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.end(jsonString);
    }
    return next();
});

server.get('/DVP/API/:version/ARDS/resource/:resourceid', authorization({ resource: "ardsresource", action: "write" }), function (req, res, next) {
    var jsonString;
    try {
        var company = req.user.company;
        var tenant = req.user.tenant;
        var data = req.params;
        var objkey = util.format('Resource:%s:%s:%s', company, tenant, data["resourceid"]);
        var logkey = util.format('[%s]::[%s]', uuid(), objkey);

        logger.info('%s --------------------------------------------------', logkey);
        logger.info('%s Start- resource/get #', logkey, { request: req.params });
        resourceHandler.GetResource(logkey, company, tenant, data["resourceid"], function (err, result, vid) {
            if (err) {
                logger.error('%s End- resource/get :: Error: %s #', logkey, err, { request: req.params });

                jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                res.end(jsonString);
            }
            else {
                logger.info('%s End- resource/get :: Result: %s :: Vid: %d #', logkey, result, vid, { request: req.params });
                var resData = { obj: result, vid: vid };

                jsonString = messageFormatter.FormatMessage(undefined, "get resource info success", true, resData);
                res.end(jsonString);
            }
        });
    } catch (ex2) {
        jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.end(jsonString);
    }
    return next();
});

server.del('/DVP/API/:version/ARDS/resource/:resourceid', authorization({ resource: "ardsresource", action: "write" }), function (req, res, next) {
    var jsonString;
    try {
        var company = req.user.company;
        var tenant = req.user.tenant;
        var data = req.params;
        var objkey = util.format('Resource:%s:%s:%s', company, tenant, data["resourceid"]);
        var logkey = util.format('[%s]::[%s]', uuid(), objkey);

        logger.info('%s --------------------------------------------------', logkey);
        logger.info('%s Start- resource/remove #', logkey, { request: req.params });

        resourceHandler.RemoveResource(logkey, company, tenant, data["resourceid"], function (err, result) {
            if (err) {
                logger.error('%s End- resource/remove :: Error: %s #', logkey, err, { request: req.params });

                jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                res.end(jsonString);
            }
            else {
                logger.info('%s End- resource/remove :: Result: %s #', logkey, result, { request: req.params });

                jsonString = messageFormatter.FormatMessage(undefined, "delete resource info success", true, undefined);
                res.end(jsonString);
            }
        });
    } catch (ex2) {
        jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.end(jsonString);
    }
    return next();
});

server.put('/DVP/API/:version/ARDS/resource/:resourceid/concurrencyslot', authorization({ resource: "ardsresource", action: "write" }), function (req, res, next) {


    logger.info('Update Concurrent info - ', req.body);
    var jsonString;
    try {
        req.body.Company = parseInt(req.user.company);
        req.body.Tenant = parseInt(req.user.tenant);

        var objkey = util.format('Resource:%d:%d:%s', req.body.Company, req.body.Tenant, req.params["resourceid"]);
        var logkey = util.format('[%s]::[%s]', uuid(), objkey);

        logger.info('%s --------------------------------------------------', logkey);
        logger.info('%s Start- resource/cs/update #', logkey, { request: req.body });
        switch (req.body.State) {
            case "Available":
                resourceHandler.UpdateSlotStateAvailable(logkey, req.body.Company, req.body.Tenant, req.body.HandlingType, req.params["resourceid"], req.body.SlotId, "", req.body.OtherInfo, "Available", function (err, result) {
                    if (err != null) {
                        logger.error('%s End- resource/cs/update :: Error: %s #', logkey, err, { request: req.body });

                        jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                        res.end(jsonString);
                    }
                    else {
                        logger.info('%s End- resource/cs/update :: Result: %j #', logkey, result, { request: req.body });

                        jsonString = messageFormatter.FormatMessage(undefined, "update concurrency slot state success", true, undefined);
                        res.end(jsonString);
                    }
                });
                break;

            case "Reserved":
                resourceHandler.UpdateSlotStateReserved(logkey, req.body.Company, req.body.Tenant, req.body.BusinessUnit, req.body.HandlingType, req.body.ResourceId, req.body.SlotId, req.body.SessionId, req.body.MaxReservedTime, req.body.MaxAfterWorkTime, req.body.MaxFreezeTime, req.body.TempMaxRejectCount, req.body.OtherInfo, function (err, result) {
                    if (err != null) {
                        logger.error('%s End- resource/cs/update :: Error: %s #', logkey, err, { request: req.body });

                        jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                        res.end(jsonString);
                    }
                    else {
                        logger.info('%s End- resource/cs/update :: Result: %j #', logkey, result, { request: req.body });

                        jsonString = messageFormatter.FormatMessage(undefined, "update concurrency slot state success", true, undefined);
                        res.end(jsonString);
                    }
                });
                break;

            case "Connected":
                resourceHandler.UpdateSlotStateConnected(logkey, req.body.Company, req.body.Tenant, req.body.HandlingType, req.body.ResourceId, req.body.SlotId, req.body.SessionId, req.body.OtherInfo, "inbound", function (err, result) {
                    if (err != null) {
                        logger.error('End- resource/cs/update :: Error: %s #', err, { request: req.body });

                        jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                        res.end(jsonString);
                    }
                    else {
                        logger.info('End- resource/cs/update :: Result: %j #', result, { request: req.body });

                        jsonString = messageFormatter.FormatMessage(undefined, "update concurrency slot state success", true, undefined);
                        res.end(jsonString);
                    }
                });
                break;
            default:
                jsonString = messageFormatter.FormatMessage(new Error("Invalid Request State"), "ERROR", false, undefined);
                res.end(jsonString);
                break;
        }
    } catch (ex2) {
        jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.end(jsonString);
    }
    return next();
});

server.put('/DVP/API/:version/ARDS/resource/:resourceid/concurrencyslot/session/:sessionid', authorization({ resource: "ardsresource", action: "write" }), function (req, res, next) {
    var jsonString;
    try {

        req.body.Company = req.user.company;
        req.body.Tenant = req.user.tenant;
        var direction = "inbound";
        if (req.query.direction) {
            direction = req.query.direction;
        }

        if (req.body.State === "EndFreeze") {

            req.body.State = "endFreeze"
        }


        var objkey = util.format('%d:%d:Session::%s:res::%s', req.body.Company, req.body.Tenant, req.params["sessionid"], req.params["resourceid"]);
        var logkey = util.format('[%s]::[%s]', uuid(), objkey);

        logger.info('%s --------------------------------------------------', logkey);
        logger.info('%s Start- resource/cs/updatebysessionid #', logkey, { request: req.body, query: req.query });

        resourceHandler.UpdateSlotStateBySessionId(logkey, req.body.Company, req.body.Tenant, req.body.RequestType, req.params["resourceid"], req.params["sessionid"], req.body.State, req.body.Reason, req.body.OtherInfo, direction, function (err, result) {
            if (err != null) {
                logger.error('End- resource/cs/updatebysessionid :: Error: %s #', err, { request: req.body });

                jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                res.end(jsonString);
            }
            else {
                logger.info('End- resource/cs/updatebysessionid :: Result: %j #', result, { request: req.body });

                jsonString = messageFormatter.FormatMessage(undefined, "update concurrency slot state success", true, undefined);
                res.end(jsonString);
            }
        });

    } catch (ex2) {
        jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.end(jsonString);
    }
    return next();
});

server.put('/DVP/API/:version/ARDS/resource/:resourceid/state/:state/reason/:reason', authorization({ resource: "ardsresource", action: "write" }), function (req, res, next) {
    var jsonString;
    try {
        var Company = parseInt(req.user.company);
        var Tenant = parseInt(req.user.tenant);

        var objkey = util.format('Resource:%d:%d:%s', Company, Tenant, req.params["resourceid"]);
        var logkey = util.format('[%s]::[%s]', uuid(), objkey);

        logger.info('%s --------------------------------------------------', logkey);
        logger.info('%s Start- resource/state/push #', logkey, { request: req.params });
        resStateMapper.SetResourceState(logkey, Company, Tenant, undefined, req.params["resourceid"], req.user.iss, req.params["state"], req.params["reason"], function (err, result) {
            if (err != null) {
                logger.error('%s End- resource/state/push :: Error: %s #', logkey, err, { request: req.body });

                if (result) {
                    jsonString = messageFormatter.FormatMessage(undefined, result, false, undefined);
                } else {
                    jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                }
                res.end(jsonString);
            }
            else {
                logger.info('%s End- resource/state/push :: Result: %j #', logkey, result, { request: req.body });

                jsonString = messageFormatter.FormatMessage(undefined, "update resource state success", true, result);
                res.end(jsonString);
            }
        });
    } catch (ex2) {
        jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.end(jsonString);
    }
    return next();
});
/*
 server.put('/DVP/API/:version/ARDS/resource/:resourceid/state/:state',authorization({resource:"ardsresource", action:"write"}), function (req, res, next) {
 try {
 authHandler.ValidateAuthToken(req, function (err, company, tenant) {
 if (err != null) {
 throw  err;
 }
 req.body.Company = parseInt(company);
 req.body.Tenant = parseInt(tenant);

 var objkey = util.format('Resource:%d:%d:%s', req.body.Company, req.body.Tenant, req.params["resourceid"]);
 var logkey = util.format('[%s]::[%s]', uuid(), objkey);

 logger.info('%s --------------------------------------------------', logkey);
 logger.info('%s Start- resource/state/push #', logkey, {request: req.params});
 var tags = req.body.Tags;
 resStateMapper.SetResourceState(logkey, req.body.Company, req.body.Tenant, req.params["resourceid"], req.params["state"], function (err, result) {
 if (err != null) {
 logger.error('%s End- resource/state/push :: Error: %s #', logkey, err, {request: req.body});

 var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
 res.writeHead(500, {'Content-Type': 'application/json; charset=utf-8'});
 res.end(jsonString);
 }
 else {
 logger.info('%s End- resource/state/push :: Result: %j #', logkey, result, {request: req.body});

 var jsonString = messageFormatter.FormatMessage(err, "update resource state success", true, result);
 res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
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
 */
server.get('/DVP/API/:version/ARDS/resource/:resourceid/state', authorization({ resource: "ardsresource", action: "read" }), function (req, res, next) {
    var jsonString;
    try {
        var company = req.user.company;
        var tenant = req.user.tenant;
        var objkey = util.format('Resource:%d:%d:%s', company, tenant, req.params["resourceid"]);
        var logkey = util.format('[%s]::[%s]', uuid(), objkey);

        logger.info('%s --------------------------------------------------', logkey);
        logger.info('%s Start- resource/state/get #', logkey, { request: req.params });
        //var tags = req.body.Tags;
        resourceHandler.GetResourceState(logkey, company, tenant, req.params["resourceid"], function (err, result) {
            if (err != null) {
                logger.error('%s End- resource/state/get :: Error: %s #', logkey, err, { request: req.body });

                var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                res.end(jsonString);
            }
            else {
                logger.info('%s End- resource/state/get :: Result: %j #', logkey, result, { request: req.body });

                jsonString = messageFormatter.FormatMessage(undefined, "get resource state success", true, result);
                res.end(jsonString);
            }
        });
    } catch (ex2) {
        jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.end(jsonString);
    }
    return next();
});


server.post('/DVP/API/:version/ARDS/request', authorization({ resource: "ardsrequest", action: "write" }), function (req, res, next) {
    var jsonString;
    try {
        req.body.Company = parseInt(req.user.company);
        req.body.Tenant = parseInt(req.user.tenant);

        var objkey = util.format('Request:%d:%d:%s', req.body.Company, req.body.Tenant, req.body.SessionId);
        var logkey = util.format('[%s]::[%s]', uuid(), objkey);

        logger.info('%s --------------------------------------------------', logkey);
        logger.info('%s Start- request/add #', logkey, { request: req.body });
        startArds.AddRequest(logkey, req.body, function (err, result, vid) {
            if (err) {
                logger.info('%s End- request/add :: Result: %s #', logkey, 'false', { request: req.body });
                logger.error('%s End- request/add :: Error: %s #', logkey, err, { request: req.body });

                jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                res.end(jsonString);
            }
            else if (result == null) {
                logger.info('%s End- request/add :: Result: %s #', logkey, 'true', { request: req.body });

                jsonString = messageFormatter.FormatMessage(undefined, "add request failed", false, undefined);
                res.end(jsonString);
            }
            else {
                logger.info('%s End- request/add :: Result: %s #', logkey, 'false', { request: req.body });

                jsonString = messageFormatter.FormatMessage(undefined, "add request success", true, result);
                res.end(jsonString);
            }
        });
    } catch (ex2) {
        jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.end(jsonString);
    }
    return next();
});

server.put('/DVP/API/:version/ARDS/request', authorization({ resource: "ardsrequest", action: "write" }), function (req, res, next) {
    var jsonString;
    try {
        req.body.Company = parseInt(req.user.company);
        req.body.Tenant = parseInt(req.user.tenant);

        var objkey = util.format('Request:%d:%d:%s', req.body.Company, req.body.Tenant, req.body.SessionId);
        var logkey = util.format('[%s]::[%s]', uuid(), objkey);

        logger.info('%s --------------------------------------------------', logkey);
        logger.info('%s Start- request/set #', logkey, { request: req.body });
        requestHandler.SetRequest(logkey, req.body.RequestData, req.body.CVid, function (err, result, vid) {
            if (err) {
                logger.info('%s End- request/set :: Result: %s #', logkey, 'false', { request: req.body });
                logger.error('%s End- request/set :: Error: %s #', logkey, err, { request: req.body });

                jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                res.end(jsonString);
            }
            else if (result === "OK") {
                logger.info('%s End- request/set :: Result: %s #', logkey, 'true', { request: req.body });

                jsonString = messageFormatter.FormatMessage(undefined, "update request success", true, undefined);
                res.end(jsonString);
            }
            else {
                logger.info('%s End- request/set :: Result: %s #', logkey, result, { request: req.body });

                jsonString = messageFormatter.FormatMessage(undefined, "update request failed", false, undefined);
                res.end(jsonString);
            }
        });
    } catch (ex2) {
        jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.end(jsonString);
    }
    return next();
});

server.get('/DVP/API/:version/ARDS/request/:serverType/:requestType', authorization({ resource: "ardsrequest", action: "read" }), function (req, res, next) {
    var jsonString;
    try {
        var company = req.user.company;
        var tenant = req.user.tenant;
        var logkey = util.format('[%s::request-searchbytag]', uuid());

        logger.info('%s --------------------------------------------------', logkey);
        logger.info('%s Start- request/searchbytag #', logkey, { request: req.body });
        var data = req.params;
        var tags = ["company_" + company, "tenant_" + tenant, "serverType_" + data["serverType"], "requestType_" + data["requestType"]];
        requestHandler.SearchRequestByTags(logkey, tags, function (err, result) {
            if (err != null) {
                logger.error('%s End- request/searchbytag :: Error: %s #', logkey, err, { request: req.body });

                jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                res.end(jsonString);
            }
            else {
                logger.info('%s End- request/searchbytag :: Result: %j #', logkey, result, { request: req.body });

                jsonString = messageFormatter.FormatMessage(undefined, "get request info success", true, result);
                res.end(jsonString);
            }
        });
    } catch (ex2) {
        jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.end(jsonString);
    }
    return next();
});

server.get('/DVP/API/:version/ARDS/request/:sessionid', authorization({ resource: "ardsrequest", action: "read" }), function (req, res, next) {
    var jsonString;
    try {
        var company = req.user.company;
        var tenant = req.user.tenant;
        var data = req.params;
        var objkey = util.format('Request:%s:%s:%s', company, tenant, data["sessionid"]);
        var logkey = util.format('[%s]::[%s]', uuid(), objkey);

        logger.info('%s --------------------------------------------------', logkey);
        logger.info('%s Start- request/get #', logkey, { request: req.params });
        requestHandler.GetRequest(logkey, company, tenant, data["sessionid"], function (err, result, vid) {
            if (err) {
                logger.error('%s End- request/get :: Error: %s #', logkey, err, { request: req.params });

                jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                res.end(jsonString);
            }
            else {
                logger.info('%s End- request/get :: Result: %s :: Vid: %d #', logkey, result, vid, { request: req.params });
                var resData = { obj: JSON.parse(result), vid: vid };
                jsonString = messageFormatter.FormatMessage(undefined, "get request info success", true, resData);
                res.end(jsonString);
            }
        });
    } catch (ex2) {
        jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.end(jsonString);
    }
    return next();
});

server.del('/DVP/API/:version/ARDS/request/:sessionid/:reason', authorization({ resource: "ardsrequest", action: "delete" }), function (req, res, next) {
    var jsonString;
    try {
        var company = req.user.company;
        var tenant = req.user.tenant;
        var data = req.params;
        var objkey = util.format('Request:%s:%s:%s', company, tenant, data["sessionid"]);
        var logkey = util.format('[%s]::[%s]', uuid(), objkey);

        logger.info('%s --------------------------------------------------', logkey);
        logger.info('%s Start- request/remove #', logkey, { request: req.params });
        logger.info("remove method hit :: SessionID: " + data["sessionid"]);
        requestHandler.RemoveRequest(logkey, company, tenant, data["sessionid"], data["reason"], function (err, result) {
            if (err) {
                logger.error('%s End- request/remove :: Error: %s #', logkey, err, { request: req.params });

                jsonString = messageFormatter.FormatMessage(err, "ERROR", false, result);
                res.end(jsonString);
            }
            else {
                logger.info('%s End- request/remove :: Result: %s #', logkey, result, { request: req.params });

                jsonString = messageFormatter.FormatMessage(err, "delete request success", true, result);
                res.end(jsonString);
            }
        });
    } catch (ex2) {
        jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.end(jsonString);
    }
    return next();
});

server.del('/DVP/API/:version/ARDS/request/:sessionid/reject/:reason', authorization({ resource: "ardsrequest", action: "delete" }), function (req, res, next) {
    var jsonString;
    try {
        var company = req.user.company;
        var tenant = req.user.tenant;
        var data = req.params;
        var objkey = util.format('Request:%s:%s:%s', company, tenant, data["sessionid"]);
        var logkey = util.format('[%s]::[%s]', uuid(), objkey);

        logger.info('%s --------------------------------------------------', logkey);
        logger.info('%s Start- request/reject #', logkey, { request: req.params });
        logger.info("reject method hit :: SessionID: " + data["sessionid"] + " :: Reason: " + data["reason"]);
        requestHandler.RejectRequest(logkey, company, tenant, data["sessionid"], data["reason"], function (err, result) {
            if (err != null) {
                logger.error('%s End- request/reject :: Error: %s #', logkey, err, { request: req.params });

                jsonString = messageFormatter.FormatMessage(err, "ERROE", false, result);
                res.end(jsonString);
            }
            else {
                logger.info('%s End- request/reject :: Result: %s #', logkey, result, { request: req.params });
                jsonString = messageFormatter.FormatMessage(undefined, "reject requetst success", true, result);
                res.end(jsonString);
            }
        });
    } catch (ex2) {
        jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.end(jsonString);
    }
    return next();
});

server.put('/DVP/API/:version/ARDS/request/:sessionid/state/:state', authorization({ resource: "ardsrequest", action: "write" }), function (req, res, next) {
    var jsonString;
    try {
        req.body.Company = parseInt(req.user.company);
        req.body.Tenant = parseInt(req.user.tenant);

        var objkey = util.format('Request:%d:%d:%s', req.body.Company, req.body.Tenant, req.params["sessionid"]);
        var logkey = util.format('[%s]::[%s]', uuid(), objkey);

        logger.info('%s --------------------------------------------------', logkey);
        logger.info('%s Start- request/state/update/na #', logkey, { request: req.params });
        switch (req.params["state"]) {
            case "N/A":
                requestHandler.SetRequestState(logkey, req.body.Company, req.body.Tenant, req.params["sessionid"], "N/A", function (err, result) {
                    if (err != null) {
                        logger.error('%s End- request/state/update/na :: Error: %s #', logkey, err, { request: req.params });

                        jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                        res.end(jsonString);
                    }
                    else {
                        logger.info('%s End- request/state/update/na :: Result: %s #', logkey, result, { request: req.params });

                        jsonString = messageFormatter.FormatMessage(undefined, "update request State success", true, result);
                        res.end(jsonString);
                    }
                });
                break;
            case "QUEUED":
                requestHandler.SetRequestState(logkey, req.body.Company, req.body.Tenant, req.params["sessionid"], "QUEUED", function (err, result) {
                    if (err != null) {
                        logger.error('%s End- request/state/update/queued :: Error: %s #', logkey, err, { request: req.params });

                        jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                        res.end(jsonString);
                    }
                    else {
                        logger.info('%s End- request/state/update/queued :: Result: %s #', logkey, result, { request: req.params });

                        jsonString = messageFormatter.FormatMessage(undefined, "update request State success", true, result);
                        res.end(jsonString);
                    }
                });
                break;
            case "":
                requestHandler.SetRequestState(logkey, req.body.Company, req.body.Tenant, req.params["sessionid"], "TRYING", function (err, result) {
                    if (err != null) {
                        logger.error('%s End- request/state/update/trying :: Error: %s #', logkey, err, { request: req.params });

                        jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                        res.end(jsonString);
                    }
                    else {
                        logger.info('%s End- request/state/update/trying :: Result: %s #', logkey, result, { request: req.params });

                        jsonString = messageFormatter.FormatMessage(undefined, "update request State success", true, result);
                        res.end(jsonString);
                    }
                });
                break;
            default:
                logger.info('%s End- invalied state :: Result: %s #', logkey, result, { request: req.params });

                var jsonString = messageFormatter.FormatMessage(undefined, "Invalied State", false, undefined);
                res.end(jsonString);
                break;
        }
    } catch (ex2) {
        jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.end(jsonString);
    }
    return next();
});



server.post('/DVP/API/:version/ARDS/continueprocess', authorization({ resource: "ardsrequest", action: "write" }), function (req, res, next) {
    var jsonString;
    try {
        req.body.Company = parseInt(req.user.company);
        req.body.Tenant = parseInt(req.user.tenant);
        logger.info("Start======================================:: " + Date.now());
        continueArdsHandler.ContinueArds(req.body, function (err, result) {
            if (err) {
                logger.info("END======================================:: " + Date.now());
                res.end();
            } else {
                logger.info("END======================================:: " + Date.now());
                //var resultS = JSON.stringify(result);
                res.end();
            }
        });
    } catch (ex2) {
        jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.end(jsonString);
    }
    return next();
});



server.post('/DVP/API/:version/ARDS/queue', authorization({ resource: "queue", action: "write" }), function (req, res, next) {
    var jsonString;
    try {
        req.body.Company = parseInt(req.user.company);
        req.body.Tenant = parseInt(req.user.tenant);

        var objkey = util.format('Request:%d:%d:%s', req.body.Company, req.body.Tenant, req.body.SessionId);
        var logkey = util.format('[%s]::[%s]', uuid(), objkey);

        reqQueueHandler.AddRequestToQueue(logkey, req.body, function (err, result) {
            if (err) {
                jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                res.end(jsonString);
            }
            else if (result === "OK") {
                jsonString = messageFormatter.FormatMessage(undefined, "add request to queue success ", true, undefined);
                res.end(jsonString);
            }
            else {
                jsonString = messageFormatter.FormatMessage(undefined, "add request to queue failed", false, undefined);
                res.end(jsonString);
            }
        });
    } catch (ex2) {
        jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.end(jsonString);
    }
    return next();
});

server.put('/DVP/API/:version/ARDS/queue', authorization({ resource: "queue", action: "write" }), function (req, res, next) {
    var jsonString;
    try {
        req.body.Company = parseInt(req.user.company);
        req.body.Tenant = parseInt(req.user.tenant);

        var objkey = util.format('Request:%d:%d:%s', req.body.Company, req.body.Tenant, req.body.SessionId);
        var logkey = util.format('[%s]::[%s]', uuid(), objkey);

        reqQueueHandler.ReAddRequestToQueue(logkey, req.body, function (err, result) {
            if (err) {
                jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                res.end(jsonString);
            }
            else if (result === "OK") {
                jsonString = messageFormatter.FormatMessage(undefined, "readd request to queue success", true, undefined);
                res.end(jsonString);
            }
            else {
                jsonString = messageFormatter.FormatMessage(undefined, "readd request to queue failed", false, undefined);
                res.end(jsonString);
            }
        });
    } catch (ex2) {
        jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.end(jsonString);
    }
    return next();
});

server.put('/DVP/API/:version/ARDS/queue/setNextProcessingItem', authorization({ resource: "queue", action: "write" }), function (req, res, next) {
    var jsonString;
    try {
        req.body.Company = parseInt(req.user.company);
        req.body.Tenant = parseInt(req.user.tenant);

        var objkey = util.format('QueueId:%s', req.body.QueueId);
        var logkey = util.format('[%s]::[%s]', uuid(), objkey);

        logger.info('%s --------------------------------------------------', logkey);
        logger.info('%s Start- request/remove #', logkey, { request: req.body });

        if (req.body.QueueId && req.body.ProcessingHashId && req.body.CurrentSession) {
            reqQueueHandler.SetNextProcessingItem(logkey, req.body.QueueId, req.body.ProcessingHashId, req.body.CurrentSession, function (err, result) {
                jsonString = messageFormatter.FormatMessage(undefined, "Execute SetNextProcessingItem Success", true, undefined);
                logger.info('%s End- queue/SetNextProcessingItem :: Result: %s #', logkey, result, { request: req.body });
                res.end(jsonString);
            });
        } else {
            jsonString = messageFormatter.FormatMessage(undefined, "Execute SetNextProcessingItem: Not enough data process", false, undefined);
            logger.info('%s End- queue/SetNextProcessingItem :: Result: Not enough data process #', logkey, result, { request: req.body });
            res.end(jsonString);
        }


    } catch (ex2) {
        jsonString = messageFormatter.FormatMessage(ex2, "Execute SetNextProcessingItem Failed", false, undefined);
        logger.info('%s End- queue/SetNextProcessingItem :: Result: Failed #', logkey, result, { request: req.body });
        res.end(jsonString);
    }
    return next();
});

server.del('/DVP/API/:version/ARDS/queue/:queueId/:sessionId/:requestType/:reason', authorization({ resource: "queue", action: "delete" }), function (req, res, next) {
    var jsonString;
    try {
        var company = req.user.company;
        var tenant = req.user.tenant;
        var data = req.params;
        var objkey = util.format('Request:%s:%s:%s', company, tenant, data["sessionId"]);
        var logkey = util.format('[%s]::[%s]', uuid(), objkey);

        reqQueueHandler.RemoveRequestFromQueue(logkey, company, tenant, data["queueId"], data["sessionId"], data["requestType"], data["reason"], function (err, result) {
            if (err) {
                jsonString = messageFormatter.FormatMessage(err, "ERROR", false, undefined);
                res.end(jsonString);
            }
            else {
                jsonString = messageFormatter.FormatMessage(undefined, "delete request from queue success", true, result);
                res.end(result);
            }
        });
    } catch (ex2) {
        jsonString = messageFormatter.FormatMessage(ex2, "ERROR", false, undefined);
        res.end(jsonString);
    }
    return next();
});

//-------------------- Notifications --------------------- \\

server.post('/DVP/API/:version/ARDS/Notification/:UserName', authorization({ resource: "queue", action: "write" }), function (req, res, next) {
    var jsonString;
    try {

        /*scheduleWorkerHandler.SendNotification(req.user.company,req.user.tenant,req.params.UserName,uuid());*/

        logger.info("SendNotificationToRoom - Callback" + JSON.stringify(req.body));
        var notificationMsg = {
            From: req.body.From,
            Direction: req.body.Direction,
            To: req.params.UserName,
            ResourceId: req.body.ResourceId,
            UserName: req.params.UserName,
            Message: req.body.Message,
            SessionId: req.body.SessionID
        };

        var postData = { message: notificationMsg, From: 'ArdsliteService' };
        notificationService.SendNotificationToRoom(req.user.company, req.user.tenant, req.body.RoomName, req.body.Event, postData, uuid());

        jsonString = messageFormatter.FormatMessage(undefined, "Execute Successfully", true, undefined);
        res.end(jsonString);
    } catch (ex) {
        jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, undefined);
        res.end(jsonString);
    }
    return next();
});

//-------------------- Notifications --------------------- \\

server.listen(hostPort, function () {
    logger.info('%s listening at %s', server.name, server.url);
});
