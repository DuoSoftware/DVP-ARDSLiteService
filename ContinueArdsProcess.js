var resourceHandler = require('dvp-ardscommon/ResourceHandler.js');
var util = require('util');
var reqQueueHandler = require('dvp-ardscommon/ReqQueueHandler.js');
var requestHandler = require('dvp-ardscommon/RequestHandler.js');
var reqServerHandler = require('dvp-ardscommon/ReqServerHandler.js');
var infoLogger = require('dvp-ardscommon/InformationLogger.js');
var uuid = require('node-uuid');

var ContinueArds = function (request, callback) {
    var logkey = util.format('[%s]::[%s]', uuid.v1(), request.SessionId);
    infoLogger.ContArdsLogger.log('info', '%s ************************* Start ContinueArds *************************', logkey);

    var selectionResult = "";
    var handlingResource = "";
    
    if (request.ReqHandlingAlgo == "QUEUE") {
        console.log("Continue Queued Rqquest:: hResource : "+ request.HandlingResource);
        handlingResource = request.HandlingResource;
        requestHandler.GetRequest(logkey, request.Company, request.Tenant, request.SessionId, function(err, result){
            if(err){
                console.log(err);
                callback(err, undefined);
            }else {
                if(result){
                    var jResult = JSON.parse(result);
                    DoReplyServing(logkey, jResult, handlingResource, function (reply) {
                        callback(undefined, reply);
                    });
                }else{
                    callback(new Error("No Request Found"), undefined);
                }
            }
        });
    }
    else {
        var jsonOtherInfo = JSON.stringify(request.OtherInfo);
        resourceHandler.DoResourceSelection(request.Company, request.Tenant, request.ResourceCount, request.SessionId, request.Class, request.Type, request.Category, request.SelectionAlgo, request.HandlingAlgo, jsonOtherInfo, function (err, res, obj) {
            DoReplyServing(logkey, request, JSON.stringify(obj), function (reply) {
                callback(reply);
            });
        });
    }
};

var DoReplyServing = function (logkey, request, handlingResource, callback) {
    infoLogger.ContArdsLogger.log('info', '%s ContinueArds. SessionId: %s :: SessionId: %s :: handlingResource: %s :: ServingAlgo: %s', logkey, request.SessionId, handlingResource, request.ServingAlgo);
                
    switch (request.ServingAlgo) {
        case "CALLBACK":
            if (handlingResource && handlingResource != "" && handlingResource != "No matching resources at the moment") {
                var result = util.format('SessionId:: %s ::: HandlingResource:: %s', request.SessionId, handlingResource);
                console.log(result);
                requestHandler.SetRequestState(logkey, request.Company, request.Tenant, request.SessionId, "TRYING", function (err, result) {
                    if (err) {
                        console.log(err);
                    }
                    callback(handlingResource);
                });
                
                if (request.ReqHandlingAlgo == "QUEUE") {
                    var pHashId = util.format('ProcessingHash:%d:%d', request.Company, request.Tenant);
                    reqQueueHandler.SetNextProcessingItem(logkey, request.QueueId, pHashId);
                    if(request.QPositionEnable) {
                        reqQueueHandler.SendQueuePositionInfo(logkey, request.QPositionUrl, request.QueueId, function () {
                        });
                    }
                }

                var reqSkills = [];
                for (var i=request.AttributeInfo.length-1; i>=0; i--) {
                    for (var j=request.AttributeInfo[i].AttributeNames.length-1; j>=0; j--) {
                        reqSkills.push(request.AttributeInfo[i].AttributeNames[j]);
                    }
                }
                
                var hrOtherData = JSON.parse(handlingResource);
                var postDataString = {
                    Company: request.Company.toString(),
                    Tenant: request.Tenant.toString(),
                    ServerType: request.ServerType,
                    RequestType: request.RequestType,
                    SessionID: request.SessionId,
                    Skills: reqSkills.join(),
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
                            Tenant:Tenant.toString(),
                            ServerType: request.ServerType,
                            RequestType: request.RequestType,
                            SessionID: request.SessionId,
                            Skills: reqSkills.join(),
                            OtherInfo: request.OtherInfo,
                            ResourceInfo: resInfoData
                        };
                    }catch(ex){
                        console.log(ex);
                    }
                }

                reqServerHandler.SendCallBack(logkey, request.RequestServerUrl, request.CallbackOption, postDataString, function (result, msg) {
                    if (result) {
                        if (msg == "readdRequired") {
                            requestHandler.RejectRequest(logkey, request.Company, request.Tenant, request.SessionId, "Server Return 503.", function (err, result) {
                                if (err) {
                                    console.log("Readd Request to queue failed. SessionId:: " + request.SessionId);
                                }
                                else if ("true") {
                                    console.log("Readd Request to queue success. SessionId:: " + request.SessionId);
                                }
                                else {
                                    console.log("Readd Request to queue failed. SessionId:: " + request.SessionId);
                                }
                            });
                        }
                        console.log("SendCallBack success. SessionId:: " + request.SessionId);
                        console.log("CallbackFinishedTime: " + new Date().toISOString());
                    }
                    else {
                        console.log("SendCallBack failed. SessionId:: " + request.SessionId);
                        requestHandler.RejectRequest(logkey, request.Company, request.Tenant, request.SessionId, "Send Callback failed.", function (err, result) {
                            if (err) {
                                console.log("Readd Request to queue failed. SessionId:: " + request.SessionId);
                            }
                            else if ("true") {
                                console.log("Readd Request to queue success. SessionId:: " + request.SessionId);
                            }
                            else {
                                console.log("Readd Request to queue failed. SessionId:: " + request.SessionId);
                            }
                        });
                    }
                });
            }else{
                callback(handlingResource);
            }

            break;

        default:
            var result = util.format('SessionId:: %s ::: HandlingResource:: %s', request.SessionId, handlingResource);
            console.log(result);

            var hrOtherData = JSON.parse(handlingResource);
            var postDataString = {Company: request.Company.toString(), Tenant: request.Tenant.toString(), ServerType: request.ServerType, RequestType: request.RequestType, SessionID: request.SessionId, OtherInfo: request.OtherInfo, ResourceInfo: hrOtherData };


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
                        Tenant:Tenant.toString(),
                        ServerType: request.ServerType,
                        RequestType: request.RequestType,
                        SessionID: request.SessionId,
                        OtherInfo: request.OtherInfo,
                        ResourceInfo: resInfoData
                    };
                }catch(ex){
                    console.log(ex);
                }
            }

            callback(postDataString);
            break;
    }
};

module.exports.ContinueArds = ContinueArds;