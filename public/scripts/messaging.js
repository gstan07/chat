//this will wrap over socket io
var messaging = {
	init:function(app_key){
			messaging.openSocket(app_key);	
		
		
	},
	openSocket:function(app_key){
		
		this["socket"] = io("/"+app_key,{
			 'reconnection': true
		});
		
		
		this["socket"].on('connect', function(){
			

			//set the initial state
			messaging.socket.emit("initial_state",messaging.user_state);
			//connect to the main chat room
		});


		 


		
	},
	subscribeToChannel:function(subscription){
		subscription = {
			channel:subscription.channel,
			broadcast_presence:subscription.broadcast_presence || false,
			onSubscribe:subscription.onSubscribe || function(){}
		}
		messaging.socket.emit("subscribe",subscription,function(response){

			subscription.onSubscribe(response);	
		});
	},
	sendMessage:function(messageObj,callback){
		this.socket.emit("message",messageObj,function(response){
			try{
				callback(response)
			}catch(err){}
		});
	},
	getUserList:function(data,callback){
		this.socket.emit("user_list",data,function(response){
			try{
				callback(response);
			}catch(err){}
			
		});
	},
	handleEvent:function(event,callback){
		messaging.socket.on(event,function(response){
			callback(response)
		})
	}
}