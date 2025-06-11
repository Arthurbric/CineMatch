require('dotenv').config();
const express = require('express');
const axios = require('axios');
const https = require('https');
const { exec } = require('child_process'); 

const agent = new https.Agent({ family: 4 });
const router = express.Router();

router.get('/movie', async (req, res) => {
  const apiKey = process.env.TMDB_API_KEY;

  const genre = req.query.genre?.split(',').map(Number);
  const exclude = req.query.exclude?.split(',').map(Number);
  const exclude_genre = req.query.exclude_genre?.split(',').map(Number);
  const region = req.query.region;
  const year = req.query.year;

  try {
    let filtered = [];
    let attempt = 0;
    const maxAttempts = 2;
    let lastResort = false;

    while (filtered.length === 0 && attempt <= maxAttempts) {
      const randomPage = Math.floor(Math.random() * 10) + 1;

      const response = await axios.get('https://api.themoviedb.org/3/discover/movie', {
        httpsAgent: agent,
        params: {
          api_key: apiKey,
          language: 'pt-BR',
          page: randomPage,
          region: lastResort ? undefined : region || undefined,
          sort_by: 'popularity.desc'
        }
      });

      const movies = response.data.results;

      filtered = movies.filter(movie => {
        const matchesGenre = lastResort || !genre || genre.some(g => movie.genre_ids.includes(g));
        const matchesYear = lastResort || !year || movie.release_date?.startsWith(year);
        const notExcluded = !exclude || !exclude.includes(movie.id);
        const notExcludedGenre = lastResort || !exclude_genre || !movie.genre_ids.some(id => exclude_genre.includes(id));
        return matchesGenre && matchesYear && notExcluded && notExcludedGenre;
      });

      attempt++;

      // Se chegarmos na última tentativa e ainda não achamos nada, força uma tentativa sem os filtros opcionais
      if (attempt === maxAttempts && filtered.length === 0) {
        console.warn('⚠️ Nenhum filme encontrado com os filtros. Tentando sem filtros (mantendo apenas exclude)...');
        lastResort = true;
        attempt = maxAttempts; // vai sair do loop na próxima rodada
      }
    }

    if (filtered.length === 0) {
      return res.status(404).json({ error: 'Nenhum filme encontrado com os filtros aplicados.' });
    }

    const randomMovie = filtered[Math.floor(Math.random() * filtered.length)];

    const providersResponse = await axios.get(
      `https://api.themoviedb.org/3/movie/${randomMovie.id}/watch/providers`,
      {
        httpsAgent: agent,
        params: { api_key: apiKey }
      }
    );

    const providers = providersResponse.data.results?.BR?.flatrate || [];

    async function syncGenresIfEmpty(req) {
      const collection = req.db.collection(process.env.genre_movies_table);
      const count = await collection.countDocuments();
      if (count === 0) {
        const genres_ids = await axios.get('https://api.themoviedb.org/3/genre/movie/list', {
          params: {
            api_key: process.env.TMDB_API_KEY,
            language: 'pt-BR'
          }
        });
        await collection.insertMany(genres_ids.data.genres);
      }

      return await collection.find().toArray();
    }

    const genresFromDb = await syncGenresIfEmpty(req);

    const genre_list = randomMovie.genre_ids.map(id => {
      const g = genresFromDb.find(gen => gen.id === id);
      if (g) {
        const { _id, ...rest } = g;
        return rest;
      }
    }).filter(Boolean);

    res.json({
      id: randomMovie.id,
      title: randomMovie.title,
      poster: `https://image.tmdb.org/t/p/w500${randomMovie.poster_path}`,
      genres: genre_list,
      year: randomMovie.release_date?.split("-")[0] || "N/A",
      rating: randomMovie.vote_average,
      tmdb_url: `https://www.themoviedb.org/movie/${randomMovie.id}`,
      providers: providers.map((p) => ({
        name: p.provider_name,
        logo: `https://image.tmdb.org/t/p/w45${p.logo_path}`,
      })),
    });

  } catch (err) {
    console.error('❌ Erro ao buscar filmes:', err.message);
    res.status(500).json({ error: 'Erro interno ao buscar filmes. Tente novamente mais tarde.' });
  }
});

