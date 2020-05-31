var util = require('util');
var redisHandler = require('dvp-ardscommon/RedisHandler.js');
var sortArray = require('dvp-ardscommon/CommonMethods.js');
var reqQueueHandler = require('dvp-ardscommon/ReqQueueHandler.js');
var preProcessHandler = require('dvp-ardscommon/PreProcessor.js');
var contArdsHandler = require('./ContinueArdsProcess.js');
var logger = require("dvp-common-lite/LogHandler/CommonLogHandler.js").logger;
var requestHandler = require('dvp-ardscommon/RequestHandler.js');

var AddRequest = function (logKey, reqPreObj, callback) {
    try {
        preProcessHandler.execute(logKey, reqPreObj, function (err, requestObj) {
            if (err) {
                logger.error(err);
                callback(err, null, 0);
            }
            else {
                logger.info('%s ************************* Start AddRequest *************************', logKey);

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
                        logger.error(err);
                        callback(err, null, 0);
                    }
                    else {

                        switch (requestObj.ReqHandlingAlgo) {
                            case "QUEUE":
                                var replyObj = {};
                                reqQueueHandler.AddRequestToQueue(logKey, requestObj, function (err, result, qPosition) {
                                    if (err) {
                                        logger.error(err);
                                        replyObj = {Position: qPosition, QueueName: requestObj.QueueName, Message: "Add Request to Queue Failed. sessionId :: " + requestObj.SessionId};
                                        callback(err, replyObj, vid);
                                    }
                                    else {
                                        logger.info("Request added to queue. sessionId :: " + requestObj.SessionId);
                                        replyObj = {Position: qPosition, QueueName: requestObj.QueueName, Message: "Request added to queue. sessionId :: " + requestObj.SessionId};
                                        callback(err, replyObj, vid);
                                    }
                                });
                                break;
                            case "DIRECT":
                                requestHandler.SetRequestState(logKey, requestObj.Company, requestObj.Tenant, requestObj.SessionId, "N/A", function (err, result) {
                                    if (err) {
                                        logger.error(err);
                                    }
                                    contArdsHandler.ContinueArds(requestObj, function (err, handlingResource) {
                                        callback(err, handlingResource, vid);
                                    });
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
        logger.error(ex2);
        callback(ex2, null, 0);
    }
};


module.exports.AddRequest = AddRequest;