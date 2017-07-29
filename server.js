var PORT = process.env.PORT || 3000;
var jimp = require("jimp");
var express = require('express');
var app = express();
var http = require('http').Server(app);
var _ = require('underscore');
var db = require('./db.js');
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({
	extended: true
})); // support encoded bodies
var middleware = require('./middleware.js')(db);
var roomcontroller = require('./roomcontroller');
var usercontroller = require('./usercontroller.js');
var usersroomscontroller = require('./usersroomscontroller');
var conversationcontroller = require('./conversationcontroller');
var multer = require('multer');
var fs = require('fs');
var upload = multer({
	dest: 'uploads/'
});
var io = require('socket.io')(http);
var moment = require('moment');
app.use(express.static(__dirname + '/public'));
var clientInfo = {};
var cookieParser = require('cookie-parser');
app.use(cookieParser());
var tokener = require('./tokenFind');
app.post('/signup', function(req, res) {
	var body = _.pick(req.body, 'email', 'password', 'username');
	console.log(body);
	usercontroller.signup(body).then(function(user) {
		res.send('Please Validate your account through mail');
	}, function(error) {
		res.status(400).send(error);
	});
});
var cryptojs = require('crypto-js');
var jwt = require('jsonwebtoken');
var Auth;



function jimpBufferMessage(buffer) {
	return new Promise(function(resolve, reject) {
		function onBuffer(err, buffer) {
			console.log(1001);
			var photoDataUrl = 'data:image/png;base64,' + buffer.toString('base64');
			console.log('photoDataUrl: ' + photoDataUrl);
			resolve(photoDataUrl);
		}

		jimp.read(buffer, function(err, img) {
			img.resize(50, jimp.AUTO)
				.quality(60)
				.getBuffer(img.getMIME(), onBuffer)
		});

	});
}

function roomArrayT(rooms) {
	return new Promise(function(resolve, reject) {
		if (rooms == null) {
			return reject();
		}
		rooms.forEach(function(room, index, array) {
			array[index] = room.title;
			if (index == array.length - 1) {
				resolve(rooms);
			}
		});
	});
}

function userArrayUn(users) {
	return new Promise(function(resolve, reject) {
		if (users == null) {
			return reject();
		}
		users.forEach(function(user, index, array) {
			array[index] = user.username;
			if (index == array.length - 1) {
				resolve(users);
			}
		});
	});
}
app.post('/upload', middleware.requireAuthentication, upload.single('sampleFile'), function(req, res, next) {
	try {
		fs.readFile(req.file.path, function(err, data) {
			var base64Image = 'data:image/png;base64,' + new Buffer(data, 'binary').toString('base64');
			fs.unlink(req.file.path);
			req.user.update({
				photo: base64Image
			});
			res.redirect('/myProfile.html');
		});
	} catch (e) {
		res.status(401).send();
	}
});



app.post('/room', middleware.requireAuthentication, function(req, res) {
	var body = _.pick(req.body, 'title', 'password');
	roomcontroller.makeRoom(req.user, body).then(function(publicFormRoom) {
		res.redirect('/landing.html');
	}, function() {
		res.status(401).send();
	});

});
app.post('/changeRoomDetails', middleware.requireAuthentication, function(req, res) {
	var roomTitle = req.headers.referer.slice(76);
	var body = req.body;
	roomcontroller.changeRoomDetails(body, roomTitle, req.user).then(function() {
		if (body.title != '' && body.title != undefined) {
			res.redirect('/roomDetailes.html?title=' + body.title);
		} else {
			res.redirect('/roomDetailes.html?title=' + roomTitle);
		}
	}, function() {
		res.status(401).send();
	});
});

app.post('/upload2', middleware.requireAuthentication, upload.single('sampleFile'), function(req, res, next) {
	console.log(req.headers.referer.slice(76));
	var roomTitle = req.headers.referer.slice(76);
	try {
		var body = {};
		fs.readFile(req.file.path, function(err, data) {
			var base64Image = 'data:image/png;base64,' + new Buffer(data, 'binary').toString('base64');
			fs.unlink(req.file.path);
			body.icon = base64Image;
			roomcontroller.changeRoomDetails(body, roomTitle, req.user).then(function() {
				res.redirect('/roomDetailes.html?title=' + roomTitle);
			}, function() {
				res.status(401).send();
			});

		});
	} catch (e) {
		res.status(401).send();
	}
});


