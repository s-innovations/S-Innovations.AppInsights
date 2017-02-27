# AppInsights QueryTool

I wanted to be able to extract graphs from application insights from a API. Since no current solution is ready yet - I made a small tool, or proof of concept that solves the problem. It runs in docker using dotnet core and can extract queries and render it as timechart currently.

https://twitter.com/pksorensen/status/836293950663241728


![Wanted Result](https://pbs.twimg.com/media/C5scVYtWYAIZdPo.png:large)
![Run in docker](https://pbs.twimg.com/media/C5scuKsXEAAxfGR.jpg:large)
![output in file share](https://pbs.twimg.com/media/C5scz06XQAA4FqQ.jpg:large)
![Current Result](https://pbs.twimg.com/media/C5sc3xJWcAEItxy.jpg:large)

## Build
```
dotnet restore
dotnet publish --framework netcoreapp1.1 -c Release -o out
docker -H localhost:2375 build -t s-innovations/app-insights-query-tool
```

## run 
```
docker -H 172.16.0.5:2375 run --rm  -v $(docker -H 172.16.0.5:2375 volume create -d azurefile -o share=test):/data s-innovations/app-insights-query-tool <appid> <appkey> "traces | where  timestamp > ago(7d) | where customDimensions.MessageTemplate == 'Dequeued {@queueItem} with {id} queue lenght: {queueLenght}' | summarize max(todouble(customDimensions.queueLenght)) by bin(timestamp, 120m) | render timechart"
```
