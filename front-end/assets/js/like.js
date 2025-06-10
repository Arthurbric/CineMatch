// Recupera os parâmetros da URL
const params = new URLSearchParams(window.location.search);
const token = params.get('token');
const username = params.get('user');
let filme = null;
let list_gener = null;
let list_dislike_gener = null;
let movie_ids = [];
let list_movies = null;

// Cria a conexão WebSocket
const socket = io("/", {
  path: "/socket.io",
  transports: ["websocket"],
});
socket.on('connect', () => {
  console.log('Conectado:', socket.id);
  // Envia os dados da sessão e usuário
  socket.emit('join_session', {
    token,
    username
  });
});

socket.on('session_genres', (generos) => {
  list_gener = generos; 
});

socket.on('session_dislike_genres', (generos) => {
  list_dislike_gener = generos; 
});

socket.on('movie_ids_and_qtdusers', (movie, numUsers)=>{
  console.log("ids filmes:", movie);
  console.log('qtdusers: ', numUsers);
  calcPercent(movie, numUsers);
});

// Tratamento de erro caso o usuário não esteja na lista
socket.on('session_error', (err) => {
  console.error('Erro:', err.message);
  alert('Você não tem permissão para acessar essa sessão.');
  window.location.href = 'https://cinematch.ghzds.com.br:8080/'; // Redireciona para entry_lobby
});

//função calcula match
async function calcPercent(movie, qtdusers) {
  const counts = {};
  const porcentagem = (60 * qtdusers) / 100;
  console.log(porcentagem);

  movie.forEach(num => {
    // Atualiza o contador corretamente
    counts[num] = (counts[num] || 0) + 1;

    // Verifica se já atingiu ou passou a porcentagem mínima
    if (counts[num] >= porcentagem) {
      console.log(counts[num], porcentagem)
      window.location.href = `https://cinematch.ghzds.com.br:8080/match?movie_id=${num}`;
    }
  });
}

// Funções para bloquear/desbloquear os botões
function bloquearBotoes() {
	document.querySelectorAll('.action-form button').forEach(btn => {
		btn.disabled = true;
		const loader = btn.querySelector('.loading_button');
		if (loader) loader.style.display = 'inline-block';
	});
}

function desbloquearBotoes() {
	document.querySelectorAll('.action-form button').forEach(btn => {
		btn.disabled = false;
		const loader = btn.querySelector('.loading_button');
		if (loader) loader.style.display = 'none';
	});
}

// Função para carregar filme
async function carregarFilme() {
  const loading = document.getElementById('loading');
  const erro = document.getElementById('erro');
  const conteudo = document.getElementById('conteudo');

  bloquearBotoes(); // Bloqueia antes de começar a carregar

  try {
    let resposta;

    if (list_gener == null) {
      resposta = await fetch('/api/movie');
    } else {
      let api_url = "/api/movie?genre=" + list_gener.join(",");
      if (list_dislike_gener != null) {
        api_url += `&exclude_genre=${list_dislike_gener.join(',')}`;
      }
      api_url += `&exclude=${movie_ids.join(',')}`;
      resposta = await fetch(api_url);
    }

    if (!resposta.ok) {
      throw new Error(`Status: ${resposta.status}`);
    }

    filme = await resposta.json();

    // Atualiza a página
    document.querySelector('.photo-img').src = filme.poster;
    document.querySelector('.photo-img').alt = filme.title;
    document.querySelector('.photo-name-and-age h2').textContent = filme.title + ' (' + filme.year + ')';
    document.querySelector('.photo-bio a').href = filme.tmdb_url;
    document.querySelector('.geners').textContent = filme.genres.map(g => g.name).join(', ');
    document.querySelector('.nota').textContent = 'Nota: ' + filme.rating;

    loading.style.display = 'none';
    conteudo.style.display = 'block';
  } catch (err) {
    console.error('Erro ao carregar o filme:', err);
    loading.style.display = 'none';
    erro.style.display = 'block';
  } finally {
    desbloquearBotoes(); // Libera após carregar (sucesso ou erro)
  }
}

// Ações do usuário (like/dislike)
document.getElementById('action_like').addEventListener('submit', (e) => {
  e.preventDefault();
  bloquearBotoes(); // Bloqueia ao clicar
  const generosDoFilme = filme.genres.map(g => g.id);
  socket.emit('movie_action', {
    token,
    username,
    action: 'like',
    genres: generosDoFilme,
    movie: filme.id
  });
  movie_ids.push(filme.id);
  carregarFilme();
});

document.getElementById('action_neutral').addEventListener('submit', (e) => {
  e.preventDefault();
  bloquearBotoes();
  socket.emit('movie_action', { token, username, action: 'neutral' });
  movie_ids.push(filme.id);
  carregarFilme();
});

document.getElementById('action_dislike').addEventListener('submit', (e) => {
  e.preventDefault();
  bloquearBotoes();
  const generosDoFilme = filme.genres.map(g => g.id);
  socket.emit('movie_action', { token, username, action: 'dislike', genres: generosDoFilme });
  movie_ids.push(filme.id);
  carregarFilme();
});

/*document.getElementById('action_logout').addEventListener('submit', (e)=>{
  e.preventDefault();
  socket.emit('');
});*/

document.addEventListener('DOMContentLoaded', () => {
  carregarFilme();
});
