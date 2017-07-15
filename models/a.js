module.exports = usersrooms = function(sequelize, DataTypes) {
	return sequelize.define('a', {
		atr: DataTypes.STRING
	});
};