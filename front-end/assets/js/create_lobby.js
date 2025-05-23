document.getElementById('create_lobby').addEventListener('submit', async function (event) {
    event.preventDefault();
  
    const user = document.getElementById('name').value.trim();
  
    if (!user) {
      alert("Por favor, preencha o campo de usuário.");
      return;
    }
  
    const encodedUser = encodeURIComponent(user);
  
    try {
      const response = await fetch(`http://177.235.191.39:3535/get_session?user=${encodedUser}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
  
      if (response.ok) {
        const responseData = await response.json();
        const encodedToken = encodeURIComponent(responseData.session_token);
        window.location.href = `http://177.235.191.39:5500/front-end/views/lobby.html?token=${encodedToken}&user=${encodedUser}`;
      } else {
        const errorData = await response.json();
        alert('Erro ao entrar na sessão: ' + errorData.message);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao entrar na sessão: ' + error.message);
    }
  });
  