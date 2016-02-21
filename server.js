require('newrelic');
var express = require('express');
var app = express();
var server = require('http').createServer(app);

var port = process.env.PORT;

app.use('/', express.static(__dirname + '/public'));
server.listen(port, function() { console.log('listening on port: '+port)});
