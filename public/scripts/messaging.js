//this will wrap over socket io
var messaging = {
	init:function(opts){
			messaging.openSocket(opts);	
		
		
	},
	openSocket:function(opts){
		this["socket"] = io.connect("/"+opts.app_key,{
			 'reconnection': true
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
	},
	setState:function(state){
		messaging.socket.emit("state",state);
	}
}