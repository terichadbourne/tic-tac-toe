import { store } from './store.js';

const botSpeed = 900;

const aiPlayer = "o";
const humanPlayer = "x";
const empty = "";

const bots = ["kid", "random"];

const centerCell = 4;

const cells = [0, 1, 2, 3, 4, 5, 6, 7, 8]

const cornerCells = [0, 2, 6, 8];

const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7],
[2, 5, 8], [0, 4, 8], [2, 4, 6]]



/*** AI STRATEGIES ***/

// determines which bot is playing and applies appropriate strategy
const selectCell = function (bot) {
  if (!bots.includes(bot)) {
    console.log("unknown bot passed");
  } else if (bot === "random") {
    return selectCellAsRandom();
  } else if (bot === "kid") {
    return selectCellAsKid();
  }
}

// strategy of "Random" bot
const selectCellAsRandom = function () {
  console.log("playing as random");
  return selectAtRandom();
}

// strategy of "Kid" bot (student model round 1)
const selectCellAsKid = function () {
  console.log("playing as kid");
  if (isFirstTurnOfGame()) {
    return selectCenter();
  } else if (canWinThisTurn(aiPlayer)) {
    return selectWinningCell(aiPlayer);
  } else {
    return selectAtRandom();
  }
}

/***** MOVES  ******/

// selects an available cell at random 
const selectAtRandom = function () {
  const available = getAvailableCells();
  const randomCellIndex = available[(Math.floor(Math.random() * available.length))];
  return randomCellIndex;
}

// selects center cell
const selectCenter = function () {
  return centerCell;
}

/**** HELPER FUNCTIONS: GAME STATE, ETC  *********/

// returns whether this is the first move of the game
const isFirstTurnOfGame = function () {
  return store.game.cells.every(cell => cell === "");
}

// returns whether this is the bot's first turn (regardless of whether opponent has played)
const isFirstTurnForBot = function () {
  return store.game.cells.every(cell => cell !== aiPlayer);
}

// returns opponent of given player
const opponentOf = function (player) {
  if (player === aiPlayer) {
    return humanPlayer;
  } else {
    return aiPlayer;
  }
}

/**** HELPER FUNCTIONS: CELL STATUS *********/

// returns array of available cells
const getAvailableCells = function () {
  const availableCells = [];
  store.game.cells.forEach((player, index) => {
    if (player === "") {
      availableCells.push(index);
    }
  })
  return availableCells;
}

const getAvailableCornerCells = function () {
  return cornerCells.filter((cell) => isEmpty(cell));
}

const centerIsAvaialble = function () {
  return isEmpty(centerCell);
}

// returns whether given cell is empty
const isEmpty = function (cell) {
  return cells[cell] === empty;
}

const isCorner = function (cell) {
  return cornerCells.includes(cell);
}

// returns whether given cell belongs to given player
const belongsToPlayer = function (cell, player) {
  return cells[cell] === player;
}

// returns whether given cell belongs to bot
const belongsToAi = function (cell) {
  return belongsToPlayer(cell, aiPlayer);
}

// returns whether given cell belongs to human
const belongsToHuman = function (cell) {
  return belongsToPlayer(cell, humanPlayer);
}


// returns array of all cells where a given player can win this turn 
const cellsThatCanWinThisTurn = function (player) {
  const winningCells = [];
  lines.forEach(line => {
    if (canWinInOne(line, player)) {
      winningCells.push(emptyCellsInLine(line)[0]);
    }
  })
  return winningCells;
}

// returns whether a given player can win this turn 
const canWinThisTurn = function (player) {
  return cellsThatCanWinThisTurn(player).length > 0;
}

// returns a cell that can win this turn for given player
const selectWinningCell = function (player) {
  return cellsThatCanWinThisTurn(player)[0];
}

/**** HELPER FUNCTIONS: LINE STATUS *********/


// returns whether a given line is "owned" by a given player (they have at least one cell in it and the other player doesn't)
const lineOwnedByPlayer = function (line, player) {
  return line.some((cell) => belongsToPlayer(cell, player)) && !line.some((cell) => belongsToPlayer(cell, opponentOf(player)));
}

// returns whether given player can win on a given line in exactly 1 turn
const canWinInOne = function (line, player) {
  return playerCountCellsInLine(line, player) === 2 && emptyCellsInLine(line)[0] === 1;
}

// returns whether given player can win on a given line in exactly 2 turns
const canWinInTwo = function (line, player) {
  return playerCountCellsInLine(line, player) === 1 && emptyCountCellsInLine(line)[0] === 2;
}

// returns count of cells belonging to given player in given line 
const playerCountCellsInLine = function (line, player) {
  return line.map((cell) => belongsToPlayer(cell, player)).length;
}

// returns count of empty cells in given line
const emptyCountCellsInLine = function (line) {
  return line.filter((cell) => isEmpty(cell)).length;
}

// returns cell indices of empty cells in given line
const emptyCellsInLine = function (line) {
  return line.filter((cell) => isEmpty(cell));
}


export {
  selectAtRandom, getAvailableCells, selectCell, selectCellAsRandom, selectCellAsKid, botSpeed
}
