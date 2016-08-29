module.exports = {
	"Redis":{
		"redisip":"192.168.51.243",
		"redisport":6379,
		"redisdb":6,
		"password":"DuoS123"
	},
	"Services" : {
		"accessToken":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJmcm9kb29kIiwianRpIjoiMDIxYzQ4MWEtNTUxMC00MzlkLTk1YjgtZWY5OTY3MmY1ZmFhIiwic3ViIjoiNTZhOWU3NTlmYjA3MTkwN2EwMDAwMDAxMjVkOWU4MGI1YzdjNGY5ODQ2NmY5MjExNzk2ZWJmNDMiLCJleHAiOjIzMzQxMjMzNjAsInRlbmFudCI6LTEsImNvbXBhbnkiOi0xLCJzY29wZSI6W3sicmVzb3VyY2UiOiJhbGwiLCJhY3Rpb25zIjoiYWxsIn1dLCJpYXQiOjE0NzAyMDk3NjB9.Wh-E2OVg6nwsicj9yQdx92js6rPg6pzkZkmwk69FHmc",
		"routingServiceHost": "ardsliteroutingengine.pickme.lk",
		"routingServicePort": "2223",
		"routingServiceVersion": "1.0.0.0",
		"resourceServiceHost": "resourceservice.pickme.lk",
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
	    "User": "pickme",
	    "Password": "DuoS123",
	    "Port": 5432,
	    "Host": "192.168.51.241",
	    "Database": "pickme"
	},
	"Security": {
		"ip" : "192.168.51.243",
		"port": 6379,
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