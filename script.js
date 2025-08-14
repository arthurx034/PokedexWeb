const ul = document.querySelector('ul')
const pokemons = ['Pikachu', 'Charmander', 'Bulbasaur']

pokemons.forEach(pokemon => {
  const li = document.createElement('li')
  li.textContent = pokemon
  ul.appendChild(li)
})
