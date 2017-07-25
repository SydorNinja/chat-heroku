if (window.location.pathname != '/sign-up.html' && window.location.pathname != '/index.html' && window.location.pathname != '/') {


	var username = getQueryVariable('username');
	var password = getQueryVariable('password');
	var title = getQueryVariable('title');
	var room = getQueryVariable("room");
	var socket = io();
	var days = getQueryVariable('days');
	var messagesNum = getQueryVariable('messagesNum');
} else {
	var socket = {
		on: function() {
			return undefined
		}
	}
	var $un = $('#sform').find('input[id=sform-un]');
	var $pass = $('#sform').find('input[id=sform-pass]');
	var $email = $('#sform').find('input[id=sform-email]');
	$('#sform').on('input', function(event) {
		$pass.val('' + $pass.val().replace(' ', '') + '');
		$un.val('' + $un.val().replace(' ', '') + '');
		if (window.location.pathname == '/sign-up.html') {
			$email.val('' + $email.val().replace(' ', '') + '');
		}

	});

	$('#sform').on('submit', function(event) {
		if ($un.val().length >= 4 && $un.val().length <= 12 && $pass.val().length >= 7 && $pass.val().length <= 100) {} else {
			event.preventDefault();
			console.log(2);
		}
	});

}



function getCookie(cname) {
	var name = cname + "=";
	var decodedCookie = decodeURIComponent(document.cookie);
	var ca = decodedCookie.split(';');
	for (var i = 0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == ' ') {
			c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length);
		}
	}
	return undefined;
}
if (window.location.pathname != '/index.html' && window.location.pathname != '/' && window.location.pathname != '/sign-up.html' && window.location.pathname != '/forgotPassword.html') {
	console.log(window.location.pathname);
	var token = getCookie('Auth');
	if (token == undefined) {
		window.location.pathname = '/';
	}
}

if (window.location.pathname == '/landing.html') {
	var downArrow = $('#arrowLand');
	downArrow.on('click', function() {
		console.log(downArrow.attr('class'));
		if (downArrow.attr('class') == 'glyphicon glyphicon-arrow-down') {
			downArrow.attr('class', 'glyphicon glyphicon-arrow-up');
		} else {
			downArrow.attr('class', 'glyphicon glyphicon-arrow-down');
		}

	});
}


$(document).ready(function() {
	console.log(10001);
	$("#filter").on("hide.bs.collapse", function() {
		$(".filterb").html('Filters <span class="glyphicon glyphicon-collapse-down"></span>');
	});
	$("#filter").on("show.bs.collapse", function() {
		$(".filterb").html('Filters <span class="glyphicon glyphicon-collapse-up"></span>');
	});
});

function daysCalc(messages, days) {
	for (var i = 0; i < messages.length; i++) {
		if (parseInt(messages[i].time) < moment().valueOf() - days * 86400) {
			messages.splice(i, 1);
		}
	}
	return messages;
}
console.log(username + ' wants to join ');
console.log(window.location);
jQuery('.room-title').text(room);

socket.on('connect', function() {
	if (window.location.pathname == '/myProfile.html') {
		socket.emit('target', {});
	}
	if (window.location.pathname == '/reloader.html') {
		socket.emit('requireM', {
			target: '200'
		});
	}
	if (window.location.pathname == '/favorite.html') {
		console.log(1);
		socket.emit('target4', {
			target: '200'
		});
	}
	if (window.location.pathname == '/landing.html' || window.location.pathname == '/favorite.html' || window.location.pathname == '/myRooms.html') {

		socket.emit('target2', {
			target: '200'
		});
	}
	if (window.location.pathname == '/roomDetailes.html') {

		socket.emit('target3', {
			title: title
		});
	}
	if (window.location.pathname == '/profile.html') {

		socket.emit('targeta', {
			user: username
		});
	}

	if (window.location.pathname == '/chat.html') {
		socket.emit('target3', {
			mission: 'message',
			title: room
		});
		console.log('sent request');

		socket.emit('joinRoom', {
			room: room
		});

		socket.emit('icon', {
			title: room
		});
	}

	if (window.location.pathname == '/roomDetailesChange.html') {

		var dest = '/roomDetailesChange?title=' + title;
		$("form[action='/roomDetailesChange']").attr('action', dest);
	}

	if (window.location.pathname == '/publicRooms.html') {
		socket.emit('target2', {
			target: 'public'
		});
	}

	console.log('Connected to socket.io server! ');
});

