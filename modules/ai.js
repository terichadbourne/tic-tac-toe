import { store }  from './store.js';

const botSpeed = 600;

const aiPlayer = "o";

const bots = ["random", "kid"];

const selectCell = function (bot) {
  console.log(`isFirstTurnOfGame: ${isFirstTurnOfGame()}`);
  console.log(`isFirstTurnForBot: ${isFirstTurnForBot()}`);
  if (!bots.includes(bot)) {
    console.log("unknown bot passed");
  } else if (bot === "random") {
    return selectCellAsRandom();
  } else if (bot === "kid") {
    return selectCellAsKid();
  }
}

/*** AI STRATEGIES ***/
const selectCellAsRandom = function () {
  console.log("playing as random");
  return selectAtRandom();
}

const selectCellAsKid = function () {
  return selectAtRandom();
}



/**** HELPER FUNCTIONS *********/

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

const isFirstTurnOfGame = function () {
  return store.game.cells.every( cell => cell === "");
}

const isFirstTurnForBot = function () {
  return store.game.cells.every( cell => cell !== aiPlayer);
}

export {
  selectAtRandom, getAvailableCells, selectCell, selectCellAsRandom, selectCellAsKid, botSpeed
}
