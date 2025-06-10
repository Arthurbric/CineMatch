// web_socket_lobby.js

// Recupera os parâmetros da URL
const params = new URLSearchParams(window.location.search);
const tokenFromUrl = params.get('token'); // Renomeado para evitar conflito com a variável token global se houver
const usernameFromUrl = params.get('user');

const sessionCodeDisplay = document.getElementById('sessionCodeDisplay');
const userListUL = document.getElementById('user-list'); // Referência direta ao UL
const startLobbyForm = document.getElementById('Start_lobby');

// Conecta ao servidor WebSocket
const socket = io("/", {
  path: "/socket.io",
  transports: ["websocket"],
});
socket.on('connect', () => {
  console.log('Conectado ao servidor WebSocket com ID:', socket.id);

  // Verifica se token e username existem antes de emitir
  if (tokenFromUrl && usernameFromUrl) {
    console.log(`Entrando na sessão com token: ${tokenFromUrl} e usuário: ${usernameFromUrl}`);
    socket.emit('join_session', {
      token: tokenFromUrl,
      username: usernameFromUrl
    });
  } else {
    console.error('Token ou usuário não encontrado na URL. Redirecionando para home.');
    // alert('Erro: Token da sessão ou nome de usuário ausente. Você será redirecionado.');
    window.location.href = `https://cinematch.ghzds.com.br:8080/`;
  }
});

// Evento de erro de sessão vindo do servidor
socket.on('session_error', (err) => {
  console.error('Erro de sessão do servidor:', err.message);
  alert('Erro na sessão: ' + (err.message || 'Ocorreu um problema.'));
  window.location.href = `https://cinematch.ghzds.com.br:8080/`;
});

// Desconexão do WebSocket
socket.on('disconnect', (reason) => {
  console.log('Desconectado do servidor WebSocket:', reason);
  // Pode ser interessante não redirecionar imediatamente em todos os casos de disconnect,
  // pois pode ser uma perda temporária de conexão. Mas, para este exemplo, mantemos o redirecionamento.
  // alert('Você foi desconectado. Redirecionando para a página inicial.');
  // window.location.href = `http://localhost:5500/front-end/views/home.html`;
});

