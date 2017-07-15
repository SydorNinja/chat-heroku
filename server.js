var PORT = process.env.PORT || 3000;
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
var SocketIOFileUploadServer = require("socketio-file-upload");
SocketIOFileUploadServer.listen(app);
app.use(SocketIOFileUploadServer.router);
app.get('/abc', function(req, res) {
	db.a.create({
		atr: 'abc1fg'
	}).then(function(a) {
		db.a.findOne({
			where: {
				id: 7
			}
		}).then(function(b) {
			res.send(b);
		}, function() {
			res.send('bad2');
		});
	}, function() {
		res.send('bad');
	});
});
app.post('/signup', function(req, res) {
	var body = _.pick(req.body, 'email', 'password', 'username');
	console.log(body);
	usercontroller.signup(body).then(function(user) {
		res.send('Please Validate your account through mail');
	}, function(error) {
		res.status(400).send(error);
	});
});
db.sequelize.sync({
	force: true
}).then(function() {
	http.listen(PORT, function() {
		console.log('Express server listening on port: ' + PORT);
	});
});