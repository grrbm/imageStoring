curl -X PUT -w "%{http_code}\n" -F file=@"../samples/image1.jpg" http://localhost:8080/api/update
