var PORT = process.env.PORT || 3000;
var express = require('express');
var app = express();
var http = require('http').Server(app);
var db = require('./db.js');
app.get('/abc', function(req, res) {
	db.a.create({
		atr: 'abcdefg'
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
db.sequelize.sync().then(function() {
	http.listen(PORT, function() {
		console.log('Express server listening on port ' + PORT);
	});
});