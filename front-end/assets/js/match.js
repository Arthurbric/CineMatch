const urlParams = new URLSearchParams(window.location.search);
const movie_id = urlParams.get('movie_id');

// Função para carregar filme
async function carregarFilme() {
    const loading = document.getElementById('loading');
    const erro = document.getElementById('erro');
    const conteudo = document.getElementById('conteudo');
    try {
        // Chama a API para obter os detalhes do filme
        const resposta = await fetch(`/api/movie_match?movie_id=${movie_id}`);
        if (!resposta.ok) {
            throw new Error(`Status: ${resposta.status}`);
        }

        const filme = await resposta.json();
        
        // Atualiza o conteúdo da página com os dados do filme
        document.querySelector('.photo-img').src = filme.poster;
        document.querySelector('.photo-img').alt = filme.title;
        document.querySelector('.photo-name-and-age h2').textContent = filme.title+' ('+filme.year+')';
        document.querySelector('.photo-bio a').href = filme.tmdb_url;
        document.querySelector('.nota').textContent = 'Nota: ' + filme.rating;
        document.querySelector('.geners').textContent = filme.genres.map(g => g.name).join(', ');
        document.body.style.backgroundImage = `url('${filme.background}')`;
        
        // Verifica se o array de providers não está vazio
        if (filme.providers && filme.providers.length > 0) {
          // Chama a nova API para obter os links de streaming
          const streamingLinksRes = await fetch(
            `/api/movie_streaming_links?movie_id=${movie_id}`
          );
          if (!streamingLinksRes.ok) {
            throw new Error(`Status: ${streamingLinksRes.status}`);
          }

          const streamingLinks = await streamingLinksRes.json();

          const container = document.querySelector(".providers-container");
          container.innerHTML = ""; // Limpa antes de adicionar

          // Verifica se existem links de streaming
          if (streamingLinks.streaming_links &&streamingLinks.streaming_links.length > 0){
            // Adiciona os links de streaming
            streamingLinks.streaming_links.forEach((link) => {
              // Extrai o nome do provedor do texto "Ver [FILME] na [PROVEDOR]"
              const linkText = link.provider_name || "";
              const match = linkText.match(/na (.+)$/);
              const extractedProviderName = match ? match[1].trim() : "";

              // Encontra o provedor correspondente
              const provider = filme.providers.find(
                (p) => p.name === extractedProviderName
              );

              if (provider) {
                const aTag = document.createElement("a");
                aTag.href = link.link;
                aTag.target = "_blank";

                const img = document.createElement("img");
                img.src = provider.logo;
                img.alt = provider.name;
                img.title = provider.name;
                img.className = "provider_id";
                img.style.marginRight = "10px";

                aTag.appendChild(img);
                container.appendChild(aTag);
              }
            });
          } else {
            // Caso não haja links de streaming, exibe uma mensagem
            const h3 = document.createElement("h3");
            h3.textContent = "Sem links de streaming disponíveis.";
            container.appendChild(h3);
          }
        } else {
            // Caso não haja provedores, exibe uma mensagem
            const container = document.querySelector('.providers-container');
            container.innerHTML = ''; // Limpa antes de adicionar
            const h3 = document.createElement('h3');
            h3.textContent = 'Sem provedores disponíveis.';
            container.appendChild(h3); // Adiciona a mensagem ao container
        }
        
        // Mostrar conteúdo, esconder loading
        loading.style.display = 'none';
        conteudo.style.display = 'block';
        
    } catch (err) {
        console.error('Erro ao carregar o filme:', err);
        loading.style.display = 'none';
        erro.style.display = 'block';
    }
}

carregarFilme();
