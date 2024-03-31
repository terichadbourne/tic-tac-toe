import { store }  from './store.js';

const getAvailableCells = function() {
  const availableCells = [];
  store.game.cells.forEach((player, index) => {
    if (player === "") {
      availableCells.push(index);
    }
  })
  return availableCells;
}

const selectAtRandom = function() {
  const available = getAvailableCells();
  const randomCellIndex = available[(Math.floor(Math.random() * available.length))];
  console.log(`random available cell index: ${randomCellIndex}`);
  return randomCellIndex;
}



export {
  selectAtRandom, getAvailableCells
}
