var resourceHandler = require('dvp-ardscommon/ResourceHandler.js');
var util = require('util');
var reqQueueHandler = require('dvp-ardscommon/ReqQueueHandler.js');
var requestHandler = require('dvp-ardscommon/RequestHandler.js');
var reqServerHandler = require('dvp-ardscommon/ReqServerHandler.js');
var logger = require("dvp-common-lite/LogHandler/CommonLogHandler.js").logger;
var uuid = require('uuid/v4');
var redisHandler = require('dvp-ardscommon/RedisHandler');

var ContinueArds = function (request, callback) {
    var logkey = util.format('[%s]::[%s]', uuid(), request.SessionId);
    logger.info('%s ************************* Start ContinueArds *************************', logkey);

    var selectionResult = "";
    var handlingResource = "";
    
    if (request && request.ReqHandlingAlgo && request.ReqHandlingAlgo == "QUEUE") {
        logger.info("Continue Queued Rqquest : " +request.SessionId+" :: hResource : "+ request.HandlingResource);
        handlingResource = request.HandlingResource;
        requestHandler.GetRequest(logkey, request.Company, request.Tenant, request.SessionId, function(err, result){
            if(err){
                logger.error(err);
                callback(err, undefined);
            }else {
                if(result){
                    logger.info("Request On Continue :: " + result);
                    var jResult = JSON.parse(result);
                    DoReplyServing(logkey, jResult, handlingResource, function (reply) {
                        callback(undefined, reply);
                    });
                }else{
                    logger.info("Request On Continue :: No Request Found :: " + result);
                    callback(new Error("No Request Found"), undefined);
                }
            }
        });
    }
    else if(request && request.ReqHandlingAlgo && request.ReqHandlingAlgo == "DIRECT"){
        var jsonOtherInfo = JSON.stringify(request.OtherInfo);
        resourceHandler.DoResourceSelection(request.Company, request.Tenant, request.ResourceCount, request.SessionId, request.ServerType, request.RequestType, request.SelectionAlgo, request.HandlingAlgo, jsonOtherInfo, function (err, res, obj) {
            DoReplyServing(logkey, request, obj, function (reply) {
                callback(undefined, reply);
            });
        });
    }else{
        callback(new Error("Invalid Request"), undefined);
    }
};