// Recebe e atualiza a lista de usuários na sessão
socket.on('session_users', (data) => {
  if (!data || !Array.isArray(data.users)) {
    console.error('Dados de usuários inválidos recebidos:', data);
    return;
  }
  
  console.log('👥 Lista atualizada de usuários:', data.users);

  // Atualiza o display do código da sessão (token)
  if (sessionCodeDisplay && tokenFromUrl) {
    sessionCodeDisplay.textContent = tokenFromUrl;
  }

  if (userListUL) {
    userListUL.innerHTML = ''; // Limpa a lista antes de atualizar

    data.users.forEach((user, index) => {
      const li = document.createElement('li');
      // Aplica classes Bootstrap para layout flexível e alinhamento
      li.className = 'list-group-item d-flex justify-content-between align-items-center';
      
      const spanNome = document.createElement('span');
      spanNome.textContent = user;
      spanNome.title = user; // Tooltip com o nome do usuário

      const deleteButton = document.createElement('button');
      deleteButton.className = 'btn btn-sm delete-user-btn'; // Estilo definido no HTML/CSS
      if(index !== 0){
        deleteButton.setAttribute('aria-label', `Remover ${user}`);
        deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>'; // Ícone de lixeira do Font Awesome
      }
      
      // Adiciona um atributo de dados para identificar o usuário ao clicar
      deleteButton.dataset.username = user;
      
      deleteButton.onclick = function() {
        // Lógica para remover o usuário (você implementará isso)
        // Isso provavelmente envolverá enviar um evento via Socket.IO para o servidor
        console.log(`Botão de remover clicado para o usuário: ${this.dataset.username}`);
        const userToRemove = this.dataset.username;
        
        // Exemplo de como você poderia pedir confirmação e emitir o evento
         if (confirm(`Tem certeza que deseja remover "${userToRemove}" da sessão?`)) {
           socket.emit('request_remove_user', { 
             token: tokenFromUrl, 
             usernameToRemove: userToRemove 
           });
           console.log(`Solicitação para remover "${userToRemove}" enviada.`);
         }
      };

      // Aplica estilo especial para o primeiro usuário (considerado o host)
      // E decide se mostra o botão de deletar (ex: host não pode ser deletado, ou só host pode deletar)
      if (index === 0) {
        li.classList.add('host-user'); // Adiciona classe para estilização CSS específica do host
        // Se o usuário atual for o host, talvez ele possa remover outros, mas não a si mesmo.
        // Ou, se apenas o host pode remover, e este é o host, ele não tem botão para si.
        // A lógica exata de quem pode remover quem dependerá das regras do seu jogo/app.
        // Exemplo simples: Não mostrar botão de lixeira para o próprio host.
        if (user === usernameFromUrl) { // Se o usuário da lista é o usuário atual E é o host
            // deleteButton.style.display = 'none'; // Esconde o botão para o host se auto-remover
        }
      }
      // Se o usuário atual não for o host, ele não deve poder remover outros (a menos que seja uma regra do seu app)
      // if (index !== 0 && user !== usernameFromUrl) {
          // Apenas o host pode remover outros?
          // if (usernameFromUrl !== data.users[0]) { // Se o usuário atual não é o host
          //    deleteButton.style.display = 'none';
          // }
      // }


      li.appendChild(spanNome);
      // Só adiciona o botão de deletar se não for o próprio usuário E se o usuário atual for o host (exemplo de regra)
      // Ou se você quer que todos tenham um botão (exceto talvez para si mesmos, se não forem host)
      // A lógica de quem pode deletar quem deve ser validada no servidor!
      // Para este exemplo, vamos mostrar para todos, exceto para o próprio usuário se ele não for o host.
      // Ou, mais simples por agora: mostrar para todos e a lógica de permissão fica no servidor.
      // if (user !== usernameFromUrl || (index === 0 && user === usernameFromUrl) /* host pode ver seu botão, mas a lógica de clique pode impedir a auto-remoção */) {
      li.appendChild(deleteButton); // Adiciona o botão de deletar
      // }
      
      userListUL.appendChild(li);
    });
  }
});

// Evento para iniciar a sessão (quando o host clica no botão)
if (startLobbyForm) {
  startLobbyForm.addEventListener('submit', (event) => {
    event.preventDefault(); // Previne o envio padrão do formulário
    if (tokenFromUrl) {
      console.log(`Host iniciando a sessão com token: ${tokenFromUrl}`);
      socket.emit('start_session', { token: tokenFromUrl });
    } else {
      console.error('Token não disponível para iniciar a sessão.');
      alert('Erro: Não foi possível iniciar a sessão, token ausente.');
    }
  });
}

// Evento para redirecionar todos os usuários para a página de "like"
socket.on('redirect_to_like', () => {
  console.log('Recebido evento redirect_to_like. Redirecionando...');
  if (tokenFromUrl && usernameFromUrl) {
    window.location.href = `https://cinematch.ghzds.com.br:8080/like?token=${tokenFromUrl}&user=${usernameFromUrl}`;
  } else {
    console.error('Não é possível redirecionar para like.html: token ou usuário ausente.');
    // Redirecionar para home em caso de erro para não ficar preso no lobby
    // window.location.href = `http://localhost:5500/front-end/views/home.html`;
  }
});

// Opcional: Lidar com erros de conexão do socket
socket.on('connect_error', (err) => {
  console.error('Falha ao conectar com o servidor WebSocket:', err.message);
  if (sessionCodeDisplay) {
    sessionCodeDisplay.textContent = "ERRO DE CONEXÃO";
    sessionCodeDisplay.style.color = "red";
    sessionCodeDisplay.style.fontSize = "1.5rem";
  }
  // Poderia mostrar uma mensagem mais amigável para o usuário aqui
});