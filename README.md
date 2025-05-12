## 🎯 **Descrição do Projeto: CineMatch** - Encontre o filme ideal com os amigos! 🍿🎬

O **CineMatch** é uma aplicação web interativa que tem como objetivo **facilitar a escolha de filmes entre amigos ou grupos**. A ideia é tornar a experiência de decidir um filme mais divertida e personalizada, utilizando um sistema de recomendação baseado em preferências compartilhadas entre os participantes de uma sessão.

Cada participante responde a uma série de perguntas sobre preferências de gênero, idioma, estilo e época dos filmes. Após o cruzamento das respostas, o sistema sugere 20 filmes, onde os usuários podem dar **like ou dislike** (como um "Tinder de filmes" 🎥💘). Ao final, os 3 filmes mais votados e com melhores avaliações são sugeridos como resultado final.

Além da funcionalidade divertida, o projeto se encaixa como um estudo de **Sistemas Distribuídos**, com foco em **performance**, **escalabilidade** e **transparência de acesso**.

---
### 👥 Participantes

- Arthur Arash Briceño Heidari
- Beatriz Guimarães Gonçalves
- João Pedro Alves de Brito
- Guilherme Fernandes Paes
- Guilherme Cláudio Marques La
- Lucas Catem Vianna



---

### 💡 Objetivo
Criar uma aplicação web que ajude grupos de pessoas a escolherem filmes de forma interativa e democrática, utilizando preferências em comum e eliminando decisões unilaterais ou indecisões em grupo.

---

### ⚙️ Funcionalidades

- Login com e-mail/CPF
- Criar ou entrar em uma sessão com código
- Sessões temporárias com tempo limitado (5 minutos)
- Formulário de preferências:
  - Gênero (animação, ação, romance, etc.)
  - Nacionalidade (nacional, internacional, tanto faz)
  - Idioma (inglês, português, tanto faz)
  - Tipo de filmes (blockbusters ou qualquer um)
  - Filmes antigos (antes de 2010 ou não)
- Algoritmo de interseção de respostas
- Interface estilo "Tinder" para avaliar filmes
- Resultado com os 3 filmes mais curtidos e melhor avaliados no IMDB

---

### 📊 Foco em Sistema Distribuído

Este projeto não se foca em estética, e sim em **características técnicas de sistemas distribuídos**:

| Propriedade             | Como será aplicada                                      | Métrica Usada                           |
|------------------------|----------------------------------------------------------|------------------------------------------|
| **Escalabilidade**      | Testes com 5, 10 e 20 usuários simultâneos               | Tempo de resposta em milissegundos       |
| **Performance**         | Medir latência da criação da sessão à exibição de filmes | Tempo de resposta de endpoints           |
| **Transparência de acesso** | Mistura dados da API externa (TMDB) com dados internos        | Usuário não percebe fontes diferentes    |
| **Tolerância a falhas** | Implementar fallback e reconexões em caso de falha       | Logs de recuperação ou reconexão         |

---

### 🧪 Tecnologias Usadas

- **Node.js** (Backend para API de sessões, usuários e votos)
- **Flask (Python)** (Serviço para cruzamento de dados e lógica de recomendação)
- **MongoDB / PostgreSQL** (Banco de dados)
- **TMDB API** (API externa de filmes)
- **WebSockets ou HTTP** para comunicação em tempo real
- **Docker** (opcional para ambientes distribuídos e testes)

---

### 🕒 Estimativa de Tempo e Etapas

| Etapa                            | Duração estimada |
|----------------------------------|------------------|
| Levantamento de requisitos       | 2x dias           |
| Prototipagem e formulários       | 3x dias           |
| Backend (Node.js e Flask)        | 7x dias           |
| Integração com API de filmes     | 3x dias           |
| Algoritmo de cruzamento de dados | 4x dias           |
| Sistema de votação (Tinder-like) | 4x dias           |
| Testes de performance e SD       | 5x dias           |
| Documentação e apresentação      | 2x dias           |

---

### 📈 Como testar o sistema distribuído

- Ferramentas como Apache JMeter, Postman, Locust
- Logs com tempo de resposta
- Simulação de falhas de conexão
- Testes de escalabilidade com múltiplos acessos simultâneos

---

### ✉️ Contato

Se você quiser contribuir, ajudar no projeto, ou participar de alguma parte técnica, fale com a gente! 💬  
Sugestões e ideias são bem-vindas! 🙌
- guilhermehzf@sempreceub.com
- arthurarash.bric@gmail.com

---