var DoReplyServing = function (logkey, request, handlingResource, callback) {
    logger.info('%s ContinueArds. SessionId: %s :: SessionId: %s :: handlingResource: %s :: ServingAlgo: %s', logkey, request.SessionId, handlingResource, request.ServingAlgo);

    function startRoute() {
        //var reqSkills = [];
        //for (var i = request.AttributeInfo.length - 1; i >= 0; i--) {
        //    for (var j = request.AttributeInfo[i].AttributeNames.length - 1; j >= 0; j--) {
        //        reqSkills.push(request.AttributeInfo[i].AttributeNames[j]);
        //    }
        //}

        var hrOtherData = JSON.parse(handlingResource);
        var postDataString = {
            Company: request.Company.toString(),
            Tenant: request.Tenant.toString(),
            BusinessUnit: request.BusinessUnit,
            ServerType: request.ServerType,
            RequestType: request.RequestType,
            SessionID: request.SessionId,
            Skills: request.QueueName,
            OtherInfo: request.OtherInfo,
            ResourceInfo: hrOtherData
        };


        if (Array.isArray(hrOtherData)) {
            var resInfoData = [];
            for (var i in hrOtherData) {
                var resData = hrOtherData[i];
                var resDataObj = JSON.parse(resData);
                resInfoData.push(resDataObj);
            }
            try {
                postDataString = {
                    Company: request.Company.toString(),
                    Tenant: request.Tenant.toString(),
                    BusinessUnit: request.BusinessUnit,
                    ServerType: request.ServerType,
                    RequestType: request.RequestType,
                    SessionID: request.SessionId,
                    Skills: request.QueueName,
                    OtherInfo: request.OtherInfo,
                    ResourceInfo: resInfoData
                };
            } catch (ex) {
                logger.error(ex);
            }
        }

        reqServerHandler.SendCallBack(logkey, request.RequestServerUrl, request.CallbackOption, postDataString, function (result, msg) {
            if (result) {
                if (msg == "readdRequired") {
                    requestHandler.RejectRequest(logkey, request.Company, request.Tenant, request.SessionId, "Server Return 503.", function (err, result) {
                        if (err) {
                            logger.error("Readd Request to queue failed. SessionId:: " + request.SessionId);
                        }
                        else if ("true") {
                            logger.info("Readd Request to queue success. SessionId:: " + request.SessionId);
                        }
                        else {
                            logger.info("Readd Request to queue failed. SessionId:: " + request.SessionId);
                        }
                    });
                }
                logger.info("SendCallBack success. SessionId:: " + request.SessionId);
                logger.info("CallbackFinishedTime: " + new Date().toISOString());
            }
            else {
                logger.info("SendCallBack failed. SessionId:: " + request.SessionId);
                requestHandler.RejectRequest(logkey, request.Company, request.Tenant, request.SessionId, "Send Callback failed.", function (err, result) {
                    if (err) {
                        logger.error("Readd Request to queue failed. SessionId:: " + request.SessionId);
                    }
                    else if ("true") {
                        logger.info("Readd Request to queue success. SessionId:: " + request.SessionId);
                    }
                    else {
                        logger.info("Readd Request to queue failed. SessionId:: " + request.SessionId);
                    }
                });
            }
        });
        return postDataString;
    }

    switch (request.ServingAlgo) {
        case "CALLBACK":
            if (handlingResource && handlingResource != "" && handlingResource != "No matching resources at the moment") {
                var result = util.format('SessionId:: %s ::: HandlingResource:: %s', request.SessionId, handlingResource);
                logger.info(result);


                if (request.ReqHandlingAlgo == "QUEUE") {
                    var pHashId = util.format('ProcessingHash:%d:%d:%s', request.Company, request.Tenant, request.RequestType);
                    //var redLokKey = util.format('lock:%s:%s', pHashId, request.QueueId);

                    //redisHandler.RLock.lock(redLokKey, 500).then(function(lock) {
                        reqQueueHandler.SetNextProcessingItem(logkey, request.QueueId, pHashId, request.SessionId, function (err, result) {

                            // lock.unlock()
                            //     .catch(function (err) {
                            //         console.error(err);
                            //     });

                            requestHandler.SetRequestState(logkey, request.Company, request.Tenant, request.SessionId, "TRYING", function (err, result) {
                                if (err) {
                                    logger.error(err);
                                }
                                startRoute();
                                logger.info("=======================DoReplyServing Done=================================");
                                callback(handlingResource);
                            });

                        });
                    //});
                    if (request.QPositionEnable) {
                        reqQueueHandler.SendQueuePositionInfo(logkey, request.QPositionUrl, request.QueueId, request.CallbackOption, function () {
                        });
                    }
                } else {
                    requestHandler.SetRequestState(logkey, request.Company, request.Tenant, request.SessionId, "TRYING", function (err, result) {
                        if (err) {
                            logger.error(err);
                        }
                        startRoute();
                        logger.info("=======================DoReplyServing Done=================================");
                        callback(handlingResource);
                    });
                }

            } else {
                callback(handlingResource);
            }

            break;

        default:
            var result = util.format('SessionId:: %s ::: HandlingResource:: %s', request.SessionId, handlingResource);
            logger.info(result);

            //var reqSkills = [];
            //for (var i = request.AttributeInfo.length - 1; i >= 0; i--) {
            //    for (var j = request.AttributeInfo[i].AttributeNames.length - 1; j >= 0; j--) {
            //        reqSkills.push(request.AttributeInfo[i].AttributeNames[j]);
            //    }
            //}

            if (handlingResource && handlingResource != "" && handlingResource != "No matching resources at the moment") {


                var hrOtherData = JSON.parse(handlingResource);
                var postDataString = {
                    Company: request.Company.toString(),
                    Tenant: request.Tenant.toString(),
                    BusinessUnit: request.BusinessUnit,
                    ServerType: request.ServerType,
                    RequestType: request.RequestType,
                    SessionID: request.SessionId,
                    Skills: request.QueueName,
                    OtherInfo: request.OtherInfo,
                    ResourceInfo: hrOtherData
                };


                if (Array.isArray(hrOtherData)) {
                    var resInfoData = [];
                    for (var i in hrOtherData) {
                        var resData = hrOtherData[i];
                        var resDataObj = JSON.parse(resData);
                        resInfoData.push(resDataObj);
                    }
                    try {
                        postDataString = {
                            Company: request.Company.toString(),
                            Tenant: request.Tenant.toString(),
                            BusinessUnit: request.BusinessUnit,
                            ServerType: request.ServerType,
                            RequestType: request.RequestType,
                            SessionID: request.SessionId,
                            Skills: request.QueueName,
                            OtherInfo: request.OtherInfo,
                            ResourceInfo: resInfoData
                        };
                    } catch (ex) {
                        logger.error(ex);
                    }
                }

                callback(postDataString);
            } else {
                postDataString = {
                    Company: request.Company.toString(),
                    Tenant: request.Tenant.toString(),
                    BusinessUnit: request.BusinessUnit,
                    ServerType: request.ServerType,
                    RequestType: request.RequestType,
                    SessionID: request.SessionId,
                    Skills: request.QueueName,
                    OtherInfo: request.OtherInfo,
                    ResourceInfo: undefined
                };

                callback(postDataString);
            }

            break;
    }

};

module.exports.ContinueArds = ContinueArds;