//this will wrap over socket io
var messaging = {
	init:function(onConnect){
			messaging.openSocket(onConnect);	
		
		
	},
	openSocket:function(onConnect){
		this["socket"] = io("/"+messaging.config.app_key);
		this["socket"].on('connect', function(){
			

			//set the initial state
			messaging.socket.emit("initial_state",messaging.user_state);
			//connect to the main chat room
		});
		messaging.user_state["idle"] = false;
		messaging.user_state["isTyping"] = false;
		try{
			onConnect();
		}catch(err){}
	},
	handlePresence:function(callback){
		messaging.socket.on("presence",function(presence){
				callback(presence);
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
	getUserList:function(data){
		this.socket.emit("user_list",data,function(response){
			console.log(response)
		});
	},
	handleReceivedMessage:function(callback){
		messaging.socket.on("message",function(message){
			callback(message);
		})
	}
}