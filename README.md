# StreamScope
Client-management service for video-streaming applications

# Examples of query from user
for publishing:
```
POST
server:port/streamscopeapi/v1/stream/publish
```
return: JSON 

if allow:
{
	data: {
		streamUrl: ”rtsp://”
		streamName:” ” 
    }
}

or if not allow:
{
	error: {
		code:” ”
		message:” ”
    }
}


for streaming:
```
POST
server:port/streamscopeapi/v1/stream/play?id=[streamName]&preview=[true/false] 
```
return: JSON

{
	data:	{
		streamUrl: ”rtsp://”
		streamName:” ” 
    }
}


for streams list:
```
GET 
server:port/streamscopeapi/v1/streams
```
return: 
JSON

{
    data:	{
		streams:[
			{
			name: “ ”
			duration: ” ” sec
			liveTime: “ ” sec
            }
        ]
    }
}


for snapshot:
```
server:port/streamscopeapi/v1/stream/snapshot?id=[streamName]
```
return:
png
# Examples of query from wowza media server
for publishing
```
GET http://streamscope:streamscopeport/streamscopeapi/v1/user/canPublish?app=streamscope&appinst=public&streamName=1_12345&sessionid=1121322
```
return { “data”: { “allowed” : true } }  … or allowed  may be false

for playing:
```
GET 
http://streamscope:streamscopeport/streamscopeapi/v1/user/canPlay?app=streamscope&appinst=public&streamName=1_12345&sessionid=1121322
```
return { “data”: { “allowed” : true } }  … or allowed  may be false

on stop playing
```
GET
http://streamscope:streamscopeport/streamscopeapi/v1/user/stopPlay?app=streamscope&appinst=public&streamName=1_12345&sessionid=1121322
```

on stop publishing
```
GET 
http://streamscope:streamscopeport/streamscopeapi/v1/user/stopPublish?app=streamscope&appinst=public&streamName=1_12345&sessionid=1121322
```
