var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

var port = process.env.PORT || 3000;
io.on('connection', function(socket){
  console.log('a user connected');
});
app.use('/', express.static(__dirname + '/public'));
server.listen(port, function() { console.log('listening on port '+port)});