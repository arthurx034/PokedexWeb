// ==============================
// Seletores de elementos do DOM
// ==============================


const overlay = document.querySelector(".overlay");
const pokemonCard = document.querySelector(".pokemonCard");
const pokedex = document.querySelector(".pokedex");
const searchInput = document.getElementById("searchInput");
const noResultsMessage = document.getElementById("noResultsMessage");
const suggestionsList = document.getElementById("suggestionsList");
const loadingMessage = document.getElementById("loadingMessage");

// ==============================
// Estado Global
// ==============================


let allPokemon = [];
let currentDisplayedPokemon = [];

// ==============================
// Funções Auxiliares
// ==============================


function formatarNome(nome) {
  return nome.charAt(0).toUpperCase() + nome.slice(1);
}

function criarElemento(tag, classe, texto) {
  const elemento = document.createElement(tag);
  if (classe) elemento.classList.add(classe);
  if (texto) elemento.textContent = texto;
  return elemento;
}

// ==============================
// Funções de Renderização
// ==============================


function criarCardPokemon(pokemon) {
  const card = document.createElement("div");
  card.classList.add("pokemon-card");
  card.dataset.name = pokemon.name;
  card.dataset.id = pokemon.id;

  card.innerHTML = `
    <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
    <h2>${formatarNome(pokemon.name)}</h2>
    <p>Tipo: ${pokemon.types.map((t) => t.type.name).join(", ")}</p>
  `;

  return card;
}

function renderizarPokemons(lista) {
  pokedex.innerHTML = "";
  currentDisplayedPokemon = lista;
  lista.forEach((pokemon) => pokedex.appendChild(criarCardPokemon(pokemon)));
}

// ==============================
// Funções de Busca e Sugestões
// ==============================


function mostrarSugestoes(termoBusca) {
  // Esconder os cards de Pokémon
  pokedex.style.display = "none";
  noResultsMessage.style.display = "block";
  suggestionsList.innerHTML = "";

  // Buscar sugestões baseadas na distância de Levenshtein
  const sugestoes = allPokemon
    .map((p) => ({
      pokemon: p,
      distance: levenshteinDistance(p.name, termoBusca),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5);

  if (sugestoes.length === 0) {
    noResultsMessage.innerHTML = "Nenhum Pokémon encontrado. Tente outro nome ou ID.";
    return;
  }

  const titulo = criarElemento("p", null, "Você quis dizer:");
  titulo.style.color = "#ffcc00";
  suggestionsList.appendChild(titulo);

  sugestoes.forEach(({ pokemon }) => {
    const item = criarElemento("div", "suggestion-item",
      `${formatarNome(pokemon.name)} (ID: ${pokemon.id})`);

    item.addEventListener("click", async () => {
      searchInput.value = "";
      suggestionsList.innerHTML = "";
      noResultsMessage.style.display = "none";
      pokedex.style.display = "grid";

      // Renderizar apenas o Pokémon selecionado
      renderizarPokemons([pokemon]);

      // Abrir o card detalhado automaticamente
      await abrirCardDetalhado(pokemon);
    });

    suggestionsList.appendChild(item);
  });
}

function configurarBusca() {
  searchInput.addEventListener("input", () => {
    const searchTerm = searchInput.value.trim().toLowerCase();
    suggestionsList.innerHTML = "";
    noResultsMessage.style.display = "none";
    pokedex.style.display = "grid";

    if (!searchTerm) {
      renderizarPokemons(allPokemon);
      return;
    }

    // Buscar por nome OU ID
    const filtrados = allPokemon.filter((p) =>
      p.name.includes(searchTerm) || p.id.toString() === searchTerm
    );

    if (filtrados.length > 0) {
      renderizarPokemons(filtrados);
    } else {
      mostrarSugestoes(searchTerm);
    }
  });

  // Permitir busca por Enter
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const searchTerm = searchInput.value.trim().toLowerCase();
      if (searchTerm) {
        const filtrados = allPokemon.filter((p) =>
          p.name.includes(searchTerm) || p.id.toString() === searchTerm
        );

        if (filtrados.length > 0) {
          renderizarPokemons(filtrados);
          suggestionsList.innerHTML = "";
          noResultsMessage.style.display = "none";
        } else {
          mostrarSugestoes(searchTerm);
        }
      }
    }
  });
}

