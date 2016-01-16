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
			channel:subscription.channel,//array of channels
			broadcast_presence:subscription.broadcast_presence || false,
			onSubscribe:subscription.onSubscribe || function(){}
		}
		messaging.socket.emit("subscribe",subscription,function(response){
			//keep the list of subscribed channels in the current session
			if(!messaging.joined_channels){
				messaging["joined_channels"] = [];
			}
			for(i in subscription.channel){
				var shouldPush = true;
				for(j in messaging.joined_channels){
					if(messaging.joined_channels[j] == subscription.channel[i]){
						shouldPush = false;
					}
				}
				if(shouldPush){
					messaging.joined_channels.push(subscription.channel[i]);		
				}
			}
			
			//handle callback from the client
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
		if(event == "connect"){
			messaging.socket.once(event,function(response){
				callback(response)
			})
		}else{
			messaging.socket.on(event,function(response){
				callback(response)
			})
		}
	},
	setState:function(state){
		messaging.socket.emit("state",state);
	}
}