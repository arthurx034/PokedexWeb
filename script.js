const overlay = document.querySelector(".overlay");
const pokemonCard = document.querySelector(".pokemonCard");
const pokedex = document.querySelector(".pokedex");
const searchInput = document.getElementById("searchInput");

async function carregarPokemons() {
  pokedex.innerHTML = '';

  for (let id = 1; id <= 1000; id++) {
    const resposta = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const pokemon = await resposta.json();

    const card = document.createElement("div");
    card.classList.add("pokemon-card");
    card.dataset.name = pokemon.name;
    card.dataset.id = pokemon.id;

    card.innerHTML = `
      <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
      <h2>${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</h2>
      <p>Tipo: ${pokemon.types.map(t => t.type.name).join(", ")}</p>
    `;

    pokedex.appendChild(card);
  }
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
      <p>Proximas evoluções: ${evolucoes.length > 0 ? evolucoes.join(", ") : "Nenhuma"}</p>
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
  const cards = document.querySelectorAll(".pokemon-card");

  cards.forEach(card => {
    const nome = card.dataset.name.toLowerCase();
    const id = card.dataset.id?.toString() || '';
    if (nome.includes(filtro) || id.includes(filtro)) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });
});

carregarPokemons();
abrirCard();