app.post('/loginRoom', middleware.requireAuthentication, function(req, res) {
	var body = req.body;
	console.log(body);
	usersroomscontroller.loginRoom(req.user, body).then(function() {
		res.status(204).send();
	}, function() {
		res.status(401).send();
	});
});

app.get('/verify', function(req, res) {
	var query = req.query;
	usercontroller.verify(query).then(function() {
		res.send('Validated');
	}, function() {
		res.status(401).send();
	});
});

app.post('/changeDetails', middleware.requireAuthentication, function(req, res) {
	console.log(req.body);
	var body = _.pick(req.body, "username", "password");
	usercontroller.changeDetails(req.user, body).then(function() {
		res.redirect('/myProfile.html');
	}, function() {
		res.status(401).send();
	});
});


app.post('/favorite', middleware.requireAuthentication, function(req, res) {
	var body = _.pick(req.body, "room", "favorite");
	if (body.favorite === 'true') {
		body.favorite = true;
	} else if (body.favorite === 'false') {
		body.favorite = false;
	}
	usersroomscontroller.favoriteChange(req.user, body).then(function() {
		res.redirect('/favorite.html');
	}, function(error) {
		res.status(401).send();
	});
});

app.post('/forgotPassword', function(req, res) {
	var body = _.pick(req.body, "email");
	usercontroller.forgotPassword(body).then(function() {
			res.send('sent to that email');
		},
		function(error) {
			if (error) {
				return res.status(400).send("bad syntax");
			} else {
				res.send('sent to that email');
			}
		});
});

app.get('/getPassword', function(req, res) {
	var query = req.query;
	usercontroller.getPassword(query).then(function(password) {
		res.send('your new password is: ' + password);
	}, function() {
		res.status(401).send();
	});
});

app.post('/signin', middleware.validCheck, function(req, res) {
	console.log(req.user);
	usercontroller.signin(req.user).then(function(token) {
		var Auth = token;
		res.cookie('Auth', token).redirect('/landing.html');
	}, function() {
		res.status(401).send('102');
	});
});

//signout is truely delete
app.get('/signout', middleware.requireAuthentication, function(req, res) {
	usercontroller.signout(req.user).then(function() {
		res.status(204).clearCookie("Auth").redirect('/index.html');
	}, function() {
		res.status(401).send();
	});
});


app.get('/deleteUser', middleware.requireAuthentication, function(req, res) {
	usercontroller.deleteUser(req.user).then(function() {
		res.status(204).redirect('/index.html');
	}, function() {
		res.status(401).send();
	});
});

app.post('/connectViaInvite', middleware.requireAuthentication, function(req, res) {
	var body = _.pick(req.body, 'invite');
	usersroomscontroller.connectViaInvite(req.user, body.invite).then(function() {
		res.status(204).send();
	}, function() {
		res.status(401).send();
	});
});



function sendCurrentUsers(socket) {
	var info = clientInfo[socket.id];
	var users = [];

	if (typeof info == 'undefined') {
		return;
	}

	Object.keys(clientInfo).forEach(function(socketId) {
		var userInfo = clientInfo[socketId];

		if (info.room == userInfo.room) {
			users.push(userInfo.username);
		}
	});

	socket.emit('Smessage', {
		sender: 'System',
		text: 'Current users: ' + users.join(', '),
		timestamp: moment().valueOf()
	});
}

function sendPrivate(message, username) {
	var text = message.text.replace('@private', ' ').trim();
	if (text != null && text.length > 0) {
		console.log('private != null');
		var arrayText = text.split(" ");
		Object.keys(clientInfo).forEach(function(socketId) {
			var name = clientInfo[socketId].username;
			if (arrayText[0] == name) {
				io.to(socketId).emit('Smessage', {
					text: text.replace(name, ' ').trim(),
					timestamp: moment().valueOf(),
					sender: username
				});
			}
		});
	}
}

