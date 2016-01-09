var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),

app.use('/', express.static(__dirname + '/public'));
app.listen(3000, function() { console.log('listening')});
// server.listen(process.env.PORT || 3000);