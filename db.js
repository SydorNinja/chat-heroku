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
    room: sequelize.import(__dirname + '/models/room.js')
      // add your other models here
  }

  /*
    Associations can be defined here. E.g. like this:
    global.db.User.hasMany(global.db.SomethingElse)
  */
}

module.exports = global.db