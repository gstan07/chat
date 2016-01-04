
var chatApp = {
	config:{
		parse:{
			application_id:"YY9uLYQxngJOSZIEBENMVRD6bkOILotT4jzlAC0s",
			javascript_key:"ygnAofdXqnxM1fhdmrJsMhuHtZIvjTJjVhRJiXyl"
		},
		pubnub:{
			publish_key:"pub-c-50d40888-5464-40c6-8a63-3cdaf1c24694",
			subscribe_key:"sub-c-e79abdf4-ad90-11e5-ae71-02ee2ddab7fe",
		},
		allow_guest_user:true,
		main_channel_name:"main",
		warn_on_reload:false
	},
	init:function(){
		chatApp["private_messages"] = [];
		chatApp["scrollerheight"] = jQuery(window).height()-100;
		chatApp.uiBindings();
		Parse.initialize(
			chatApp.config.parse.application_id,
			chatApp.config.parse.javascript_key
		);
		if(chatApp.isUserAuthenticated()){
			//todo place user here
			chatApp.startChat();
		}else{
			chatApp.renderTemplate({
				template:"#loginscreen",
				onRender:function(content){
					jQuery("#chat_container").html(content);
					chatApp.spinner.hide();
					jQuery("#username").focus();
					if(chatApp.config.allow_guest_user){
						var guestname = "guest_"+Math.floor(Math.random()*1000);
						jQuery("#signinasguest").attr("data-guestname",guestname);
						jQuery("#signinasguest strong").html(guestname);
					}else{
						jQuery("#signinasguest").remove();
					}
				}
			});
		}
	},
	startChat:function(username){
		chatApp["chat_service"] = PUBNUB.init({
        	publish_key: chatApp.config.pubnub.publish_key,
        	subscribe_key: chatApp.config.pubnub.subscribe_key,
        	uuid:username
    	});
    	chatApp.subscribeToChannel({
    		channel:chatApp.config.main_channel_name,
    		onSubscribe:function(m){
    			//user subscribed to main channel
    			console.log("user subscribed to main channel",m)
    			//subscribing user to his private channel
    			chatApp.subscribeToChannel({
    				channel:chatApp.username,
    				onSubscribe:function(m){
    					//user subscribed to his private channel
    					console.log("user subscribed to his private channel channel",m)
    					//getting the users list on the main channel
    					chatApp.chat_service.here_now({
    						channel:chatApp.config.main_channel_name,
    						callback:function(m){
    							//list of users received
    							chatApp["main_channel_initial_state"] = m;
    							

    							//getting the history of the private channel
    							chatApp.chat_service.history({
    								channel:chatApp.username,
    								callback:function(m){
    									//history received
    									console.log("private channel history received",m)
    									//rendering chat
		    							chatApp.renderTemplate({
								    		template:"#chatwindow",
								    		data:{
								    			users:chatApp.main_channel_initial_state.uuids,
								    			mainchannelname:chatApp.config.main_channel_name,
								    			occupancy:chatApp.main_channel_initial_state.occupancy,
								    			username:chatApp.username
								    		},
								    		onRender:function(content){
								    			//rendering chat
								    			jQuery("#chat_container").html(content);
								    			jQuery("#mainchatscroller").css({
								    				"max-height":chatApp.scrollerheight
								    			});
								    			chatApp.updateChatWindow({
								    				
														from:"Chat admin",
														type:"text",
														text:"Hello, "+chatApp.username+"! Welcome to the chat!",
														channel:chatApp.config.main_channel_name,
														time:new Date().getTime()/1000
													
								    			})
								    			chatApp.spinner.hide();
								    			
								    		}
								    	});
    								}
    							});
    						}
    					})    					
    				},
    				onMessageReceived:function(m){
    					//own private channel
    					chatApp.onPrivateMessageReceived(m);

 						//chatApp.onPrivateMessageReceived(m);   					
    				}
    			});
    		},
    		onMessageReceived:function(m){
    			chatApp.updateChatWindow(m);
    		},
    		presence:function(m){
    			chatApp.listenToMainChannelPresence(m);
    		}
    	});
	},
	renderTemplate:function(view){
		var view = {
			template:jQuery(view.template).html(),
			destinationElement:jQuery(view.destinationElement),
			data:view.data || {},
			onRender:view.onRender || function(content){
				console.warn("no onrender method defined")
			}
		}
		var template = _.template(view.template);
		var rendered_content = template(view.data);
		view.onRender(rendered_content);
		
		
	},
	isUserAuthenticated:function(){
		return false;
	},
	registerUser:function(username,email,password){
		var user = new Parse.User();
		user.set("email",email);
		user.set("password",password);
		user.set("username",username);
		user.signUp(null,{
			success:function(user){
				chatApp.login(email,password);
			},
			error:function(user,error){
				console.log(user,error);
			}
		});
	},
	login:function(email,password){
		Parse.User.logIn(email,password,{
			success:function(user){
				console.log(user,"is signed in");
			},
			error:function(error,error){
				console.log(error)
			}
		});

	},
	spinner:{
		show:function(){
			jQuery("#chatapp .spinner").show();
		},
		hide:function(){
			jQuery("#chatapp .spinner").hide();
		}
	},
	subscribeToChannel:function(subscription){
		var subscription = {
			channel:subscription.channel || chatApp.config.main_channel_name,
			connect:subscription.onSubscribe,
			message:subscription.onMessageReceived,
			hearthbeat:subscription.hearthbeat,
			presence:subscription.presence
		}
		chatApp.chat_service.subscribe(subscription);
	},
	listenToMainChannelPresence:function(presence){
		jQuery("#main_occupancy").html(presence.occupancy);
		switch(presence.action){
			case "leave":
			case "timeout":
				chatApp.handleUserleave(presence.uuid);
			break;
			case "join":
				chatApp.handleUserJoin(presence.uuid);
			break;
		}
	},
	handleUserleave:function(user){
		//remove user from list
		jQuery("[data-tab=userslist] [data-user="+user+"]").remove();
		//todo: if the user have opened privates, notice his partners
		//todo:notice main chat
	},
	handleUserJoin:function(user){
		chatApp.renderTemplate({
			template:"#user_item_template",
			data:{user:user},
			onRender:function(content){
				//if the user is not in the list, add it
				
				if(jQuery("[data-tab=userslist] [data-user="+user+"]").length==0){
					var users_list = jQuery(".appview[data-tab='userslist'] .scroller");
					users_list.append(content);
				}
			}
		});
	},
	say:function(m){
		//send message to channel
		m.message["time"] = new Date().getTime()/1000;
		chatApp.chat_service.publish(m);
	},
	updateChatWindow:function(m){
		if(m.type == "text"){
			if(m.channel == chatApp.config.main_channel_name){
				var chat_window = jQuery(".scroller[data-channel='"+m.channel+"']");
			}
			if(chat_window.length == 1 && chat_window.find(".chatline[data-chatline-id='"+m.from+m.time+"']").length == 0){
					chatApp.renderTemplate({
					template:"#chatline",
					data:{
						user:m.from,
						message:m.text,
						time:m.time
					},
					onRender:function(content){
						jQuery(content).appendTo(chat_window);

						chat_window.animate({
							scrollTop:chat_window[0].scrollHeight
						})
						
					}
				});
			}
		}
	},
	updatePrivateNottificationBubble:function(){

		var unread_msgs = jQuery(".conversation.unread").length;
		var nottification_bubble = jQuery("[data-count]");
		nottification_bubble.attr("data-count",unread_msgs);
		nottification_bubble.html(unread_msgs);
	},
	openPrivateWindow:function(partner,channel){
		if(jQuery(".private_window").length == 0){
			
			var room_name = chatApp.getPrivateWindowName(partner,chatApp.username);
			
			chatApp.renderTemplate({
				template:"#private_conversation",
				data:{
					partner:partner,
					room:room_name,
					channel:channel
				},
				onRender:function(private_window_layout){
					jQuery(".conversation[data-room='"+room_name+"']").removeClass("unread");
					var wrapper_max_height = jQuery(window).height()-100;
					
					jQuery(private_window_layout).appendTo(".chatwindow");
					chatApp.updatePrivateNottificationBubble();
					//inserting history if exists
					jQuery(chatApp.private_messages).each(function(index,message){
						if(message.room == room_name){
							chatApp.renderTemplate({
								template:"#chatline",
								data:{
									user:message.from,
									message:message.text,
									time:message.time
								},
								onRender:function(content){
									content = jQuery(content);
									content.appendTo("#privatewindow[data-room='"+room_name+"'] .wrapper");
								}
							});
						}
					});

					jQuery(".private_window").find(".wrapper").css({
						"max-height":chatApp.scrollerheight
					})
				}
			});
		}
	},
	getPrivateWindowName:function(username1,username2){
		if(username1 && username2){
			var u1_num = 0;
			var u2_num = 0;
			for(var i=0; i <= username1.length-1; i++){
				//console.log(sum_str.charCodeAt(i));
				u1_num += username1.charCodeAt(i)*i;
			}
			for(var i=0; i <= username2.length-1; i++){
				//console.log(sum_str.charCodeAt(i));
				u2_num += username2.charCodeAt(i)*i;
			}
			if(u1_num >= u2_num){
				var uid =  u1_num.toString()+u2_num.toString();
			}else{
				var uid =  u2_num.toString()+u1_num.toString();
			}	
			return uid;
		}else{
			console.warn("missing arguments for getprivatewindowname");
		}
		

	},
	onPrivateMessageReceived:function(m){
		//check if the current user should see the message
		
		if(m.from == chatApp.username || //from the current user
			m.channel == chatApp.username || //to the current user
			m.room == chatApp.getPrivateWindowName(m.from,chatApp.username)){//from partner in conversation with the current user
			chatApp.private_messages.push(m);
			//update private chat window if necesary
			var private_window = jQuery(".private_window[data-room='"+m.room+"']");
			if(private_window.length == 1){
				chatApp.renderTemplate({
					template:"#chatline",
					data:{
						user:m.from,
						message:m.text,
						time:m.time
					},
					onRender:function(content){
						var private_window_scroller = private_window.find(".wrapper")
						jQuery(content).appendTo(private_window_scroller)
						private_window_scroller.animate({
							scrollTop:private_window_scroller[0].scrollHeight
						})
					}
				});
			}
			//update conversations list
			jQuery(chatApp.private_messages).each(function(index,message){
				if(message.from == chatApp.username){
					var partner = message.channel;
					var from = "you";
				}else{
					var partner = message.from;
					var from = message.from;
				}

				var room_name = message.room;
				
				var conversation_item = jQuery(".conversation[data-room='"+room_name+"']");
				if(conversation_item.length == 0){
					// console.log("will render new conversation item because: ",room_name,conversation_item,message);
					chatApp.renderTemplate({
						template:"#conversation_user",
						data:{
							partner:partner,
							user:partner,
							lastmessagefrom:from,
							room:room_name,
							lastmessage:message.text,
							lastmessagetime:message.time,
							channel:message.channel
						},
						onRender:function(content){
							jQuery(".conversations_container .empty").remove();
							jQuery(content).appendTo(".conversations_container");
							if(private_window.length == 0){
								console.log(room_name,jQuery(".conversation[data-room='"+room_name+"']").length,"unread");
								//jQuery(".conversation[data-room='"+room_name+"']").addClass("unread");
								jQuery(".conversation[data-room='"+room_name+"']").remove();
							}
						}
					});
				}else{
					conversation_item.find(".lastmsg .from").html(from);
					conversation_item.find(".lastmsg .message").html(message.text);
					conversation_item.find(".lastmsg .time").attr("data-livestamp",message.time);
					if(private_window.length == 0){
						jQuery(".conversation[data-room='"+room_name+"']").addClass("unread");
					}
				}
				
			});
			chatApp.updatePrivateNottificationBubble();
		}
	},
	uiBindings:function(){
		


		//click on the register link
		jQuery(document).on("click","#register",function(){
			chatApp.renderTemplate({
				template:"#registerscreen",
				onRender:function(content){
					jQuery("#chat_container").html(content);
					jQuery("#username").focus();
				}
			});
		});
		//back to login from register view
		jQuery(document).on("click","#backtologin",function(){
			chatApp.renderTemplate({
				template:"#loginscreen",
				onRender:function(content){
					jQuery("#chat_container").html(content);
					jQuery("#username").focus();
				}
			});
		});
		//submitting the register form
		jQuery(document).on("submit","#registerform",function(e){
			e.preventDefault();
			var username = jQuery("#register_username").val();
			var email= jQuery("#register_email").val();
			var password = jQuery("#register_password").val();
			chatApp.registerUser(username,email,password);
		});
		//click to sign in as guest
		jQuery(document).on("click","#signinasguest",function(){
			chatApp["username"] = jQuery(this).attr("data-guestname");
			chatApp.spinner.show();
			chatApp.startChat(chatApp.username);
		});
		//try to prevent reload
		if(chatApp.config.warn_on_reload){
			window.onbeforeunload = function(e) {
        		return "There is no need for reload, you know that, don't you?";
    		}
		}
		//switch app views
		jQuery(document).on("click",".tab[data-tab]",function(){
			//jQuery(".private_window").addClass("quiet");
			jQuery("div[data-tab]").hide();
			var tab_to_show = jQuery(this).attr("data-tab");
			jQuery("[data-tab='"+tab_to_show+"']").css({
				"display":"block"
			});
			jQuery(".tab[data-tab]").removeClass("selected");
			jQuery(".private_window").addClass("quiet");
			jQuery(".conversations_container").css({
					"overflow-y":"scroll",
						"position":"fixed"
				});
			jQuery(this).addClass("selected");
			
		});
		//typing the input
		jQuery(document).on("keyup",".footer input",function(e){
			//toggle the button
			var input = jQuery(this);
			var channel = input.attr("data-channel");
			var button =input.closest(".footer").find(".sayitbutton");

			if(input.val()!=""){
				button.css({"visibility":"visible"})
			}else{
				button.css({"visibility":"hidden"})
			}
			//send message on enter
			if(e.keyCode == 13 && input.val()!=""){//enter
				button.css({"visibility":"hidden"});
				chatApp.say({
					message:{
						from:chatApp.username,
						room:jQuery(this).closest("[data-room]").attr("data-room"),
						type:"text",
						text:input.val(),
						channel:channel
					},
					channel:channel
				});
				input.val("");
			}else if(e.keyCode == 38  && input.val() == ""){
				// bring back last message for resending
				var last_message_on_channel = jQuery(".scroller[data-channel='"+channel+"'] .chatline[data-author='"+chatApp.username+"']").last().find(".message");
				if(last_message_on_channel.length == 1){
					input.val(last_message_on_channel.html());
					button.css({"visibility":"visible"})
				}
				
			}

		})
		//clicking the button
		jQuery(document).on("click",".sayitbutton",function(e){
			var input = jQuery(this).closest(".footer").find("input");
			if(input.val()!=""){
				var channel = input.attr("data-channel");
				var room = input.closest("[data-room]").attr("data-room");
				chatApp.say({
					message:{
						from:chatApp.username,
						room:room,
						type:"text",
						text:input.val(),
						channel:channel
					},
					channel:channel
				});
				jQuery(this).css({
					"visibility":"hidden"
				});	
				input.val("");
				//input.focus();
			}
		})

		//clicking a user
		jQuery(document).on("click","[data-user]",function(){
			var partner = jQuery(this).attr("data-user");
			if(partner != chatApp.username){
				//jQuery(".private_window").addClass("quiet");
				chatApp.openPrivateWindow(partner,partner);
			
				if(partner != chatApp.username){
					chatApp.subscribeToChannel({
						channel:partner,
						onSubscribe:function(){
							console.log(chatApp.username+" subscribed to private channel of "+ partner);
						},
						onMessageReceived:function(m){
							//partner private channel
							chatApp.onPrivateMessageReceived(m);
							//chatApp.updateChatWindow(m);
						}
					});
				}
			}
		});
		//open private window from conversations list
		jQuery(document).on("click",".conversation[data-room]",function(){
			var partner = jQuery(this).attr("data-partner");
			var channel = jQuery(this).attr("data-channel");

			chatApp.openPrivateWindow(partner,channel);
			
		});

		//toggle private window
		jQuery(document).on("click","#closeprivatewindow",function(e){
			jQuery("#privatewindow").remove();
		});
	}
} 
jQuery(document).ready(function(){
	chatApp.init();
});