var util = require('util');
var redisHandler = require('dvp-ardscommon/RedisHandler.js')
var sortArray = require('dvp-ardscommon/CommonMethods.js');
var reqQueueHandler = require('dvp-ardscommon/ReqQueueHandler.js');
var preProcessHandler = require('dvp-ardscommon/PreProcessor.js');
var contArdsHandler = require('./ContinueArdsProcess.js');
var infoLogger = require('dvp-ardscommon/InformationLogger.js');
var requestHandler = require('dvp-ardscommon/RequestHandler.js');

var AddRequest = function (logKey, reqPreObj, callback) {
    try {
        preProcessHandler.execute(logKey, reqPreObj, function (err, requestObj) {
            if (err) {
                console.log(err);
            }
            else {
                infoLogger.DetailLogger.log('info', '%s ************************* Start AddRequest *************************', logKey);

                var key = util.format('Request:%d:%d:%s', requestObj.Company, requestObj.Tenant, requestObj.SessionId);
                var tag = ["company_" + requestObj.Company, "tenant_" + requestObj.Tenant, "class_" + requestObj.Class, "type_" + requestObj.Type, "category_" + requestObj.Category, "sessionid_" + requestObj.SessionId, "reqserverid_" + requestObj.RequestServerId, "priority_" + requestObj.Priority, "servingalgo_" + requestObj.ServingAlgo, "handlingalgo_" + requestObj.HandlingAlgo, "selectionalgo_" + requestObj.SelectionAlgo, "objtype_Request"];

                var tempAttributeList = [];
                for (var i in requestObj.AttributeInfo) {
                    var atts = requestObj.AttributeInfo[i].AttributeCode;
                    for (var j in atts) {
                        tempAttributeList.push(atts[j]);
                    }
                }
                var sortedAttributes = sortArray.sortData(tempAttributeList);
                for (var k in sortedAttributes) {
                    tag.push("attribute_" + sortedAttributes[k]);
                }

                var jsonObj = JSON.stringify(requestObj);
                redisHandler.AddObj_V_T(logKey, key, jsonObj, tag, function (err, reply, vid) {
                    if (err) {
                        console.log(err);
                        callback(err, null, 0);
                    }
                    else {
                        requestHandler.SetRequestState(logKey, requestObj.Company, requestObj.Tenant, requestObj.SessionId, "N/A", function (err, result) {
                            if (err) {
                                console.log(err);
                            }
                        });
                        switch (requestObj.ReqHandlingAlgo) {
                            case "QUEUE":
                                var replyObj = {};
                                reqQueueHandler.AddRequestToQueue(logKey, requestObj, function (err, result, qPosition) {
                                    if (err) {
                                        console.log(err);
                                        replyObj = {Position: qPosition, Message: "Add Request to Queue Failed. sessionId :: " + requestObj.SessionId};
                                        callback(err, replyObj, vid);
                                    }
                                    else {
                                        console.log("Request added to queue. sessionId :: " + requestObj.SessionId);
                                        replyObj = {Position: qPosition, Message: "Request added to queue. sessionId :: " + requestObj.SessionId};
                                        callback(err, replyObj, vid);
                                    }
                                });
                                break;
                            case "DIRECT":
                                contArdsHandler.ContinueArds(requestObj, function (err, handlingResource) {
                                    callback(err, handlingResource, vid);
                                });
                                break;
                            default:
                                callback(err, "No ReqHandlingAlgo Found.", vid);
                                break;
                        }
                    }
                });
            }
        });
    }catch (ex2) {
        console.log(ex2)
    }
};


module.exports.AddRequest = AddRequest;