const express = require('express');
const app = express();
app.use(express.json());
const { models: { User, Note }} = require('./db');
const path = require('path');
const bcrypt = require('bcrypt')
var jwt = require('jsonwebtoken')

const requireToken = async (req,res,next) => {
  try {
    const token = req.headers.authorization
    const user = await User.byToken(token)
    req.user = user
    next()
  } catch (error) {
    next(error)
  }
}

app.get('/', (req, res)=> res.sendFile(path.join(__dirname, 'index.html')));

app.post('/api/auth', async(req, res, next)=> {

  try {

    const user = await User.findAll({where: {username: req.body.username}})

    const match = await bcrypt.compare(req.body.password, user[0].password)

    if(match){
      res.send({ token: jwt.sign({id: await User.authenticate(user[0])}, process.env.JWT)});
    } else {
      res.send('nah')
    }
  }
  catch(ex){
    next(ex);
  }
});

app.get('/api/auth', requireToken, async(req, res, next)=> {


  try {
    res.send(req.user);
  }
  catch(ex){
    next(ex);
  }
});

app.get('/api/users/:id/notes', requireToken, async(req, res, next)=> {

  try {

    const userToken = req.user

    if(Number(req.params.id) === userToken.id){

      const user = await User.findByPk(req.params.id, {include: Note})
      res.send(user.notes);

    } else {
      res.send([])
    }
  }
  catch(ex){
    next(ex);
  }

});

app.use((err, req, res, next)=> {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;
