document.getElementById('entry_lobby').addEventListener('submit', async function (event) {
  event.preventDefault();

  const user = document.getElementById('name').value.trim();
  const token = document.getElementById('token').value.trim();

  if (!user || !token) {
    alert("Por favor, preencha todos os campos.");
    return;
  }

  const data = { user: user, token: token };

  try {
    const response = await fetch('http://177.235.191.39:3535/post_session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      // Redireciona diretamente com os dados fornecidos
      const encodedUser = encodeURIComponent(user);
      const encodedToken = encodeURIComponent(token);
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
