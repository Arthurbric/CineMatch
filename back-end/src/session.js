const express = require('express');
require('dotenv').config();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const collectionName = process.env.session_table;

// GET: cria sessão com usuário
router.get('/get_session', async (req, res) => {
  const response = await axios.get('http://localhost:3535/movie');
  const titulo_movie = response.data.title;
  const sessionToken = titulo_movie.normalize("NFD")
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9 ]/g, '')
  .replace(/ /g, '-')
  .toLowerCase();

  const user = req.query.user;
  if (!user) {
    return res.status(400).json({ error: 'Usuário não fornecido.' });
  }

  req.session.lobby = {
    users: { "1": user },
    qtdusers: 1,
    token: sessionToken
  };

  res.json({
    session_token: sessionToken, user,
    message: 'Sessão iniciada com sucesso!'
  });
});


router.post('/post_session', async (req, res) => {
  const { user, token } = req.body;
  if (!user || !token) {
    return res.status(400).json({ error: 'User ou token ausente.' });
  }

  const sessionDoc = await req.db.collection(collectionName).findOne({
    session: { $regex: `"token":"${token}"` }
  });

  if (!sessionDoc) {
    return res.status(404).json({ error: 'Sessão não encontrada.' });
  }

  const sessionObj = JSON.parse(sessionDoc.session);

  if (!sessionObj.lobby) {
    sessionObj.lobby = { users: {}, token, qtdusers: 0 };
  }

  const nextId = Object.keys(sessionObj.lobby.users).length + 1;
  sessionObj.lobby.users[nextId.toString()] = user;
  sessionObj.lobby.qtdusers = Object.keys(sessionObj.lobby.users).length;

  await req.db.collection(collectionName).updateOne(
    { _id: sessionDoc._id },
    { $set: { session: JSON.stringify(sessionObj) } }
  );

  const updatedDoc = await req.db.collection(collectionName).findOne({ _id: sessionDoc._id });
  const updatedSession = JSON.parse(updatedDoc.session);
  const users = Object.values(updatedSession.lobby.users);

  const io = req.app.get('io');
  io.to(token).emit('session_users', { users });

  res.json({
    message: 'Usuário adicionado à sessão com sucesso.',
    session_token: token, user
  });
});

module.exports = router;
