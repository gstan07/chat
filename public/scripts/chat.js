
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
		chatApp["private_messages"] = [];
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
							chatApp.updateChatWindow(m);
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
							    			chatApp.updateChatWindow({
							    				
													from:chatApp.config.admin_username,
													type:"text",
													text:"Hello, "+chatApp.userstate.name+"! Welcome to the chat!",
													channel:chatApp.config.main_channel_name,
													time:new Date().getTime()/1000,
													avatar:chatApp.config.admin_image
												
							    			})
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
    					chatApp.spinner.hide();
    				})
		    	}
		    });
	  	});
    	
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
		m["time"] = new Date().getTime()/1000;
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
		if(jQuery.inArray(partner,messaging.joined_channels) == -1){
			//subscribing to partner channel
			//do not broadcast presence
			//todo: do not subscribe if already subscribed
			messaging.subscribeToChannel({
				channel:[partner],
				onSubscribe:function(response){
					console.log(response);
				}
			});
		}
		
		
		//make the conversation item unread
		
		jQuery(".conversation[data-room='"+room_name+"']").removeClass("unread");
		
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
				room:room_name,
				channel:channel,
				partner_avatar_url:avatar_url,
				status:user_status
			},
			onRender:function(private_window_layout){
				
				jQuery(private_window_layout).appendTo(".chatwindow");
				chatApp.animate(jQuery("#privatewindow"),chatApp.config.private_window_animation_in)
				chatApp.updatePrivateNottificationBubble();
				
				//partner status?


				//inserting history if exists
				jQuery(chatApp.private_messages).each(function(index,message){
					if(message.room == room_name){
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
								content.appendTo("#privatewindow[data-room='"+room_name+"'] .wrapper");
								
							}
						});
					}
				});

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
	updateChatWindow:function(m){
		console.log(m);
		//main chat
		if(m.channel == chatApp.config.main_channel_name){
			if(m.channel == chatApp.config.main_channel_name){
				var chat_window = jQuery(".scroller[data-channel='"+m.channel+"']");
			}
			if(chat_window.length == 1 && chat_window.find(".chatline[data-chatline-id='"+m.from+m.time+"']").length == 0){
					chatApp.renderTemplate({
					template:"#chatline",
					data:{
						user:m.from,
						message:m.text,
						time:m.time,
						avatar:m.avatar
					},
					onRender:function(content){
						jQuery(content).appendTo(chat_window);

						chat_window.animate({
							scrollTop:chat_window[0].scrollHeight
						})
						
					}
				});
			}
		}else{
			//private conversations
			var room_name = m.room;
			if(m.from == chatApp.userstate.name || //from the current user
				m.to == chatApp.userstate.name//to the current user
				){//from partner in conversation with the current user
				chatApp.private_messages.push(m);
				//update private chat window if necesary
				var private_window = jQuery(".private_window[data-room='"+m.room+"']");
				if(private_window.length == 1){
					jQuery(".private_window .empty").remove();
					chatApp.renderTemplate({
						template:"#chatline",
						data:{
							user:m.from,
							message:m.text,
							time:m.time,
							avatar:m.avatar
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
					if(message.from == chatApp.userstate.name){
						var partner = message.channel;
						var from = "you";
						var avatar = jQuery(".private_window[data-partner='"+partner+"'] .avatar img").attr("src");
					}else{
						var partner = message.from;
						var from = message.from;
						var avatar = message.avatar;
					}
					var conversation_item = jQuery(".conversation[data-room='"+message.room+"']");
					if(conversation_item.length == 0){
						
						chatApp.renderTemplate({
							template:"#conversation_user",
							data:{
								partner:partner,
								user:partner,
								lastmessagefrom:from,
								room:message.room,
								lastmessage:message.text.substr(0,chatApp.config.lastmessage_length_to_show),
								lastmessagetime:message.time,
								channel:message.channel,
								avatar:avatar,
								ownavatar:chatApp.userstate.avatar
							},
							onRender:function(content){
								jQuery(".conversations_container .empty").remove();
								jQuery(content).appendTo(".conversations_container");
								if(private_window.length == 0){
									
									jQuery(".conversation[data-room='"+room_name+"']").addClass("unread");
								}
								jQuery(".conversation[data-room='"+room_name+"']").attr("data-status",private_window.attr("data-status"))
							}
						});
					}else{
						conversation_item.data("lastmsg",message.time);
						conversation_item.find(".lastmsg .from").html(from);
						conversation_item.find(".lastmsg .message").html(message.text.substr(0,chatApp.config.lastmessage_length_to_show));
						conversation_item.find(".lastmsg .time").attr("data-livestamp",message.time);
						if(private_window.length == 0 && room_name!=""){
							
							jQuery(".conversation[data-room='"+room_name+"']").addClass("unread");
						}
					}
					
				});
				//reordering conversations list
				var conversation_items = $(".conversation[data-room]");
				if(conversation_items.length > 0){
					conversation_items.sort(function(a, b){
					    return $(b).data("lastmsg")-$(a).data("lastmsg")
					});
					$(".conversations_container").html(conversation_items);	
				}

				//update nottification bubble
				chatApp.updatePrivateNottificationBubble();
			}
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

			if(input.val()!=""){
				button.css({"visibility":"visible"})
			}else{
				button.css({"visibility":"hidden"})
			}
			//send message on enter
			if(e.keyCode == 13 && input.val()!=""){//enter
				
				// input.attr({
				// 	"disabled":"disabled",
				// 	"placeholder":"wait..."
				// });
				// button.html("wait...");
				// button.attr("disabled","disabled");
				chatApp.say({
						from:chatApp.username,
						to:input.attr("data-partner"),
						room:jQuery(this).closest("[data-room]").attr("data-room"),
						type:"text",
						text:input.val(),
						channel:channel,
						avatar:chatApp.userstate.avatar
				});
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
		jQuery(document).on("click",".conversation[data-room]",function(){
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
				chatApp.openPrivateWindow(partner,partner);
			}
		});
	}
} 
// jQuery(document).ready(function(){ 
	chatApp.init();
// });