var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);


app.use('/', express.static(__dirname + '/public'));
var port = process.env.PORT || 3000;

app.listen(port, function() { console.log('listening')});