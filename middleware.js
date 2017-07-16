var cryptojs = require('crypto-js');
var _ = require('underscore');
var cookieParser = require('cookie-parser');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');

function authenticateU(body) {
	return new Promise(function(resolve, reject) {
		if (!_.isString(body.username) || !_.isString(body.password)) {
			console.log('not string ' + body.password + body.username);
			return reject();
		}
		user.findOne({
			where: {
				username: body.username
			}
		}).then(function(user) {
			if (!user || !bcrypt.compareSync(body.password, user.get('password_hash'))) {
				console.log('password error');
				return reject();
			}
			resolve(user);


		}, function(e) {
			reject();
		});
	});
}

function tokenF (token) {
	return new Promise(function(resolve, reject) {
		try {
			var decodedJWT = jwt.verify(token, 'qwerty098');
			var bytes = cryptojs.AES.decrypt(decodedJWT.token, 'abc123!@#!');
			var tokenData = JSON.parse(bytes.toString(cryptojs.enc.Utf8));

			user.findById(tokenData.id).then(function(user) {
				if (user) {
					resolve(user);
				} else {
					reject();
				}
			}, function(e) {
				reject();
			})
		} catch (e) {
			reject();
		}
	});
}

module.exports = function(db) {
	return {
		requireAuthentication: function(req, res, next) {
			console.log(req.cookies.Auth);
			var token = req.cookies.Auth;

			db.token.findOne({
				where: {
					tokenHash: cryptojs.MD5(token).toString()
				}
			}).then(function(tokenInstance) {
				if (!tokenInstance) {
					res.status(401).send();
				}
				req.token = tokenInstance;
				return tokenF(token);
			}, function() {
				res.status(401).send();
			}).then(function(user) {
				if (user.valid != true) {
					res.status(401).json("please validate your account via email");
				}
				req.user = user;
				next();
			}).catch(function() {
				res.status(401).send();
			});
		},
		validCheck: function(req, res, next) {
			var body = _.pick(req.body, 'username', 'password');
			console.log(db);
			authenticateU(body).then(function(user) {
				if (user != null && user.valid == true) {
					req.user = user;
					next();
				} else {
					res.status(401).json("please validate your account via email");
				}
			}, function() {
				res.status(401).send('101');
			});

		}
	}
};