// ==============================
// Funções de Evolução
// ==============================


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
  return pokemonNode ? coletarEvolucoes(pokemonNode) : [];
}

// ==============================
// Funções de Card Detalhado
// ==============================

// Função para formatar a altura (converter de decímetros para metros)
function formatarAltura(altura) {
  return (altura / 10).toFixed(1) + "m";
}

// Função para formatar o peso (converter de hectogramas para quilogramas)
function formatarPeso(peso) {
  return (peso / 10).toFixed(1) + "kg";
}

async function abrirCardDetalhado(pokemon) {
  try {
    const especieRes = await fetch(pokemon.species.url);
    const especie = await especieRes.json();

    const evolutionRes = await fetch(especie.evolution_chain.url);
    const evolutionData = await evolutionRes.json();

    const evolucoes = pegarEvolucoes(evolutionData.chain, pokemon.name);

    pokemonCard.innerHTML = `
      <p>ID: ${pokemon.id}</p>
      <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
      <h2>${formatarNome(pokemon.name)}</h2>
      <p>Altura: ${formatarAltura(pokemon.height)}</p>
      <p>Peso: ${formatarPeso(pokemon.weight)}</p>
      <p>Espécie: ${especie.name}</p>
      <p>Habilidades: ${pokemon.abilities.map((a) => a.ability.name).join(", ")}</p>
      <p>Próximas evoluções: ${evolucoes.length > 0 ? evolucoes.join(", ") : "Nenhuma"}</p>
    `;

    overlay.style.display = "flex";
    pokemonCard.style.display = "block";
  } catch (error) {
    console.error("Erro ao abrir card detalhado:", error);
  }
}

function abrirCard() {
  pokedex.addEventListener("click", async (event) => {
    const card = event.target.closest(".pokemon-card");
    if (!card) return;

    try {
      const nomePokemon = card.dataset.name;
      const pokemon = allPokemon.find(p => p.name === nomePokemon);

      if (pokemon) {
        await abrirCardDetalhado(pokemon);
      }
    } catch (error) {
      console.error("Erro ao abrir card:", error);
    }
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.style.display = "none";
      pokemonCard.style.display = "none";
    }
  });
}

// ==============================
// Função de Carregamento Inicial
// ==============================


async function carregarTodosPokemons() {
  try {
    // Busca a lista completa de URLs dos Pokémons
    const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1300');
    const data = await response.json();

    // Array de URLs individuais de cada Pokémon
    const urls = data.results.map(p => p.url);

    // Busca detalhada de cada Pokémon
    const promises = urls.map(url => fetch(url).then(res => res.json()).catch(err => null));
    const resultados = await Promise.all(promises);

    // Filtra resultados válidos, ordena por ID e atualiza o estado global
    allPokemon = resultados.filter(p => p !== null).sort((a, b) => a.id - b.id);

    return allPokemon;
  } catch (error) {
    console.error('Erro ao carregar todos os Pokémons:', error);
    return [];
  }
}

// ==============================
// Função de Distância de Levenshtein
// ==============================


function levenshteinDistance(s1, s2) {
  const m = s1.length;
  const n = s2.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,    // remoção
        dp[i][j - 1] + 1,    // inserção
        dp[i - 1][j - 1] + cost // substituição
      );
    }
  }

  return dp[m][n];
}

// ==============================
// Inicialização
// ==============================


carregarTodosPokemons().then((pokemons) => {
  renderizarPokemons(pokemons);
  loadingMessage.style.display = "none";
});
abrirCard();
configurarBusca();