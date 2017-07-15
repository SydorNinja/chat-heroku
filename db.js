if (!global.hasOwnProperty('db')) {
  var Sequelize = require('sequelize'),
    sequelize = null
  console.log(__dirname);
  if (process.env.DATABASE_URL) {
    var match = process.env.DATABASE_URL.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    // the application is executed on Heroku ... use the postgres database
    sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      protocol: 'postgres',
      port: match[4],
      host: match[3],
      logging: true //false
    })
  } else {
    // the application is executed on the local machine ... use mysql
    sequelize = new Sequelize('example-app-db', 'root', null);
  }

  global.db = {
    Sequelize: Sequelize,
    sequelize: sequelize,
    a: sequelize.import(__dirname + '/models/a.js'),
    user: sequelize.import(__dirname + '/models/user.js'),
    room: sequelize.import(__dirname + '/models/user.js'),
    token: sequelize.import(__dirname + '/models/token.js'),
    conversation: sequelize.import(__dirname + '/models/conversation.js'),
    usersrooms: sequelize.import(__dirname + '/models/usersrooms.js')

    // add your other models here
  }

  global.db.token.belongsTo(global.db.user);
  global.db.user.hasMany(global.db.token);
  global.db.room.belongsToMany(global.db.user, {
    through: global.db.usersrooms
  });
  global.db.user.belongsToMany(global.db.room, {
    through: global.db.usersrooms
  });
}

module.exports = global.db