
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
			"https://cdn0.iconfinder.com/data/icons/user-pictures/100/matureman1-128.png",
			"http://31.media.tumblr.com/avatar_b2e548e2cec8_128.png",
			"http://thumbs.dreamstime.com/m/profile-icon-male-avatar-portrait-casual-person-silhouette-face-flat-design-vector-47075235.jpg"
			][Math.floor(Math.random() * 3)],
		admin_username:"Chat Admin",
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
						var guestname = "guest_"+Math.floor(Math.random()*100000);
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

		chatApp["chat_service"] = messaging;
		chatApp.chat_service["config"] = {
			app_key:chatApp.config.messaging.app_key
		}
		chatApp.chat_service["user_state"] = chatApp.userstate;
		chatApp.chat_service.init();
    	chatApp.subscribeToChannel({
    		channel:chatApp.config.main_channel_name,
    		broadcast_presence:true,
    		onSubscribe:function(m){
    			//user subscribed to main channel
    			
    			//subscribing user to his private channel
    			chatApp.subscribeToChannel({
    				channel:chatApp.userstate.name,
    				onSubscribe:function(m){
    					//user subscribed to his private channel
    					//getting the users list on the main channel
    					chatApp.chat_service.getUserList({
    						channel:chatApp.config.main_channel_name
    					},function(users){
    						//user list received
    						chatApp.chat_service.handlePresence(function(presence){
    							chatApp.listenToMainChannelPresence(presence);
    						});
    						chatApp.chat_service.handleReceivedMessage(function(m){
    							chatApp.updateChatWindow(m);
    						});
    						chatApp.renderTemplate({
								    		template:"#chatwindow",
								    		data:{
								    			users:users,
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
								    			chatApp.spinner.hide();
								    			
								    		}
								    	});
    					});
    										
    				}
    			});
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
		show:function(msg){
			if(msg){
				chatApp.spinner.spinner_obj.find(".msg").html(msg);
			}
			chatApp.spinner.spinner_obj.show();
		},
		hide:function(){
			chatApp.spinner.spinner_obj.hide();
		}
	},
	subscribeToChannel:function(subscription){
		var subscription = {
			channel:subscription.channel || chatApp.config.main_channel_name,
			onSubscribe:subscription.onSubscribe,
			broadcast_presence:subscription.broadcast_presence || false

		}
		chatApp.chat_service.subscribeToChannel(subscription);
	},
	listenToMainChannelPresence:function(presence){
		console.log(presence);
		jQuery("#main_occupancy").html(presence.occupancy);
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
		//todo: if the user have opened privates, notice his partners
		//todo:notice main chat
	},
	handleUserJoin:function(presence){

		chatApp.renderTemplate({
			template:"#user_item_template",
			data:{
				user:presence.user.name,
				isself:(presence.user.name==chatApp.userstate.username),
				avatar:presence.user.avatar
			},
			onRender:function(content){
				//if the user is not in the list, add it
				
				if(jQuery("[data-tab=userslist] [data-user="+presence.user.name+"]").length==0){
					var users_list = jQuery(".appview[data-tab='userslist'] .scroller");
					users_list.append(content);
				}

				
				
			}
		});
		
	},
	say:function(m){
		m["time"] = new Date().getTime()/1000;
		m["state"] = chatApp.userstate;
		chatApp.chat_service.sendMessage(m);
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
		chatApp.subscribeToChannel({
			channel:partner,
			onSubscribe:function(){
				console.log(chatApp.userstate.name+" subscribed to private channel of "+ partner);
			}
		});
		


		
			
			
		//make the conversation item unread
		
		jQuery(".conversation[data-room='"+room_name+"']").removeClass("unread");
		
		chatApp.renderTemplate({
			template:"#private_conversation",
			data:{
				partner:partner,
				room:room_name,
				channel:channel,
				partner_avatar_url:jQuery(".user[data-user='"+partner+"'] .avatar").attr("src")
			},
			onRender:function(private_window_layout){
				
				jQuery(private_window_layout).appendTo(".chatwindow");
				chatApp.animate(jQuery("#privatewindow"),chatApp.config.private_window_animation_in)
				chatApp.updatePrivateNottificationBubble();
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
				m.channel == chatApp.userstate.name || //to the current user
				m.room == chatApp.getPrivateWindowName(m.from,chatApp.userstate.name)){//from partner in conversation with the current user
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
					}else{
						var partner = message.from;
						var from = message.from;
					}
					var conversation_item = jQuery(".conversation[data-room='"+message.room+"']");
					if(conversation_item.length == 0){
						var avatar = jQuery(".user[data-user='"+partner+"'] .avatar").attr("src");
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
								avatar:avatar
							},
							onRender:function(content){
								jQuery(".conversations_container .empty").remove();
								jQuery(content).appendTo(".conversations_container");
								if(private_window.length == 0){
									
									jQuery(".conversation[data-room='"+room_name+"']").addClass("unread");
									
								}
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
				
			};
			chatApp["username"] = jQuery(this).attr("data-guestname");
			chatApp.spinner.show("Entering as <strong>"+chatApp["username"]+"</strong>");
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
						room:jQuery(this).closest("[data-room]").attr("data-room"),
						type:"text",
						text:input.val(),
						channel:channel,
						avatar:chatApp.userstate.avatar
				});
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
						room:room,
						type:"text",
						text:input.val(),
						channel:channel,
						avatar:chatApp.userstate.avatar
				});
				
				input.val("");
				//input.focus();
			}
		})

		//clicking a user
		jQuery(document).on("click","[data-user]",function(){
			var partner = jQuery(this).attr("data-user");

			if(partner != chatApp.username){
				chatApp.animate(jQuery(this),"fadeIn");
				chatApp.openPrivateWindow(partner,partner);
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
			if(partner != chatApp.userstate.username && partner != chatApp.config.admin_username){
				chatApp.openPrivateWindow(partner,partner);
			}
		});
	}
} 
// jQuery(document).ready(function(){
	chatApp.init();
// });