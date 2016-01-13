var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server,{
	// 'pingInterval': 360000,
	// 'pingTimeout': 360000
});

var port = process.env.PORT || 3000;

app.use('/', express.static(__dirname + '/public'));
server.listen(port, function() { console.log('listening on port '+port)});

var nsp = io.of("/plmplmplm");//todo:get this from the client
nsp.on('connection', function(socket){

	
	socket.on("subscribe",function(data,callback){
		//joining room
		try{
			var total_rooms = data.channel.length;
			for(i = 0; i <= total_rooms; i++){
				if(i<total_rooms){
					socket.join(data.channel[i]);
				}else{
					socket.join(data.channel[i],function(){
						callback("Success, user connected to channel:"+data.channel)
					});	
				}
				
			}
			//broadcast join event to all the users but current
			if(data.broadcast_presence){			
				socket.broadcast.emit('presence',{
					action:"join",
					user:socket.state,
					// occupancy:Object.keys(nsp.connected).length
				});
			}
		}catch(err){
			console.log("error subscribing",err);
		}
		
		
		
	});
	socket.on("state",function(data){
		socket["state"] = data;
	});
 	socket.on("disconnect",function(){
 		try{
 			// console.log("disconnected",socket.id);
 			nsp.emit("presence",{
				action:"leave",
				user:socket.state,
				// occupancy:Object.keys(nsp.connected).length
			})
		}catch(err){
			console.log("error emitting leave event",err);
		}
 	});

 	socket.on("user_list",function(data,callback){
 		try{
	 		var room = data.channel;
	 		var users = [];
	 		
			for(var id in nsp.connected){
				if(nsp.connected[id].rooms[room]){
					users.push(nsp.connected[id].state)	
				}
			}
			callback(users);	
 		}catch(err){
 			console.log("error getting user list",err);
 		}
 		
 	});
 	socket.on("message",function(data,callback){
 		
 		//send the message to all sockets in the room, including sender
 		try{
 			nsp.in(data.channel).emit("message",data);
	 	}catch(err){
	 		console.log("error broadcasting message ",err);	
	 	}
 	})
});
