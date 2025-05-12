const express = require('express');
const { connectToDatabase, createMongoStore } = require('./db');
const cors = require('cors');
const session = require('express-session');
const http = require('http');
const { Server } = require('socket.io');

const get_movies = require('./src/get_movies');
const sessions = require('./src/session');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  }
});

const port = 3535;

app.set('io', io);
app.use(cors());
app.use(express.json());

app.use(
  session({
    secret: '123456789',
    resave: false,
    saveUninitialized: false,
    store: createMongoStore(),
    cookie: { secure: false, maxAge: 15 * 60 * 1000 },
  })
);

app.use(async (req, res, next) => {
  try {
    req.db = await connectToDatabase();
    next();
  } catch (err) {
    res.status(500).json({ message: 'Erro interno ao conectar ao banco de dados' });
  }
});

// Rotas
app.use('/', get_movies);
app.use('/', sessions);


const sessionSockets = new Map(); // Mapa de sessões para sockets conectados
const sessionStarted = new Map(); // Armazena se a sessão foi iniciada
const sessionLikedGenres = new Map(); // Armazena os gêneros curtidos por sessão
const sessionLikeMovie = new Map(); //Armazena os filmes curtidos por sessão
const sessionDislikedGenres = new Map();


io.on('connection', (socket) => {
  console.log('Novo cliente conectado via WebSocket');

  socket.on('join_session', async ({ token, username }) => {
    if (!token || !username) return;

    const db = await connectToDatabase();
    const collection = db.collection(process.env.session_table);
    const sessionDoc = await collection.findOne({
      session: { $regex: `"token":"${token}"` }
    });

    if (!sessionDoc) {
      socket.emit('session_error', { message: 'Sessão não encontrada.' });
      return;
    }

    const sessionObj = JSON.parse(sessionDoc.session);
    const existingUsers = Object.values(sessionObj.lobby.users);

    // Só permite usuários já existentes
    if (!existingUsers.includes(username)) {
      socket.emit('session_error', { message: 'Usuário não autorizado para esta sessão.' });
      return;
    }

    socket.join(token); // adiciona à sala da sessão

    // Armazena o socket na sessão
    if (!sessionSockets.has(token)) {
      sessionSockets.set(token, new Set());
    }
    sessionSockets.get(token).add(socket);

    // Verifica se a sessão já foi iniciada
    if (sessionStarted.get(token)) {
      socket.emit('redirect_to_like'); // Redireciona para o like.html
    } else {
      // Emite a lista atual de usuários se a sessão ainda não foi iniciada
      io.to(token).emit('session_users', { users: existingUsers });
    }
  });

  socket.on('start_session', ({ token }) => {
    // Marca a sessão como iniciada
    sessionStarted.set(token, true);

    // Redireciona todos os usuários para o like.html
    io.to(token).emit('redirect_to_like');
  });

  // Lidar com a ação de like/dislike
  socket.on('movie_action', async ({ token, username, action, genres, movie }) => {
    if (action === 'like' && Array.isArray(genres) && movie) {
      //Inicializa o set dos generos curtidos, se necessário
      if (!sessionLikedGenres.has(token)) {
        sessionLikedGenres.set(token, new Set());
      }

      // Inicializa o set de filmes curtidos, se necessário
      if (!sessionLikeMovie.has(token)) {
        sessionLikeMovie.set(token, []);
      }

      const genreSet = sessionLikedGenres.get(token);
      const movielist = sessionLikeMovie.get(token);

      const db = await connectToDatabase();
      const collection = db.collection(process.env.session_table);
      const sessionDoc = await collection.findOne({
        session: { $regex: `"token":"${token}"` }
      });
      const sessionObj = JSON.parse(sessionDoc.session);
      const numUsers = sessionObj.lobby.qtdusers;

      movielist.push(movie);

      // Adiciona os novos IDs ao Set (evita duplicatas)
      genres.forEach(id => genreSet.add(id));

      // Emite lista atualizada para todos da sessão
      io.to(token).emit('session_genres', Array.from(genreSet));
      io.to(token).emit('movie_ids_and_qtdusers', movielist, numUsers);
    }
    if(action === 'dislike' && Array.isArray(genres)){

      //Inicializa o set dos generos discurtidos, se necessário
      if (!sessionDislikedGenres.has(token)) {
        sessionDislikedGenres.set(token, new Set());
      }

      const DislikegenreSet = sessionDislikedGenres.get(token);
      // Adiciona os novos IDs ao Set (evita duplicatas)
      genres.forEach(id => DislikegenreSet.add(id));

      // Emite lista atualizada para todos da sessão
      io.to(token).emit('session_dislike_genres', Array.from(DislikegenreSet));
    }

  });

  socket.on('disconnect', () => {
    for (const [token, sockets] of sessionSockets) {
      sockets.delete(socket);
      if (sockets.size === 0) {
        sessionSockets.delete(token);
      }
    }
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Servidor da API rodando em http://localhost:${port}`);
});
