const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('./models/user');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const ws = require('ws')
const Message = require('./models/Message')

dotenv.config();

mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log('Mongoose Connected');
  })
  .catch((err) => {
    console.error('Error Connecting:', err);
  });

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  credentials: true,
  origin: 'http://localhost:5173',
}));

const jwtSec = 'Anu@2345';
const bcryptSalt = bcrypt.genSaltSync(10);

const server = app.listen(4000, () => {
  console.log('Server is running on port 4000');
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPass = bcrypt.hashSync(password, bcryptSalt);
  try {
    const createdUser = await User.create({ username, password: hashedPass });
    jwt.sign({ userId: createdUser._id ,  username }, jwtSec, {}, (err, token) => {
      if (err) {
        console.error('JWT Signing Error:', err);
        return res.status(500).json({ error: 'Token generation failed' });
      }
      res.cookie('token', token).status(201).json({
        id: createdUser._id,
        username: createdUser.username,
      });
    });
  } catch (err) {
    console.error('User Creation Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/profile', (req, res) => {
  const { token } = req.cookies;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  jwt.verify(token, jwtSec, {}, (err, userData) => {
    if (err) {
      console.error('JWT Verification Error:', err);
      return res.status(403).json({ error: 'Token verification failed' });
    }
    res.json(userData);
  });
});

app.post('/login' , async(req,res) => {
  const {username , password} = req.body;
  const userDoc = await User.findOne({username});
  const matchPass = bcrypt.compareSync(password , userDoc.password);
  if(matchPass){
    jwt.sign({userId:userDoc._id , username} , jwtSec , {} , (err , token) => {
      res.cookie('token' , token).json({
        id: userDoc._id,
        username: userDoc.username
      })
    })
  }
})

async function getUserDataFromRequest(req) {
  return new Promise((resolve , reject) => {
    const { token } = req.cookies;

    jwt.verify(token, jwtSec, {}, (err, userData) => {
      if (err) {
        reject('JWT Verification Error:', err);
      }
      resolve(userData);
    })
  })
} 

app.get('/messages/:userId' , async(req,res) =>{
  const {userId} = req.params;
  const userData = await getUserDataFromRequest(req);
  const ourUserId =userData.userId
  const mess = await Message.find({
    sender: {$in: [userId , ourUserId]},
    recipient: {$in: [userId , ourUserId]},
  }).sort({createdAt:1})
  res.json(mess)

})

app.get('/people' , async(req,res) => {
  const offlineUsers = await User.find({} , {'_id':1 , 'username':1})
  res.json(offlineUsers)
})

const wss = new ws.WebSocketServer({server});

wss.on('connection' , (connection , req) => {

  function notifyAboutOnlinePeople(){
    [...wss.clients].forEach(client => {
      client.send(JSON.stringify({
        online: [...wss.clients].map(c => ({userId:c.userId , username:c.username}))
      }))
    });
  }

  connection.isAlive = true;

  connection.timer = setInterval(() => {
    connection.ping();
    connection.deathTimer = setTimeout(() => {
      connection.isAlive = false
      connection.terminate()
      notifyAboutOnlinePeople()
      console.log('dead')
    } , 1000)
  } , 5000)

  connection.on('pong' , () => {
    clearTimeout(connection.deathTimer)
  })

  const cookies = req.headers.cookie
  if(cookies){
    const tokenCookieString = cookies.split(';').find(str => str.startsWith('token='))
    if(tokenCookieString){
      const token = tokenCookieString.split('=')[1];
      if(token){
        jwt.verify(token , jwtSec , {} , (err , userData) => {
          if(err) throw err;
          const {userId , username} = userData;
          connection.userId = userId;
          connection.username = username
        })
      }
    }
  }
  connection.on('message' , async(message) => {
    message = JSON.parse(message.toString());

    const {recipient , text} = message
    if(recipient && text){
      const messageDoc = await Message.create({
        sender: connection.userId,
        recipient: recipient,
        text: text
      });

      [...wss.clients].filter(c => c.userId === recipient)
      .forEach(c => c.send(JSON.stringify({text , sender:connection.userId , _id:messageDoc._id , recipient})))
    }
  });
  notifyAboutOnlinePeople()

})
