module.exports = {
	"Redis":
	{
		"mode":"sentinel",//instance, cluster, sentinel
		"ip": "",
		"port": 6389,
		"user": "",
		"password": "",
		"db":6,
		"sentinels":{
			"hosts": "",
			"port":16389,
			"name":"redis-cluster"
		}

	},
	"Services" : {
		"accessToken":"",
		"routingServiceHost": "127.0.0.1",
		"routingServicePort": "2223",
		"routingServiceVersion": "1.0.0.0",
		"resourceServiceHost": "",
		"resourceServicePort": "8832",
		"resourceServiceVersion": "1.0.0.0",
		"notificationServiceHost": "",
		"notificationServicePort": "8831",
		"notificationServiceVersion": "1.0.0.0",
		"ardsMonitoringServiceHost": "",//ardsmonitoring.app.veery.cloud
		"ardsMonitoringServicePort": "2225",
		"ardsMonitoringServiceVersion": "1.0.0.0",
		"cronurl": "",//scheduleworker.app.veery.cloud
		"cronport": "2225",
		"cronversion": "1.0.0.0"
	},
	"Host": {
		"LBIP":"127.0.0.1",
		"LBPort":"8828",
	    "Ip": "127.0.0.1",
	    "Port": "8828",
	    "Version": "1.0.0.0",
		"UseMsgQueue": 'false',
		"UseDashboardMsgQueue": 'false'
	},
	"DB": {
	    "Type": "postgres",
	    "User": "",
	    "Password": "",
	    "Port": 5432,
	    "Host": "",
	    "Database": ""
	},
	"Security":
	{

		"ip" : "",
		"port": 6389,
		"user": "",
		"password": "",
		"mode":"sentinel",//instance, cluster, sentinel
		"sentinels":{
			"hosts": "",
			"port":16389,
			"name":"redis-cluster"
		}
	},
	"RabbitMQ":
	{
		"ip": "",
		"port": 5672,
		"user": "",
		"password": "",
		"vhost":'/'
	}
};
