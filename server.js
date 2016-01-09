var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

var port = process.env.PORT || 3000;

app.use('/', express.static(__dirname + '/public'));
app.listen(port, function() { console.log('listening')});