router.get('/movie_match', async (req, res) => {
  const movie_id = req.query.movie_id;
  const apiKey = process.env.TMDB_API_KEY;

  if (!movie_id) {
    return res.status(400).json({ error: 'Parâmetro movie_id é obrigatório.' });
  }

  try {
    // Busca os detalhes do filme
    const movieResponse = await axios.get(
      `https://api.themoviedb.org/3/movie/${movie_id}`,
      {
        httpsAgent: agent,
        params: {
          api_key: apiKey,
          language: 'pt-BR'
        }
      }
    );

    const movie = movieResponse.data;

    // Busca provedores de streaming
    const providersResponse = await axios.get(
      `https://api.themoviedb.org/3/movie/${movie_id}/watch/providers`,
      {
        httpsAgent: agent,
        params: { api_key: apiKey }
      }
    );

    const providers = providersResponse.data.results?.BR?.flatrate || [];

    // Sincroniza gêneros com o banco se ainda não tiver
    async function syncGenresIfEmpty(req) {
      const collection = req.db.collection(process.env.genre_movies_table);
      const count = await collection.countDocuments();
      if (count === 0) {
        const genres_ids = await axios.get('https://api.themoviedb.org/3/genre/movie/list', {
          params: {
            api_key: apiKey,
            language: 'pt-BR'
          }
        });
        await collection.insertMany(genres_ids.data.genres);
      }

      return await collection.find().toArray();
    }

    const genresFromDb = await syncGenresIfEmpty(req);

    // Match dos gêneros do filme com os nomes no banco
    const genre_list = movie.genres.map(g => {
      const found = genresFromDb.find(gen => gen.id === g.id);
      if (found) {
        const { _id, ...rest } = found;
        return rest;
      } else {
        return g;
      }
    });
    res.json({
      id: movie.id,
      title: movie.title,
      poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
      background: `https://image.tmdb.org/t/p/w500${movie.backdrop_path}`,
      genres: genre_list,
      year: movie.release_date?.split("-")[0] || "N/A",
      rating: movie.vote_average,
      tmdb_url: `https://www.themoviedb.org/movie/${movie.id}`,
      providers: providers.map((p) => ({
        name: p.provider_name,
        logo: `https://image.tmdb.org/t/p/w45${p.logo_path}`,
      })),
    });

  } catch (err) {
    console.error('❌ Erro ao buscar filme:', err.message);
    res.status(500).json({ error: 'Erro interno ao buscar filme. Tente novamente mais tarde.' });
  }
});

// Função para chamar o script Python
function getStreamingLinksFromPython(movie_id) {
  return new Promise((resolve, reject) => {
    const path = `"${process.env.path_get_providers_link}"`;
    const python_path = `"${process.env.python_path}"`;
    exec(`${python_path} ${path} ${movie_id}`, (err, stdout, stderr) => {
      if (err) {
        reject(`Erro ao executar o script Python: ${stderr}`);
        return;
      }
      try {
        // Parseando a saída JSON do Python
        const data = JSON.parse(stdout);
        resolve(data);
      } catch (e) {
        reject("Erro ao processar a resposta do script Python.");
      }
    });
  });
}

// Rota para buscar links de streaming para um filme específico
router.get('/movie_streaming_links', async (req, res) => {
  const movie_id = req.query.movie_id;

  if (!movie_id) {
    return res.status(400).json({ error: 'Parâmetro movie_id é obrigatório.' });
  }

  try {
    // Chama o script Python para buscar os links de streaming
    const streamingLinks = await getStreamingLinksFromPython(movie_id);

    if (streamingLinks && streamingLinks.length > 0) {
      res.json({ movie_id, streaming_links: streamingLinks });
    } else {
      res.status(404).json({ error: 'Nenhum link de streaming encontrado.' });
    }
  } catch (error) {
    console.error('Erro ao buscar links de streaming:', error);
    res.status(500).json({ error: 'Erro interno ao buscar links de streaming.' });
  }
});

module.exports = router;
