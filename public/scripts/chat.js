
var chatApp = {
	config:{
		parse:{
			application_id:"YY9uLYQxngJOSZIEBENMVRD6bkOILotT4jzlAC0s",
			javascript_key:"ygnAofdXqnxM1fhdmrJsMhuHtZIvjTJjVhRJiXyl"
		},
		messaging:{
			app_key:"plmplmplm"
		},
		allow_guest_user:true,
		main_channel_name:"mainchat",
		warn_on_reload:false,
		admin_image:"https://cdn2.iconfinder.com/data/icons/users-6/100/USER1-128.png",

		guest_image:[
			"images/avatars/generic.jpeg"
			// "images/avatars/a2.png",
			// "images/avatars/a3.png",
			// "images/avatars/a4.png",
			// "images/avatars/a5.png",
			// "images/avatars/a6.png",
			// "images/avatars/a7.png",
			// "images/avatars/a8.png",
			// "images/avatars/a9.png",
			// "images/avatars/a10.png",
			// "images/avatars/a11.png",
			// "images/avatars/a12.png"
			][Math.floor(Math.random() * 1)],
		admin_username:"System",
		use_animations:true,
		private_window_animation_in:"slideInRight",//animate.css
		private_window_animation_out:"slideOutLeft",//animate.css
		lastmessage_length_to_show:30
	},
	init:function(){
		chatApp["message_history"] = {};
		chatApp["scrollerheight"] = jQuery(window).height()-100;
		chatApp["system"] = chatApp.getSystem();
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
						var colors = ["darker","black","dark","orange","red","green","blue","white","brown","violet","pink","gray","silver","golden","maroon"];
						var animals = ["dog", "cat", "monkey", "donkey", "dino", "elephant","horse","camel","kangaroo","fish","gorilla","iguana","lizard","turkey","shark","ostrich","butterfly","zebra","owl","eagle","bear","panther","tiger","wolf","pigeon","jaguar","fox","lion"];
						var rand_color = colors[Math.floor(Math.random() * colors.length)]
						var rand_animal = animals[Math.floor(Math.random() * animals.length)]
						var guestname = rand_color+""+rand_animal+""+Math.floor(Math.random()*1000);
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


		messaging.init({
			app_key:chatApp.config.messaging.app_key
		});
		messaging.handleEvent("connect",function(r){
			//socket connected
			messaging.setState(chatApp.userstate);
			messaging.subscribeToChannel({
				//subscribing to the main channel and own private channel
	    		channel:[chatApp.config.main_channel_name,chatApp.userstate.name],
	    		broadcast_presence:true,
	    		onSubscribe:function(m){
	    			console.log(m)
	    			messaging.getUserList({
						channel:chatApp.config.main_channel_name
					},function(users){
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
							    			userimage:chatApp.userstate.avatar
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
							    			chatApp.updateUsersList(users);

							    			chatApp.spinner.hide();
							    			
							    		}
							    	});
					});
	    		}
    		});
		});
		messaging.handleEvent("disconnect",function(response){
			chatApp.spinner.show({
	  			style:"min",
	  			msg:"disconnected"
	  		});
		})
		messaging.handleEvent('reconnecting', function (response) {
		    
	  		chatApp.spinner.show({
	  			style:"min",
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
    					chatApp.updateUsersList(users);
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
	  	})
    	
	},
	pushInLocalHistory:function(message){
		if(!chatApp.message_history[message.time]){
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
				user:message.from,
				message:message.text,
				time:message.time,
				avatar:message.avatar
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
		
		//add item to conversation list
		jQuery(".conversations_container .empty").remove();
		var partner = (message.from == chatApp.userstate.name) ? message.to : message.from;
		var lastmessagefrom = (message.from == chatApp.userstate.name) ? "you" : message.from
		var conversation_item = jQuery(".conversation[data-channel='"+message.channel+"']");
		
		//update conversation list
		chatApp.renderTemplate({
			template:"#conversation_user",
			data:{
				partner:partner,
				avatar:message.avatar,
				ownavatar:chatApp.userstate.avatar,
				channel:message.channel,
				user:message.from,
				lastmessagefrom:lastmessagefrom,
				lastmessagetime:message.time,
				lastmessage:message.text
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
			chatApp.renderTemplate({
				template:"#chatline",
				data:{
					user:message.from,
					message:message.text,
					time:message.time,
					avatar:message.avatar
				},
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
					
				}
			});
		}else{
			jQuery(".conversation[data-channel='"+message.channel+"']").addClass("unread");
		}

		chatApp.updatePrivateNottificationBubble();
		chatApp.reorderConversations();

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
		chatApp.renderTemplate({
			template:"#user_item_template",
			data:{
				users:users,
				username:chatApp.username
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
		spinner_obj:jQuery("#chatapp .spinner"),
		show:function(data){
			if(data.style){
				this.spinner_obj.addClass(data.style)
			}
			if(data.msg){
				chatApp.spinner.spinner_obj.find(".msg").html(data.msg);
			}
			chatApp.spinner.spinner_obj.show();
		},
		hide:function(){
			chatApp.spinner.spinner_obj.attr("class","spinner").hide();
		}
	},
	listenToMainChannelPresence:function(presence){
		console.log(presence);
		
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
	},
	handleUserJoin:function(presence){
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
				username:chatApp.username
				
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
		m["time"] = new Date().getTime();
		m["state"] = chatApp.userstate;
		messaging.sendMessage(m);
	},
	updatePrivateNottificationBubble:function(){

		var unread_msgs = jQuery(".conversation.unread").length;
		var nottification_bubble = jQuery("[data-count]");
		nottification_bubble.attr("data-count",unread_msgs);
		nottification_bubble.html(unread_msgs);
	},
	openPrivateWindow:function(partner,channel){
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
				status:user_status
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
						chatApp.renderTemplate({
							template:"#chatline",
							data:{
								user:message.from,
								message:message.text,
								time:message.time,
								avatar:message.avatar
							},
							onRender:function(content){
								content = jQuery(content);
								content.appendTo("#privatewindow[data-channel='"+room_name+"'] .wrapper");
								
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
			chatApp["userstate"] = {
				name:jQuery(this).attr("data-guestname"),
				avatar:chatApp.config.guest_image,
				idle:false,
				isTyping : false,
				isGuest:true
			};
			chatApp["username"] = jQuery(this).attr("data-guestname");
			chatApp.spinner.show({
				msg:"Entering as <strong>"+chatApp["username"]+"</strong>"
			});
			chatApp.startChat(chatApp.userstate.name);
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
			var partner = input.attr("data-partner");
			var text = input.val();
			if(input.val()!=""){
				button.css({"visibility":"visible"})
			}else{
				button.css({"visibility":"hidden"})
			}
			//send message on enter
			if(e.keyCode == 13 && input.val()!=""){//enter
				

				if(jQuery.inArray(channel,messaging.joined_channels) == -1){
					//subscribing to private conversation channel
					//do not broadcast presence
					//todo: do not subscribe if already subscribed
					messaging.subscribeToChannel({
						channel:[channel],
						onSubscribe:function(response){
							console.log(response);

							

							chatApp.say({
								from:chatApp.username,
								to:partner,
								type:"text",
								text:text,
								channel:channel,
								avatar:chatApp.userstate.avatar
							});

							//todo: only once
							messaging.invite({
								partner:partner,
								channel:channel,
							},function(r){
								console.log("aaa")
								console.log(r);
							});

						}
					});
				}else{
					chatApp.say({
								from:chatApp.username,
								to:partner,
								type:"text",
								text:text,
								channel:channel,
								avatar:chatApp.userstate.avatar
							});
				}


				
				
				button.css({"visibility":"hidden"})
				input.val("");
			}

		})
		//clicking the button
		jQuery(document).on("click",".sayitbutton",function(e){
			var input = jQuery(this).closest(".footer").find("input");
			var button = jQuery(this);
			if(input.val()!=""){
				var channel = input.attr("data-channel");
				var room = input.closest("[data-room]").attr("data-room");
				
				chatApp.say({
						from:chatApp.userstate.name,
						to:input.attr("data-partner"),
						room:room,
						type:"text",
						text:input.val(),
						channel:channel,
						avatar:chatApp.userstate.avatar
				});
				button.css({"visibility":"hidden"})
				input.val("");
				//input.focus();
			}
		})

		//clicking a user
		jQuery(document).on("click","[data-user]",function(){
			var partner = jQuery(this).attr("data-user");
			chatApp.animate(jQuery(this),"fadeIn");
			if(partner != chatApp.username){
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