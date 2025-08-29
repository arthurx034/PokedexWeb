const overlay = document.querySelector(".overlay");
const pokemonCard = document.querySelector(".pokemonCard");
const pokedex = document.querySelector(".pokedex");
const searchInput = document.getElementById("searchInput");
const noResultsMessage = document.getElementById("noResultsMessage");
const suggestionsList = document.getElementById("suggestionsList");
const loadingMessage = document.getElementById("loadingMessage");

let allPokemon = [];

async function carregarPokemons() {
  pokedex.innerHTML = '';
  pokedex.appendChild(loadingMessage);
  loadingMessage.style.display = 'block';

  const promises = [];
  for (let id = 1; id <= 1000; id++) {
    const promise = fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
      .then(response => response.json())
      .then(pokemon => {
        allPokemon.push(pokemon);
      })
      .catch(error => {
        console.error(`Falha ao carregar Pokémon ${id}:`, error);
      });
    promises.push(promise);
  }

  await Promise.all(promises);
  allPokemon.sort((a, b) => a.id - b.id);

  loadingMessage.style.display = 'none';
  pokedex.innerHTML = '';

  allPokemon.forEach(pokemon => {
    const card = criarCardPokemon(pokemon);
    pokedex.appendChild(card);
  });
}

function criarCardPokemon(pokemon) {
  const card = document.createElement("div");
  card.classList.add("pokemon-card");
  card.dataset.name = pokemon.name;
  card.dataset.id = pokemon.id;
  card.innerHTML = `
        <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
        <h2>${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</h2>
        <p>Tipo: ${pokemon.types.map(t => t.type.name).join(", ")}</p>
    `;
  return card;
}

async function abrirCard() {
  pokedex.addEventListener("click", async (event) => {
    const card = event.target.closest(".pokemon-card");
    if (!card) return;

    const nomePokemon = card.dataset.name;
    const resposta = await fetch(`https://pokeapi.co/api/v2/pokemon/${nomePokemon}`);
    const pokemon = await resposta.json();
    const especieRes = await fetch(pokemon.species.url);
    const especie = await especieRes.json();
    const evolutionRes = await fetch(especie.evolution_chain.url);
    const evolutionData = await evolutionRes.json();

    function pegarEvolucoes(chain, nomePokemon) {
      function buscarPokemon(node) {
        if (node.species.name === nomePokemon) return node;
        for (const evo of node.evolves_to) {
          const encontrado = buscarPokemon(evo);
          if (encontrado) return encontrado;
        }
        return null;
      }

      function coletarEvolucoes(node) {
        let evolucoes = [];
        for (const evo of node.evolves_to) {
          evolucoes.push(evo.species.name);
          evolucoes = evolucoes.concat(coletarEvolucoes(evo));
        }
        return evolucoes;
      }

      const pokemonNode = buscarPokemon(chain);
      if (!pokemonNode) return [];
      return coletarEvolucoes(pokemonNode);
    }

    const evolucoes = pegarEvolucoes(evolutionData.chain, nomePokemon);
    const pokemonCard = document.querySelector(".pokemonCard");
    overlay.style.display = 'flex';
    pokemonCard.style.display = 'block';
    pokemonCard.innerHTML = `
            <p>ID: ${pokemon.id}</p>
            <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
            <h2>${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</h2>
            <p>Altura: ${pokemon.height}</p>
            <p>Peso: ${pokemon.weight}</p>
            <p>Espécie: ${especie.name}</p>
            <p>Habilidades: ${pokemon.abilities.map(a => a.ability.name).join(", ")}</p>
            <p>Próximas evoluções: ${evolucoes.length > 0 ? evolucoes.join(", ") : "Nenhuma"}</p>
        `;
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.style.display = "none";
      pokemonCard.style.display = "none";
    }
  });
}

searchInput.addEventListener("input", () => {
  const filtro = searchInput.value.toLowerCase();

  pokedex.innerHTML = '';
  noResultsMessage.style.display = 'none';
  suggestionsList.innerHTML = '';

  const resultadosExatos = allPokemon.filter(p => p.name.includes(filtro) || p.id.toString().includes(filtro));

  if (resultadosExatos.length > 0) {
    resultadosExatos.forEach(pokemon => {
      pokedex.appendChild(criarCardPokemon(pokemon));
    });
  } else {
    noResultsMessage.style.display = "block";
    if (filtro.length > 1) {
      const sugestoes = allPokemon
        .map(p => ({
          pokemon: p,
          distance: levenshteinDistance(p.name, filtro)
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5);

      if (sugestoes.length > 0) {
        const sugestaoTitulo = document.createElement("p");
        sugestaoTitulo.textContent = "Resultados mais próximos:";
        sugestaoTitulo.style.color = "#ffcc00";
        suggestionsList.appendChild(sugestaoTitulo);

        sugestoes.forEach(sugestao => {
          const item = document.createElement("div");
          item.textContent = sugestao.pokemon.name.charAt(0).toUpperCase() + sugestao.pokemon.name.slice(1);
          item.classList.add("suggestion-item");
          item.addEventListener("click", () => {
            searchInput.value = sugestao.pokemon.name;
            searchInput.dispatchEvent(new Event('input'));
          });
          suggestionsList.appendChild(item);
        });
      }
    }
  }
});

function levenshteinDistance(s1, s2) {
  const m = s1.length;
  const n = s2.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  pokedex.style.display = dp[m][n] <= 3 ? 'block' : 'none';
  return dp[m][n];
}

carregarPokemons();
abrirCard();