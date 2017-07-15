var PORT = process.env.PORT || 3000;
var express = require('express');
var app = express();
var http = require('http').Server(app);
var db = require('./db.js');
app.get('/abc', function(req, res) {
	db.a.create({
		atr: 'abcdefg'
	}).then(function() {
		res.send('good');
	}, function() {
		res.send('bad');
	});
});
db.sequelize.sync().then(function() {
	http.listen(PORT, function() {
		console.log('Express server listening on port ' + PORT);
	});
});