socket.on('messages', function(result) {
	console.log('role');
	var messages = result.result;


	var $messages = jQuery('.messages');
	$messages.empty();
	if (result.message === "no messages") {
		console.log("sorry");
		$messages.append('<p><h1>No Messages</strong></p>');
	} else {
		console.log(result.message);
		messages = messages.sort(function(a, b) {
			return a.id - b.id
		});
		if (days != "") {
			daysCalc(messages, parseInt(days));
		}

		if (messagesNum != "" && messages.length > messagesNum) {
			messages = messages.slice(messages.length - messagesNum, messages.length);
		}
		messages.forEach(function(message) {
			var timestampMoment = moment.utc(parseInt(message.time));

			var $message = jQuery('<li class="list-group-item"></li>');

			$message.append('<p><strong>' + message.sender + ' ' + timestampMoment.local().format('h:mm a') + '</strong></p>');
			if (message.photo) {
				$message.append('<p><strong> </strong></p>' + '<img src=' + message.photo + ' style= width:50px height:100px>');
			}
			if (message.text) {
				$message.append('<p>' + message.text + '<p>');
			}
			if (result.username == message.sender || result.role == 1) {
				$message.append('<form id="' + message.id + '"><input type="submit" class="btn btn-block btn-danger" value="delete"></form>');
			}
			if (result.username == message.sender) {
				$message.append('<br><br><form id="' + message.id + 'change"><input type="hidden" name="id" value="' + message.id + '"><br><input type="text" name="message" class="form-control" id="abc" /><br><input type="file" id="siofu_input' + message.id + '" name="photo" class="form-control" /><br><input type="submit" class="btn btn-block btn-warning" value="Change" id="submitb2' + message.id + '"></form>');

			}



			$messages.append($message);

			jQuery('#' + message.id).on('submit', function(event) {
				event.preventDefault();
				socket.emit('deleteMessage', {
					id: message.id
				});
			});
			jQuery('#' + message.id + 'change').on('submit', function(event) {
				var message = {};

				event.preventDefault();
				var id = (event.currentTarget.childNodes["0"].defaultValue);
				var file = $('#siofu_input' + id);
				var form = jQuery('#' + id + 'change');
				var messageUpload = {};

				$TTL = form.find('select[name=TTL]');
				if ($TTL.val() == "true") {
					messageUpload.TTL = true;
				}


				$text = form.find('input[name=message]').val().trim();
				if ($text.length > 0) {
					messageUpload.text = $text;
				}



				$photo = form.find('input[name=photo]');
				if ($photo.val().length > 0) {
					var reader = new FileReader();
					var start = new Date().getTime();
					reader.onload = function() {
						var data = reader.result;
						if (data.match(/^data:image\//)) {
							messageUpload.photo = data;
							message.messageUpload = messageUpload;
							message.id = id;
							socket.emit('changeMessage', message);


						} else {



							if (messageUpload.text != undefined) {
								message.messageUpload = messageUpload;
								message.id = id;
								socket.emit('changeMessage', message);
							}



						}
					};
					reader.readAsDataURL(file.prop('files')[0]);
				} else {

					if (messageUpload.text != undefined) {
						message.messageUpload = messageUpload;
						message.id = id;
						socket.emit('changeMessage', message);
					}

				}
				$photo.val('');
			});
		});


	}
	if (result.role != 1) {
		console.log("no admin");
		$adminRow = jQuery('#row-admin');
		$adminRow.remove();
	} else {
		console.log("admin");
	}
});

socket.on('Smessage', function(message) {
	var $messages = jQuery('.messages');
	var timestampMoment = moment.utc(parseInt(message.timestamp));
	var $message = jQuery('<li class="list-group-item"></li>');
	$message.append('<p><strong>' + message.sender + ' ' + timestampMoment.local().format('h:mm a') + '</strong></p>');
	if (message.photo) {
		$message.append('<p><strong> </strong></p>' + '<img src=' + message.photo + ' style= width:50px height:100px>');
	}
	if (message.text) {
		$message.append('<p>' + message.text + '<p>');
	}
	$messages.append($message);
});


var $form = jQuery('#message-form');
$form.on('submit', function(event) {
	var file = $('#siofu_input');
	event.preventDefault();
	var message = {};



	$TTL = $form.find('select[name=TTL]');
	if ($TTL.val() == "true") {
		message.TTL = true;
		console.log($TTL.val() + ' is true');
	} else {
		console.log($TTL.val() + ' not true');
	}

	$text = $form.find('input[name=message]').val().trim();
	if ($text.length > 0) {
		message.text = $text;
	}



	$photo = $form.find('input[name=photo]');
	if ($photo.val().length > 0) {
		var reader = new FileReader();
		var start = new Date().getTime();
		reader.onload = function() {
			var data = reader.result;
			if (data.match(/^data:image\//)) {
				message.photo = data;
				socket.emit('message', message);


			} else {



				if (message.text != undefined) {
					socket.emit('message', message);
				}



			}
		};
		reader.readAsDataURL(file.prop('files')[0]);
	} else {

		if (message.text != undefined) {
			socket.emit('message', message);
		}

	}
	$("#siofu_input").val("");
	$("#message_text").val("");
});

$deleteUserFRoom = jQuery('#deleteUserFRoom');
$deleteUserFRoom.on('submit', function(event) {
	event.preventDefault();
	var username = $deleteUserFRoom.find('input[name=username]').val();
	if (username != '') {
		socket.emit('deleteUserFRoom', username);
	}
	$("#username").val("");
});

$exitRoom = jQuery('#exitRoom');
$exitRoom.on('submit', function(event) {
	event.preventDefault();
	socket.emit('exitRoom', {});
	window.location.pathname = ('/landing.html');
});


$sendMail = jQuery('#sendMail');
$sendMail.on('submit', function(event) {
	event.preventDefault();
	socket.emit('sendMail', {});
});



$('#clearAdmin').click(function(event) {
	socket.emit('clear', {});
});

$('#deleteRoom').click(function(event) {
	console.log('delete');
	socket.emit('delete', {});
});

socket.on('target', function(profile) {

	var username = profile.username;
	var email = profile.email;
	var photo = profile.photo;
	var signin = parseInt(profile.signin);
	var signup = parseInt(profile.signup);
	var $profile = jQuery('.profiles');
	$profile.append('<p><strong> Username: ' + username + '</strong></p>');
	$profile.append('<p><strong> Email: ' + email + '</strong></p>');
	if (photo == null) {
		$profile.append('<p><strong> No photo </strong></p>');
	} else {
		$profile.append('<p><strong> Photo: </strong></p>' + '<img src=' + photo + ' style= width:50px height:100px>');
	}
	$profile.append('<p><strong> Last sign in: ' + moment.utc(signin).local().format('h:mm a') + '</strong></p>');
	$profile.append('<p><strong> Signed up: ' + moment.utc(signup).local().format('h:mm a') + '</strong></p>');
});
socket.on('message', function(message) {
	socket.emit('target3', {
		mission: 'message',
		title: room
	});
});
socket.on('target2', function(rooms) {

	if (window.location.pathname == '/landing.html' || window.location.pathname == '/favorite.html') {
		var $el = $('.selectClass');
		$el.empty();
		if (rooms) {
			rooms.forEach(function(room) {
				$el.append("<option style=\"width: 310px\" value=" + room + ">" + room + "</option>");
			});
		}

	} else if (window.location.pathname == '/publicRooms.html') {
		console.log("dfsdfsd");
		var $publicRooms = jQuery('.publicRooms');
		if (rooms === false) {
			$publicRooms.append('<h1>No Rooms</h1>');
		} else {

			console.log(rooms);

			$publicRooms.append('<h1> Public Rooms </h1>');
			rooms.forEach(function(room) {
				$publicRooms.append('<p><strong> Title:' + room.title + '</strong></p> ');
				if (room.icon == null) {
					$publicRooms.append('<p><strong> No Photo </strong></p>');
				} else {
					$publicRooms.append('<p><strong>Icon: </strong></p><img src=' + room.icon + ' style=width:50px height:100px>');
				}
				$publicRooms.append('<form action="/connectViaInvite" method="post"><input type="hidden" value=' + room.invite + ' class="invite" name="invite"><br><br><input type="submit" value="Login" class="btn btn-primary btn-block" ></form>');
			});
		}
	} else {
		console.log(rooms + ' ' + typeof(rooms));
		var $myRooms = jQuery('.myRooms');
		if (rooms === false) {
			$myRooms.append('<h1>No Rooms</h1>');
		} else {

			console.log(rooms);

			$myRooms.append('<h1> My Rooms </h1>');
			rooms.forEach(function(room) {
				$myRooms.append('<p><strong>' + room + '</strong></p> ');
			});
		}
	}
});

socket.on('land', function() {
	window.location.pathname = '/landing.html';
});

socket.on('requireM', function() {
	socket.emit('target3', {
		mission: 'message',
		title: room
	});
});

socket.on('target4', function(rooms) {
	var $myRooms = jQuery('.myfavorite');
	if (rooms === false) {
		$myRooms.append('<h1>No Favorite Rooms</h1>');
	} else {

		console.log(rooms);

		$myRooms.append('<h1> My Favorite Rooms: </h1>');
		rooms.forEach(function(room) {
			$myRooms.append('<p><strong>' + room + '</strong></p> ');
		});
	}
});



socket.on('target3', function(room) {

	var $roomDetailes = jQuery('.roomDetailes');


	if (room == null) {
		$roomDetailes.append('<h1>No Room Found</h1>');
		$("a[href='/roomDetailesChange.html']").attr('href', '/landing.html');

	} else {
		console.log(room);
		if (room.InRoom == undefined) {
			$("a[href='/roomDetailesChange.html']").remove();
		} else {
			var dest = 'roomDetailesChange.html?title=' + room.title;
			$("a[href='/roomDetailesChange.html']").attr('href', dest);
		}
		if (room.icon == null) {
			$roomDetailes.append('<p><strong> No Photo </strong></p>');
		} else {
			$roomDetailes.append('<p><strong>Icon: </strong></p><img src=' + room.icon + ' style=width:50px height:100px>');
		}
		$roomDetailes.append('<p><strong>' + room.title + '</strong></p>');
		if (room.private == true) {
			$roomDetailes.append('<p><strong> The Room Is Private! </strong></p>');
		} else {
			$roomDetailes.append('<p><strong> The Room Is Public </strong></p>');

		}
		if (room.invite) {
			$roomDetailes.append('<p><strong> Invite Code: ' + room.invite + ' </strong></p>');
		}



	}
});


if (window.location.pathname != '/index.html' && window.location.pathname != '/' && window.location.pathname != '/sign-up.html' && window.location.pathname != '/forgotPassword.html') {
	socket.emit('myPhoto', {});
}

socket.on('myPhoto', function(photo) {
	$('#myPhoto').attr('src', photo);
});



socket.on('icon', function(icon) {
	$('.room-icon').attr('src', icon);
});

socket.emit('allR', {});



var app = angular.module('myApp', [])

var controlN = app.controller('namesCtrl', function($scope) {

	$scope.names = [];
	socket.on('allR', function(rooms) {
		$scope.names = rooms;

	});

});

$('#searcher').on('input', function() {
	if ($('#searcher').val().trim().length > 0) {
		$('#try').show();
	} else {
		$('#try').hide();
	}
});