io.on('connection', function(socket) {
	console.log('path: ' + __dirname);
	var token = socket.handshake.headers.cookie.split(" ");
	if (token[1]) {
		if (token[1].length > token[0].length) {
			token = token[1];
		} else {
			token = token[0];
			token = token.slice(0, token.length - 1);
		}
		token = token.slice(5, token.length);
		db.user.findByToken(token).then(function(user) {
			socket.chatUser = user;
		}, function() {});
	}


	function messageUploader(message) {
		db.room.findOne({
			where: {
				title: clientInfo[socket.id].room
			}
		}).then(function(room) {
			if (room == null) {} else {
				message.roomId = room.id;
				if (message.TTL == true) {
					io.to(clientInfo[socket.id].room).emit('requireM', {});
					conversationcontroller.upload(message).then(function() {
						io.to(clientInfo[socket.id].room).emit('requireM', {});
					});
				} else {
					conversationcontroller.upload(message).then(function() {
						io.to(clientInfo[socket.id].room).emit('requireM', {});
					});
				}


			}
		}, function() {});
	}

	function messageChanger(id, messageUpload) {
		conversationcontroller.editMessage(socket.chatUser, id, messageUpload).then(function() {
			io.to(clientInfo[socket.id].room).emit('requireM', {});
		});
	}

	socket.on('disconnect', function() {

		var userData = clientInfo[socket.id];
		if (typeof userData != 'undefined') {
			socket.leave(userData.room);
			io.to(userData.room).emit('Smessage', {
				sender: 'System',
				text: userData.username + ' has left!',
				timestamp: moment().valueOf()
			});
			delete clientInfo[socket.id];
		}
	});
	socket.on('target', function(target) {
		var user = socket.chatUser.toPublicJSON();
		socket.emit('target', user);
	});

	socket.on('targeta', function(target) {
		usercontroller.findByUsername(target.user).then(function(user) {
			socket.emit('target', user);
		});
	});


	socket.on('target2', function(target) {
		if (target.target === 'public') {
			roomcontroller.showPublicRooms().then(function(rooms) {
				socket.emit('target2', rooms);
			});
		} else {
			usersroomscontroller.rooms(socket.chatUser).then(function(rooms) {
				socket.emit('target2', rooms);
			});
		}
	});

	socket.on('target4', function(target) {
		console.log('in');
		usersroomscontroller.favoriteRooms(socket.chatUser).then(function(rooms) {
			socket.emit('target4', rooms);
		});
	});
	socket.on('target3', function(target) {
		roomcontroller.findRoomByTitle(target.title, socket.chatUser).then(function(room) {
			socket.emit('target3', room);
		}, function() {
			socket.emit('target3', null);
		});

	});

	socket.on('deleteMessage', function(request) {
		var id = request.id;
		conversationcontroller.deleteMessage(socket.chatUser, id).then(function() {
			io.to(clientInfo[socket.id].room).emit('requireM', {});
		});
	});

	socket.on('delete', function() {
		console.log('delete');
		roomcontroller.deleteRoom(socket.chatUser, clientInfo[socket.id].room).then(function() {
			io.to(clientInfo[socket.id].room).emit('land', {});
		});
	});
	socket.on('changeMessage', function(request) {
		var id = request.id;
		var messageUpload = {};
		if (_.isString(request.messageUpload.text)) {
			messageUpload.text = request.messageUpload.text;
		} else {
			messageUpload.text = null;
		}

		if (_.isString(request.messageUpload.photo)) {

			if (request.messageUpload.photo.match(/^data:image\//)) {
				var data = request.messageUpload.photo.indexOf('base64,') + 7;
				data = request.messageUpload.photo.slice(data);
				var buffer = new Buffer(data, 'base64');
				jimpBufferMessage(buffer).then(function(photoDataUrl) {
					messageUpload.photo = photoDataUrl;
					messageChanger(id, messageUpload);
				});
			} else {
				messageUpload.photo = null;
				messageChanger(id, messageUpload);
			}

		} else {
			messageUpload.photo = null;
			messageChanger(id, messageUpload);
		}
	});

	socket.on('message', function(message) {
		var original = message;

		if (message.text == '@currentUsers') {
			sendCurrentUsers(socket);
		} else if (message.text != undefined && message.text.search('@private') != -1) {
			sendPrivate(message, socket.chatUser.username);
		} else if (message.text != undefined && message.text == '@users') {
			usersroomscontroller.usersInRoom(clientInfo[socket.id].room, socket.chatUser).then(function(users) {
				var text = 'Users in Room: ' + users;
				socket.emit('Smessage', {
					sender: 'System',
					text: text,
					timestamp: moment().valueOf()
				})
			});
		} else {
			var message = {
				time: moment().valueOf(),
				userId: socket.chatUser.id,
				sender: socket.chatUser.username
			};
			if (typeof(original.text) == 'string' && original.text.trim().length > 0) {
				message.text = original.text.trim();
			}
			if (typeof(original.TTL) === 'boolean') {
				message.TTL = original.TTL;
			}
			if (typeof(original.photo) === 'string') {
				if (original.photo.match(/^data:image\//)) {
					var data = original.photo.indexOf('base64,') + 7;
					data = original.photo.slice(data);
					var buffer = new Buffer(data, 'base64');

					jimpBufferMessage(buffer).then(function(photoDataUrl) {
						message.photo = photoDataUrl;
						messageUploader(message);
					});



				} else {
					messageUploader(message);
				}
			} else {
				messageUploader(message);
			}



		}
	});

	socket.emit('Smessage', {
		sender: 'System',
		text: 'Welcome to the chat application',
		timestamp: moment().valueOf()
	});

	socket.on('deleteUserFRoom', function(username) {
		var input = {
			userToRemove: username
		};
		input.room = clientInfo[socket.id].room;
		console.log(input);
		usersroomscontroller.deleteUserFromRoom(socket.chatUser, input).then(function() {});
	});
	socket.on('exitRoom', function(username) {
		var input = {
			userToRemove: socket.chatUser.username
		};
		input.room = clientInfo[socket.id].room;
		console.log(input);
		usersroomscontroller.exitRoom(socket.chatUser, input).then(function() {});
	});

	socket.on('sendMail', function() {
		conversationcontroller.sendToMail(socket.chatUser, clientInfo[socket.id].room);
	});

	socket.on('clear', function(obj) {
		conversationcontroller.clearConversation(socket.chatUser, clientInfo[socket.id].room).then(function() {
			io.to(clientInfo[socket.id].room).emit('requireM', {});
		});

	});

	socket.on('myPhoto', function() {
		if (socket.chatUser.toPublicJSON().photo != null) {
			socket.emit('myPhoto', socket.chatUser.toPublicJSON().photo);
		}
	});
	socket.on('icon', function(request) {
		roomcontroller.findRoomByTitle(request.title, socket.chatUser).then(function(room) {
			if (room.icon != null) {}
			socket.emit('icon', room.icon);
		});
	});

	socket.on('allR', function() {
		db.room.findAll().then(function(rooms) {
			roomArrayT(rooms).then(function(titles) {

				socket.emit('allR', titles);
			});
		});
	});

	socket.on('allU', function() {
		db.user.findAll().then(function(users) {
			userArrayUn(users).then(function() {
				socket.emit('allU', users);
			});
		});
	});

	socket.on('roomJoin', function(target) {
		conversationcontroller.seeMessages(target.title, socket.chatUser).then(function(messages) {
			console.log('sent to: ' + socket.chatUser.username);
			clientInfo[socket.id] = {
				room: target.title,
				username: socket.chatUser.username
			};
			console.log(clientInfo[socket.id]);
			socket.join(clientInfo[socket.id].room);
			socket.emit('messages', messages);
			socket.broadcast.to(clientInfo[socket.id].room).emit('Smessage', {
				sender: 'System',
				text: clientInfo[socket.id].username + ' has joined!',
				timestamp: moment().valueOf()
			});
		}, function() {
			socket.emit('land');
		});
	});
	socket.on('requireM', function() {
		conversationcontroller.seeMessages(clientInfo[socket.id].room, socket.chatUser).then(function(messages) {
			console.log(messages);
			socket.emit('messages', messages)
		}, function() {
			socket.emit('land');
		});
	});
});

db.sequelize.sync(
	/*{
		force: true
	}*/
).then(function() {
	http.listen(PORT, function() {
		console.log('Express server is listening on port ' + PORT);
	});
});