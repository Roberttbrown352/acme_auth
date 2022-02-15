const bcrypt = require('bcrypt');
const saltRounds = 10;
var jwt = require('jsonwebtoken')

const Sequelize = require('sequelize');
const { STRING } = Sequelize;
const config = {
  logging: false
};

if(process.env.LOGGING){
  delete config.logging;
}
const conn = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost/acme_db', config);

const User = conn.define('user', {
  username: STRING,
  password: STRING
});

User.addHook('beforeCreate', (user) => {
  user.password = bcrypt.hashSync(user.password, saltRounds)
});

User.byToken = async(token)=> {
  try {
    const user = await User.findByPk(jwt.verify(token, process.env.JWT).id);
    if(user){
      return user;
    }
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  }
  catch(ex){
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  }
};

User.authenticate = async({ username, password })=> {
  const user = await User.findOne({
    where: {
      username,
      password
    }
  });
  if(user){
    return user.id;
  }
  const error = Error('bad credentials');
  error.status = 401;
  throw error;
};

const Note = conn.define('note', {
  text: STRING,
});


Note.belongsTo(User)
User.hasMany(Note)

const syncAndSeed = async()=> {
  await conn.sync({ force: true });
  const credentials = [
    { username: 'lucy', password: 'lucy_pw'},
    { username: 'moe', password: 'moe_pw'},
    { username: 'larry', password: 'larry_pw'}
  ];
  const notes = [
    { text: 'this is a note', userId: 1},
    { text: 'how do you hash', userId: 2},
    { text: 'imma learn rust', userId: 3}
  ]
  const [lucy, moe, larry] = await Promise.all(
    credentials.map( credential => User.create(credential))
  );
  const [note1, note2, note3] = await Promise.all(
    notes.map( note => Note.create(note))
  );
  return {
    users: {
      lucy,
      moe,
      larry
    },
    notes: {
      note1,
      note2,
      note3
    }
  };
};

module.exports = {
  syncAndSeed,
  models: {
    User,
    Note
  }
};
