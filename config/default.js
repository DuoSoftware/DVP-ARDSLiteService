﻿module.exports = {
	"Redis":{
		"redisip":"45.55.142.207",
		"redisport":6389,
		"redisdb":6,
		"password":"DuoS123"
	},
	"Services" : {
		"accessToken":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJkaW51c2hhZGNrIiwianRpIjoiMjViZjZmZTItZjZjNC00ZWJhLWFmODgtNmMxNjIxOTU4OGRiIiwic3ViIjoiNTZhOWU3NTlmYjA3MTkwN2EwMDAwMDAxMjVkOWU4MGI1YzdjNGY5ODQ2NmY5MjExNzk2ZWJmNDMiLCJleHAiOjE4OTI0NDE2NzIsInRlbmFudCI6MSwiY29tcGFueSI6Mywic2NvcGUiOlt7InJlc291cmNlIjoiYWxsIiwiYWN0aW9ucyI6ImFsbCJ9XSwiaWF0IjoxNDYwNDM4MDcyfQ.aPoVPiTtoGFgnKmhdLBTzwTrQRTGWWliYujHP5NONqU",
		"routingServiceHost": "ardsliteroutingengine.104.131.67.21.xip.io",
		"routingServicePort": "2223",
		"routingServiceVersion": "1.0.0.0",
		"resourceServiceHost": "resourceservice.104.131.67.21.xip.io",
		"resourceServicePort": "8831",
		"resourceServiceVersion": "1.0.0.0"
	},
	"Host": {
		"LBIP":"127.0.0.1",
		"LBPort":"8828",
	    "Ip": "127.0.0.1",
	    "Port": "8828",
	    "Version": "1.0.0.0"
	},
	"DB": {
	    "Type": "postgres",
	    "User": "duo",
	    "Password": "DuoS123",
	    "Port": 5432,
	    "Host": "104.236.231.11",
	    "Database": "duo"
	},
	"Security": {
		"ip" : "45.55.142.207",
		"port": 6389,
		"password":"DuoS123"
	},
	"RabbitMQ":
	{
		"ip": "45.55.142.207",
		"port": 5672,
		"user": "guest",
		"password": "guest"
	}
};