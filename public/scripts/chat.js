
var chatApp = {
	config:{
		ospry:{
			public_key:"pk-prod-ugibyydpxqzrmawwx4avbpu0"
		},
		messaging:{
			app_key:"plmplmplm"
		},
		allow_guest_user:true,
		main_channel_name:"mainchat",
		warn_on_reload:false,
		//admin_image:"https://cdn2.iconfinder.com/data/icons/users-6/100/USER1-128.png",
		admin_image:"images/avatars/generic.jpeg",
		guest_image:[
			"images/avatars2/images/avatars_01.png",
			"images/avatars2/images/avatars_02.png",
			"images/avatars2/images/avatars_03.png",
			"images/avatars2/images/avatars_04.png",
			"images/avatars2/images/avatars_05.png",
			"images/avatars2/images/avatars_06.png",
			"images/avatars2/images/avatars_07.png",
			"images/avatars2/images/avatars_08.png",
			"images/avatars2/images/avatars_09.png",
			"images/avatars2/images/avatars_10.png"
			][Math.floor(Math.random() * 10)],
		admin_username:"System",
		use_animations:true,
		private_window_animation_in:"slideInRight",//animate.css
		private_window_animation_out:"slideOutLeft",//animate.css
		lastmessage_length_to_show:30,
		thumbnail_width:100,
		message_max_length:100,
		enableBots:false
	},
	init:function(){



		chatApp["message_history"] = {};
		chatApp["scrollerheight"] = jQuery(window).height()-100;
		chatApp["system"] = chatApp.getSystem();
		chatApp.uiBindings();
		
		if(chatApp.isUserAuthenticated()){
			//todo place user here
			chatApp.renderTemplate({
				template:"#authenticated_user",
				data:chatApp.userstate,
				onRender:function(content){
					jQuery("#chat_container").html(content);
					chatApp.spinner.hide();
				}
			});
			// chatApp.startChat();
		}else{
			chatApp.spinner.show()
			chatApp.renderTemplate({
				template:"#startscreen",
				
				onRender:function(content){

					jQuery("#chat_container").html(content);
					chatApp.spinner.hide()
					jQuery("#usernameform").validate({
						rules:{
							username:{
								minlength:3,
								maxlength:12
							}
						},
						errorPlacement: function(error, element) {
						    if(element.closest(".row").length == 1) {
						      error.insertAfter(element.closest(".row"));
						    }else {
						      error.insertAfter(element);
						    }
						 },
						submitHandler:function(){
							chatApp.analytics("general","usernamechosen",jQuery("#username").val());
							chatApp.spinner.show()
							var avatars = [];
							for(i=1;i<=81;i++){
								var count = (i<10)? "0"+i : i;
								avatars.push("images/avatars2/images/avatars_"+count+".png");
							}
							chatApp.renderTemplate({
								template:"#chooseavatar",
								data:{
									avatar:avatars,
									username:jQuery("#username").val()
								},
								onRender:function(content){
									jQuery("#chat_container").html(content);
									jQuery("#chat_container").imagesLoaded(function(){
										chatApp.spinner.hide()
										jQuery("#avatars").animate({
											scrollTop:400
										},1000);
									});
									
									jQuery("#avatarchoice").validate({
										ignore: [],
										messages:{
											avatar:"Please choose an avatar"
										},
										submitHandler:function(){
											chatApp.analytics("general","avatarchosen",jQuery("#choosenavatar").val());
											chatApp.spinner.show();
											chatApp["userstate"] = {
												name:jQuery("#username").val(),
												avatar:jQuery("#choosenavatar").val(),
												idle:false,
												isTyping : false,
												isGuest:true,
												clientId:Math.random()
											};
											chatApp.startChat();
										}
									});
								}
							});
						}
					});
					jQuery("#avatars").scrollLeft(4000);
					// chatApp.spinner.hide();
					jQuery("#username").focus();
					
				}
			});
		}
	},
	startChat:function(){


		messaging.init({
			app_key:chatApp.config.messaging.app_key
		});
		messaging.handleEvent("connect",function(r){
			console.log("socket connected");
			//socket connected
			messaging.setState(chatApp.userstate);
			messaging.subscribeToChannel({
				//subscribing to the main channel and own private channel
	    		channel:[chatApp.config.main_channel_name,chatApp.userstate.name],
	    		broadcast_presence:true,
	    		onSubscribe:function(m){
	    			messaging.getUserList({
						channel:chatApp.config.main_channel_name
					},function(users){
						for(i in users){
							if(users[i].name == chatApp.userstate.name){
								if(users[i].clientId != chatApp.userstate.clientId){
									//duplicate user
									alert("Someone with this username is already connected")
									window.location.reload();
								}
							}
						}
						//user list received
						messaging.handleEvent("presence",function(presence){
							chatApp.listenToMainChannelPresence(presence);
						});
						messaging.handleEvent("message",function(m){
							chatApp.pushInLocalHistory(m);
							chatApp.parseHistory({
								animateScroll:true
							})
						});
						chatApp.renderTemplate({
							    		template:"#chatwindow",
							    		data:{
							    			mainchannelname:chatApp.config.main_channel_name,
							    			occupancy:users.length,
							    			username:chatApp.userstate.name,
							    			userimage:chatApp.userstate.avatar,
							    			inputmaxlength:chatApp.config.message_max_length
							    		},
							    		onRender:function(content){
							    			//rendering chat
							    			
							    			jQuery("#chat_container").html(content);
							    			jQuery("#mainchatscroller").css({
							    				"max-height":chatApp.scrollerheight
							    			});
							    			chatApp.pushInLocalHistory({
													from:chatApp.config.admin_username,
													type:"text",
													text:"Hello, "+chatApp.userstate.name+"! Welcome to the chat!",
													channel:chatApp.config.main_channel_name,
													time:new Date().getTime(),
													avatar:chatApp.config.admin_image
												
							    			});
							    			chatApp.parseHistory({
							    				animateScroll:true
							    			});
							    			if(chatApp.config.enableBots){
												jQuery.getJSON("scripts/bots.json",function(data){
													jQuery.each(data,function(index,value){
														users.push(value);
													});
													chatApp.updateUsersList(users);
												});
											}else{
							    				chatApp.updateUsersList(users);
							    			}
							    			jQuery("body").css({
							    				"background-image":"none"
							    			});
							    			chatApp.analytics("general","startchat",chatApp.userstate.name);
							    			Cookies.set('userstate', JSON.stringify(chatApp.userstate),{
							    				expires:365
							    			});
							    			chatApp.spinner.hide();
							    			
							    		}
							    	});
					});
	    		}
    		});
		});
		messaging.handleEvent("error",function(response){
			console.log("error: "+response);
		})
		messaging.handleEvent("disconnect",function(response){
			chatApp.spinner.show({
	  			style:"small",
	  			msg:"disconnected"
	  		});
		})
		messaging.handleEvent('reconnecting', function (response) {
		    
	  		chatApp.spinner.show({
	  			style:"small",
	  			msg:"attempting to reconnect..."
	  		});
	  	});
	  	messaging.handleEvent('connect_error', function (response) {
		    
	  		console.log("connect error");
	  	});

	  	messaging.handleEvent('reconnect', function (response) {
		    messaging.setState(chatApp.userstate);
	  		messaging.subscribeToChannel({
	  			//reconnecting joined channels
		    	channel:messaging.joined_channels,
		    	broadcast_presence:true,
		    	onSubscribe:function(response){
		    		console.log(response);
		    		messaging.getUserList({
    					channel:chatApp.config.main_channel_name
    				},function(users){
		    			if(chatApp.config.enableBots){
							jQuery.getJSON("scripts/bots.json",function(data){
								jQuery.each(data,function(index,value){
									users.push(value);
								});
								chatApp.updateUsersList(users);
							});
						}else{
    						chatApp.updateUsersList(users);
    					}
    					//getting history but not from main chat channel
    					

    					messaging.history({
    						channels:messaging.joined_channels
    					},function(history){
    						for(var i in history){
    							chatApp.pushInLocalHistory(history[i]);
    						}
    						chatApp.parseHistory({
    							animateScroll:false
    						});
    						chatApp.spinner.hide();
    					});
    					
    				})
		    	}
		    });
	  	});
	  	messaging.handleEvent("invitation",function(invitation){
	  		console.log("accepting invitation...",invitation)
	  		messaging.subscribeToChannel({
	  			channel:[invitation.channel],
	  			onSubscribe:function(r){
	  				console.log(r);
	  				//get channel history
  					messaging.history({
  						channels:[invitation.channel]
  					},function(history){
  						for(var i in history){
  							chatApp.pushInLocalHistory(history[i]);
  						}
  						chatApp.parseHistory({
  							animateScroll:false
  						});
  					});
	  				
	  			}
	  		});
	  	});

	  	messaging.handleEvent("seen",function(data){
	  		console.log("seenevent",data);
	  		//if the message is on the screen set dom status as seen
	  		chatApp.message_history[data.message].status = "seen";
	  		chatApp.message_history[data.message].seen_at = data.seen_at;
	  		message = chatApp.message_history[data.message];
	  		
	  		chatApp.renderTemplate({
	  			template:"#chatline",
	  			data:message,
	  			onRender:function(content){
	  				jQuery(".chatline[data-chat-id='"+data.sender+data.message+"']").replaceWith(content)		
	  			}
	  		});
	  		// jQuery(".chatline[data-chat-id='"+data.sender+data.message+"']").attr("data-messagestatus","seen");
	  		//add seen flag to local history 
	  		
	  		chatApp.parseHistory()

	  	});
	  	messaging.handleEvent("state",function(state){
	  		
	  		//handle istyping
	  		var private_window = jQuery("#privatewindow[data-partner='"+state.name+"'] .chatlines .wrapper");
	  		if(private_window.length == 1){ 
	  			//if there is a private window with the state emiter
		  		
		  		if(state.isTyping == chatApp.userstate.name){//is typing for the current user
		  			//should show typing indicator
		  			if(state.isTyping != false){
		  				chatApp.renderTemplate({
		  					template:"#istyping",
		  					data:{
		  						partner:state.name,
		  						partner_avatar_url:state.avatar
		  					},
		  					onRender:function(content){

		  						jQuery(content).appendTo(private_window);
		  						private_window.scrollTop(private_window[0].scrollHeight);

		  					}
		  				});
		  			}
		  		}else{
		  			private_window.find(".istyping").remove();
		  			private_window.scrollTop(private_window[0].scrollHeight);
		  		}
	  		}
	  		
	  	});
    	
	},
	pushInLocalHistory:function(message){

		var history_array = Object.keys(chatApp.message_history);
		var last_message_time = (history_array.length > 0) ? history_array[history_array.length-1] : 0;
		if(message.time > parseFloat(last_message_time)){
			chatApp.message_history[message.time]= message;
		}
	},
	parseHistory:function(settings){

		for(var i in Object.keys(chatApp.message_history)){
			var message = chatApp.message_history[Object.keys(chatApp.message_history)[i]];
			if(!message.used){
				if(message.channel == chatApp.config.main_channel_name){

					chatApp.handleMainchatMessage(message,settings);

				}else{

					chatApp.handlePrivateMessage(message,settings)
				}
				//set the message as used in the local history so we dont look in the dom next time
				message["used"] = true;
			}
		}
	},
	handleMainchatMessage:function(message,settings){
		chatApp.renderTemplate({
			template:"#chatline",
			data:{
				from:message.from,
				text:message.text,
				time:message.time,
				avatar:message.avatar,
				status:message.status,
				seen_at:"0"
			},
			onRender:function(content){
				var mainchat = jQuery("#mainchatscroller");
				jQuery(content).appendTo(mainchat);
				if(settings.animateScroll){
					mainchat.animate({
						scrollTop:mainchat[0].scrollHeight	
					});
				}else{
					mainchat.scrollTop(mainchat[0].scrollHeight)
				}
				
			}
		});
	},
	handlePrivateMessage:function(message,settings){
		console.log("prv message received",message);
		//add item to conversation list
		jQuery(".conversations_container .empty").remove();
		var partner = (message.from == chatApp.userstate.name) ? message.to : message.from;
		var lastmessagefrom = (message.from == chatApp.userstate.name) ? "you" : message.from
		var conversation_item = jQuery(".conversation[data-channel='"+message.channel+"']");
		
		
		//notification
		
		

		//update conversation list
		chatApp.renderTemplate({
			template:"#conversation_user",
			data:{
				partner:partner,
				avatar:chatApp.users[partner].avatar,
				ownavatar:chatApp.userstate.avatar,
				channel:message.channel,
				user:message.from,
				lastmessagefrom:lastmessagefrom,
				lastmessagetime:message.time,
				lastmessage:message.text,
				status:message.status
			},
			onRender:function(content){
				
				if(conversation_item.length == 0){
					jQuery(content).prependTo(".conversations_container");
				}else{
					conversation_item.replaceWith(content);
				}
			}
		})
		
		

		//add chatline to private window if private window on screen
		var private_window = jQuery("#privatewindow[data-channel='"+message.channel+"']");
		if(private_window.length != 0){
			var data = {
				from:message.from,
				text:message.text,
				time:message.time,
				avatar:message.avatar,
				status:message.status,
				seen_at:message.seen_at
			};
			if(message.image){
				data["image"] = message.image;
				data["image_tn_width"] = message.image_tn_width;
				data["image_tn_height"] = message.image_tn_height;
			}
			chatApp.renderTemplate({
				template:"#chatline",
				data:data,
				onRender:function(content){
					jQuery(".empty",private_window).remove();
					
					var private_chat_container = jQuery(".wrapper",private_window);
					jQuery(content).appendTo(private_chat_container);
					if(settings.animateScroll){
						private_chat_container.animate({
							scrollTop:private_chat_container[0].scrollHeight	
						});
					}else{
						private_chat_container.scrollTop(private_chat_container[0].scrollHeight);
					}
					//if not own message, remove istyping note
					if(message.from != chatApp.userstate.name){
						private_chat_container.find(".istyping").remove();
					}
					chatApp.sendSeenEvent(message);
				}
			});
		}else{
			if(message.from != chatApp.userstate.name){
				chatApp.notify(message);
			}
			jQuery(".conversation[data-channel='"+message.channel+"']").addClass("unread");
		}

		chatApp.updatePrivateNottificationBubble();
		chatApp.reorderConversations();

	},
	notify:function(message){
		var myNotification = new Notify(message.from, {
	    	body: message.text,
	    	icon: message.avatar,
	    	timeout: 3,
	    	notifyClick:function(){
	    		jQuery("#privatewindow").remove();
	    		chatApp.openPrivateWindow(message.from,message.channel);
	    	}
		});
		if(Notify.isSupported){
			if (Notify.needsPermission){
			    	Notify.requestPermission(function(){
			    		myNotification.show();
			    	}, function(){
			    	
			    	});
			}else{
				myNotification.show();
			}
		}
		
	},
	reorderConversations:function(){
		//reordering conversations list
		var conversation_items = $(".conversation[data-channel]");
		if(conversation_items.length > 0){
			conversation_items.sort(function(a, b){
			    return $(b).data("lastmsg")-$(a).data("lastmsg")
			});
			$(".conversations_container").html(conversation_items);	
		}

	},
	updateUsersList:function(users){

		chatApp["users"] = {};
		
		for(i in users){
			chatApp.users[users[i].name] = users[i];
		}
		chatApp.renderTemplate({
			template:"#user_item_template",
			data:{
				users:users,
				username:chatApp.userstate.name
			},
			onRender:function(content){
				jQuery("div[data-tab='userslist'] .scroller").html(content);
				jQuery("#main_occupancy").html(users.length);
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
		if(typeof(Cookies.get('userstate')) == "undefined"){
			return false;	
		}else{
			chatApp.userstate = JSON.parse(Cookies.get('userstate'));
			return true;
		}
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
		spinner_obj:jQuery("#chatapp .spinner"),
		show:function(data){
			try{
				if(data.style){
					this.spinner_obj.addClass(data.style)
				}
				if(data.msg){
					chatApp.spinner.spinner_obj.find(".msg").html(data.msg);
				}
			}catch(err){}
			chatApp.spinner.spinner_obj.show();
		},
		hide:function(){
			chatApp.spinner.spinner_obj.attr("class","spinner").hide();
		}
	},
	listenToMainChannelPresence:function(presence){
		// console.log(presence);
		
		switch(presence.action){
			case "leave":
			case "timeout":
				chatApp.handleUserleave(presence);
			break;
			case "join":
				chatApp.handleUserJoin(presence);
				//set avatar in user list
			break;
		}
	},
	handleUserleave:function(presence){
		if(presence.user.name != chatApp.userstate.name){//some other user was kicked for duplicate username
			//remove user from list
			jQuery("[data-tab=userslist] [data-user="+presence.user.name+"]").remove();
			jQuery("#main_occupancy").html(jQuery("[data-tab=userslist] [data-user]").length);
			//update conversation list for current user if a partner left
			jQuery(".conversation[data-partner='"+presence.user.name+"']").attr("data-status","offline");
			//update users lines on main chat
			jQuery("#mainchatscroller .chatline[data-author='"+presence.user.name+"'] .user").attr("data-status","offline");
			//todo update current private window if opened
			var private_window = jQuery("#privatewindow[data-partner='"+presence.user.name+"']");
			private_window.attr("data-status","offline");
			private_window.find(".userstatus").html("offline");
		//todo:notice main chat
		}
		
	},
	handleUserJoin:function(presence){
		chatApp.users[presence.user.name] = presence.user;
		//partner back in?
		jQuery(".conversation[data-partner='"+presence.user.name+"']").attr("data-status","online");

		//update users lines on main chat
		jQuery("#mainchatscroller .chatline[data-author='"+presence.user.name+"'] .user").attr("data-status","online");

		//update private window if opened:
		var private_window = jQuery("#privatewindow[data-partner='"+presence.user.name+"']");
		private_window.attr("data-status","online");
		private_window.find(".userstatus").html("online");

		//add user to user list
		chatApp.renderTemplate({
			template:"#user_item_template",
			data:{
				users:[presence.user],
				username:chatApp.userstate.name
				
			},
			onRender:function(content){
				//if the user is not in the list, add it
				//todo, move this condition obove rendertemplate
				if(jQuery("[data-tab=userslist] [data-user="+presence.user.name+"]").length==0){
					var users_list = jQuery(".appview[data-tab='userslist'] .scroller");
					users_list.append(content);
					jQuery("#main_occupancy").html(jQuery("[data-tab=userslist] [data-user]").length);
				}
				
				
				
			}
		});
		
	},
	say:function(m){
		if(m.text.length > chatApp.config.message_max_length){
			alert("too long");
		}else{
			m["time"] = new Date().getTime();
			m["state"] = chatApp.userstate;
			messaging.sendMessage(m);
			m["status"] = "sent";
			chatApp.pushInLocalHistory(m);
			chatApp.parseHistory({animateScroll:true});	
		}
	},
	updatePrivateNottificationBubble:function(){

		var unread_msgs = jQuery(".conversation.unread").length;
		var nottification_bubble = jQuery("[data-count]");
		nottification_bubble.attr("data-count",unread_msgs);
		nottification_bubble.html(unread_msgs);
	},
	openPrivateWindow:function(partner,channel){
		chatApp.analytics("private","open");
		//first ensure window is removed
		//(it can live a little too long when animated)
		jQuery(".private_window").remove();
		var room_name = chatApp.getPrivateWindowName(partner,chatApp.userstate.name);
		
		
		//make the conversation item unread
		
		jQuery(".conversation[data-channel='"+room_name+"']").removeClass("unread");
		
		//getting partner avatar and status
		if((user_item = jQuery(".user[data-user='"+partner+"']")).length != 0){
			//from users list if user still online
			var avatar_url = user_item.find(".avatar").attr("src");
		}else if((user_item = jQuery(".conversation[data-partner='"+partner+"']")).length != 0){
			//from conversation if there was a conversation and user went offline
			var avatar_url = user_item.find(".avatar img").attr("src");
		}else{
			//private window was opened from the main chat
			var user_item = jQuery("#mainchatscroller .chatline[data-author='"+partner+"']");
			var avatar_url = user_item.find(".avatar").attr("src");
		}
		var user_status = user_item.attr("data-status");
		

		chatApp.renderTemplate({
			template:"#private_conversation",
			data:{
				partner:partner,
				channel:room_name,
				partner_avatar_url:avatar_url,
				status:user_status,
				inputmaxlength:chatApp.config.message_max_length
			},
			onRender:function(private_window_layout){
				
				jQuery(private_window_layout).appendTo(".chatwindow");
				chatApp.animate(jQuery("#privatewindow"),chatApp.config.private_window_animation_in)
				chatApp.updatePrivateNottificationBubble();
				
				//partner status?


				//inserting history if exists
				for(var i in Object.keys(chatApp.message_history)){
					var message = chatApp.message_history[Object.keys(chatApp.message_history)[i]];
					if(message.channel == room_name){
						jQuery(".private_window .empty").remove();
						var data = {
							from:message.from,
							text:message.text,
							time:message.time,
							avatar:message.avatar,
							status:message.status,
							seen_at:message.seen_at
						}
						if(message.image){
							data["image"] = message.image;
							data["image_tn_width"] = message.image_tn_width;
							data["image_tn_height"] = message.image_tn_height;
						}
						chatApp.renderTemplate({
							template:"#chatline",
							data:data,
							onRender:function(content){
								content = jQuery(content);
								content.appendTo("#privatewindow[data-channel='"+room_name+"'] .wrapper");
								chatApp.sendSeenEvent(message);
							}
						});
					}
				}
				

				jQuery(".private_window").find(".wrapper").css({
					"max-height":chatApp.scrollerheight
				})

				var private_window_scroller = jQuery("#privatewindow .wrapper");
				private_window_scroller.scrollTop(private_window_scroller[0].scrollHeight)
			}
		});
	},
	sendSeenEvent:function(message){
		if(!message.seen_at && message.from != chatApp.userstate.name){
			// console.log("seen",message);
			var seen_at = new Date().getTime();
			chatApp.message_history[message.time]["seen_at"] = seen_at;
			
			messaging.emitEvent("seen",{
				message:message.time,
				sender:message.from,
				receiver:message.to,
				seen_at:seen_at
			},function(response){
				// console.log(response)
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
	
	animate:function(element,animation,callback){
		if(!element || !animation){
			console.warn("missing element or animation")
		}else{
			var use_animations = false || chatApp.config.use_animations;
			var callback = callback || function(){};
			if(use_animations){
				element.addClass("animated "+animation);
				$(element).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
					element.removeClass(animation);	
					callback();
				});
			}else{
				callback();	
			}
		}
	},
	getSystem:function(){
		//will return host system capabilities like isMobile, allowsAnimations etc
		var to_return = {};




		return to_return;
	},

	monitorTyping:function(partner){
		lastType = new Date().getTime()/1000;
		
		chatApp.userstate.isTyping = partner;
		messaging.setState(chatApp.userstate);
		// if(_.isEqual(chatApp.savedstate,chatApp.userstate) == false){
		// 	messaging.setState(chatApp.userstate);
		// 	chatApp["savedstate"]= chatApp.userstate;
		// }
		
		
		if(typeof(typeChecker) == "undefined"){

			typeChecker = setInterval(function(){
				// console.log("saved",chatApp.savedstate,"current",chatApp.userstate);
				now = new Date().getTime()/1000
				if((now-lastType)>1){
					
					chatApp.userstate.isTyping = false;
					
					// if(_.isEqual(chatApp.savedstate,chatApp.userstate) == false){
					
						messaging.setState(chatApp.userstate);
						// chatApp["savedstate"] = chatApp.userstate;
					// }
				}
			},2000);
			
		}
	},
	validateLocalFile:function(file){
		var max_size = 10;//MB
		var valid_types = ["image/jpg","image/jpeg","image/png"];
		var error = [];
		if(jQuery.inArray(file.type,valid_types) == -1){
			error.push("Invalid file type");
		}
		//todo validate file size
		if(error.length > 0){
			return error;
		}else{
			return "ok";
		}
		
	},
	sendMessage:function(message){
		chatApp.analytics("general","message",message.channel);
		if(jQuery.inArray(message.channel,messaging.joined_channels) == -1){
			//subscribing to private conversation channel
			//do not broadcast presence
			//todo: do not subscribe if already subscribed
			messaging.subscribeToChannel({
				channel:[message.channel],
				onSubscribe:function(response){
					// console.log(response);

					

					chatApp.say(message);

					//todo: only once
					messaging.invite({
						partner:message.to,
						channel:message.channel,
					},function(r){
						// console.log("aaa")
						// console.log(r);
					});

				}
			});
		}else{
			chatApp.say(message);
		}
	},
	analytics:function(cat,action,label){
		ga('send', 'event', cat, action, label);
	},
	uiBindings:function(){
		jQuery(document).on("submit","#continueform",function(e){
			e.preventDefault();
			chatApp.userstate.clientId = Math.random();
			chatApp.spinner.show();
			chatApp.startChat();
		})
		jQuery(document).on("click","#chooseanotherusername",function(e){
			Cookies.remove('userstate');
			window.location.reload();
		})
		jQuery(document).on("click touchstart","#filedialogtrigger",function(e){
			e.stopPropagation();
			jQuery("#picturefile").click();
		});
		jQuery(document).on("change","#picturefile",function(e){
			var fileInput = jQuery(this);
			var files = fileInput[0].files
			var file = files[0];
			if(file){
				console.log(file);
				var validFile = chatApp.validateLocalFile(file);
				if(validFile == "ok"){
					chatApp.filesToUpload = files;
					console.log("valid file");
					var reader = new FileReader();
					reader.onload = function(e){
						chatApp.renderTemplate({
							template:"#imagepreview",
							data:{
								imageurl:reader.result
							},
							onRender:function(content){
								jQuery("#imagepreviewcontainer").remove();
								jQuery(content).insertBefore("#picturefile");
							}
						});
						
					};
					reader.readAsDataURL(file)
				}else{
					alert(validFile);
				}	
			}
		});
		jQuery(document).on("click","#sendimage",function(){
			var sendBtn = jQuery(this);
			var partner = sendBtn.closest("[data-partner]").attr("data-partner");
			var channel = sendBtn.closest("[data-channel]").attr("data-channel");
			sendBtn.addClass("disabled");
			sendBtn.text("sending");
			
			var message = {
				from:chatApp.userstate.name,
				to:partner,
				type:"image",
				text:"image",
				channel:channel,
				avatar:chatApp.userstate.avatar
			}


			var ospry = new Ospry(chatApp.config.ospry.public_key);
			ospry.up({
			    // form: document.getElementById("imageuploadform"),
			    files:chatApp.filesToUpload,
			    imageReady: function(err, metadata, index){
			    	message["image"] = metadata.url;
			    	message["image_tn_width"] = chatApp.config.thumbnail_width;
			    	message["image_tn_height"] = chatApp.config.thumbnail_width * (metadata.height / metadata.width);
			    	console.log(message);
					chatApp.sendMessage(message)
					jQuery("#imagepreviewcontainer").remove();
			    },
			  });

			
			
		});
		jQuery(document).on("click","#cancelsendimage",function(){
			jQuery("#imagepreviewcontainer").remove();
		});
		jQuery(document).on("click","#signout",function(){
			Cookies.remove('userstate');
			window.location.reload();
		});

		jQuery(document).on("click","#avatars img",function(){
			jQuery("#avatars img").removeClass("selected");
			jQuery(this).addClass("selected");
			chatApp.animate(jQuery(this),"fadeIn");
			jQuery("#sampleavatar").attr("src",jQuery(this).attr("src"));
			jQuery("#choosenavatar").val(jQuery(this).attr("src"));
			chatApp.animate(jQuery("#sampleavatar"),"bounceIn");
			jQuery("label[for='choosenavatar']").remove();
		});
		jQuery(document).on("click","#backtousername",function(){
			chatApp.spinner.show()
			chatApp.renderTemplate({
				template:"#startscreen",
				onRender:function(content){
					jQuery("#chat_container").html(content);
					chatApp.spinner.hide()
					jQuery("#username").focus();
				}
			});
		});
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
			chatApp["userstate"] = {
				name:jQuery(this).attr("data-guestname"),
				avatar:chatApp.config.guest_image,
				idle:false,
				isTyping : false,
				isGuest:true,
				clientId:Math.rand()
			};
			chatApp["username"] = jQuery(this).attr("data-guestname");
			chatApp.spinner.show({
				msg:"Entering as <strong>"+chatApp["username"]+"</strong>"
			});
			chatApp.startChat();
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
			chatApp.analytics("general","showtab",tab_to_show);
			
		});
		//typing the input
		jQuery(document).on("keyup",".footer input",function(e){
			//toggle the button
			var input = jQuery(this);
			var channel = input.attr("data-channel");
			var button =input.closest(".footer").find(".sayitbutton");
			var lengthcounter = input.closest(".footer").find(".lengthcounter");
			var partner = input.attr("data-partner");
			if(partner != chatApp.config.main_channel_name){
				chatApp.monitorTyping(partner);
			}
			
			lengthcounter.html(input.val().length+"/"+chatApp.config.message_max_length);
			if(input.val().length == chatApp.config.message_max_length){
				lengthcounter.css({
					"color":"red",
					"font-weight":"bold"
				});
			}else{
				lengthcounter.removeAttr("style");
			}
			if(input.val()!=""){
				button.css({"visibility":"visible"})
				lengthcounter.css({"visibility":"visible"})
			}else{
				button.css({"visibility":"hidden"})
				lengthcounter.css({"visibility":"hidden"})
			}
			//send message on enter
			if(e.keyCode == 13 && input.val()!=""){//enter
				
				
				var text = input.val();

				chatApp.sendMessage({
					from:chatApp.userstate.name,
					to:partner,
					type:"text",
					text:text,
					channel:channel,
					avatar:chatApp.userstate.avatar
				});

				


				
				
				button.css({"visibility":"hidden"})
				lengthcounter.css({"visibility":"hidden"})
				input.val("");
			}

		})
		//clicking the button
		jQuery(document).on("click",".sayitbutton",function(e){
			var input = jQuery(this).closest(".footer").find("input[type='text']");
			var lengthcounter = input.closest(".footer").find(".lengthcounter");
			var button = jQuery(this);
			if(input.val()!=""){
				var channel = input.attr("data-channel");
				var room = input.closest("[data-room]").attr("data-room");
				

				var message = {
					from:chatApp.userstate.name,
					to:input.attr("data-partner"),
					room:room,
					type:"text",
					text:input.val(),
					channel:channel,
					avatar:chatApp.userstate.avatar
				}
				console.log(message);
				chatApp.sendMessage(message);
				button.css({"visibility":"hidden"})
				lengthcounter.css({"visibility":"hidden"})
				input.val("");
				//input.focus();
			}
		})

		//clicking a user
		jQuery(document).on("click","[data-user]",function(){
			var partner = jQuery(this).attr("data-user");
			chatApp.animate(jQuery(this),"fadeIn");
			if(partner != chatApp.userstate.name){
				chatApp.openPrivateWindow(partner,partner);
			}else{
				jQuery("a[data-tab='settings']").click();
			}
		});
		//open private window from conversations list
		jQuery(document).on("click",".conversation[data-channel]",function(){
			var partner = jQuery(this).attr("data-partner");
			var channel = jQuery(this).attr("data-channel");
			chatApp.animate(jQuery(this),"fadeIn");
			chatApp.openPrivateWindow(partner,channel);
			
		});

		//toggle private window
		jQuery(document).on("click","#closeprivatewindow",function(e){
			chatApp.animate(jQuery("#privatewindow"),chatApp.config.private_window_animation_out,function(){
				jQuery("#privatewindow").remove();
			});
			
		});

		//clicking a user from chatline
		jQuery(document).on("click","#mainchatscroller .chatline .user",function(e){
			var partner = jQuery(this).closest(".chatline").attr("data-author");
			if(partner != chatApp.userstate.name && partner != chatApp.config.admin_username){
				var user_item = jQuery("[data-user='"+partner+"']");
				if(user_item.length != 0){
					chatApp.openPrivateWindow(partner,partner);	
				}else{
					alert("This user went offline");
				}
			}
		});
	}
} 
// jQuery(document).ready(function(){ 
	chatApp.init();
// });