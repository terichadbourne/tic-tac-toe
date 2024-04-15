import { store } from './store.js';
import * as ui from './ui.js';

const botSpeed = 900;

const aiPlayer = "o";
const humanPlayer = "x";
const empty = "";

const bots = ["kid", "random"];

const centerCell = 4;
const cornerCells = [0, 2, 6, 8];

const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7],
[2, 5, 8], [0, 4, 8], [2, 4, 6]]


/*** AI STRATEGIES ***/

// determines which bot is playing and applies appropriate strategy
const selectCell = function (bot) {
  if (!bots.includes(bot)) {
    console.log("unknown bot passed");
  } else if (bot === "random") {
    ui.thinkAloudReplace("Random says...");
    return selectCellAsRandom();
  } else if (bot === "kid") {
    ui.thinkAloudReplace("Kid says...");
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
  console.log("store.game.cells: ", store.game.cells);
  if (isFirstTurnOfGame()) {
    ui.thinkAloudAppend("Because it's the first turn of the game, I'm playing in the center.")
    return selectCenter();
  } else {
    ui.thinkAloudAppend("<br>It's not the first turn of the game.");
  }
  if (canWinThisTurn(aiPlayer)) {
    ui.thinkAloudAppend("<br>I'm see a place where I can win this turn!");
    return selectWinningCell(aiPlayer);
  } else {
    ui.thinkAloudAppend("<br>I looked and I don't see a place where I can win this turn.");
  }
  ui.thinkAloudAppend("<br>I'm selecting a cell at random.");
  return selectAtRandom();
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
  return cornerCells.filter(cell => isEmpty(cell));
}

const centerIsAvaialble = function () {
  return isEmpty(centerCell);
}

// returns whether given cell is empty
const isEmpty = function (cell) {
  return store.game.cells[cell] === empty;
}

const isCorner = function (cell) {
  return cornerCells.includes(cell);
}

// returns whether given cell belongs to given player
const belongsToPlayer = function (cell, player) {
  console.log(`[belongsToPlayer] cell ${cell} belongs to player ${player}: ${store.game.cells[cell] === player}`);
  return store.game.cells[cell] === player;
}

// returns array of all cells where a given player can win this turn 
const cellsThatCanWinThisTurn = function (player) {
  console.log('in cellsThatCanWinThisTurn');
  const winningCells = [];
  lines.forEach((line) => {
    console.log("line: ", line);
    if (canWinInOne(line, player)) {
      winningCells.push(emptyCellsInLine(line)[0]);
    }
  });
  return winningCells;
}

// returns whether a given player can win this turn 
const canWinThisTurn = function (player) {
  console.log('in can win this turn');
  console.log(cellsThatCanWinThisTurn(player));
  return cellsThatCanWinThisTurn(player).length > 0;
}

// returns a cell that can win this turn for given player
const selectWinningCell = function (player) {
  return cellsThatCanWinThisTurn(player)[0];
}

/**** HELPER FUNCTIONS: LINE STATUS *********/


// returns whether a given line is "owned" by a given player (they have at least one cell in it and the other player doesn't)
const lineOwnedByPlayer = function (line, player) {
  return line.some(cell => belongsToPlayer(cell, player)) && !line.some((cell) => belongsToPlayer(cell, opponentOf(player)));
}

// returns whether given player can win on a given line in exactly 1 turn
const canWinInOne = function (line, player) {
  console.log(`[canWinInOne] ${player} can win in 1 for lin ${line}: ${playerCountCellsInLine(line, player) === 2 && emptyCountCellsInLine(line) === 1}`);
  return playerCountCellsInLine(line, player) === 2 && emptyCountCellsInLine(line) === 1;
}

// returns whether given player can win on a given line in exactly 2 turns
const canWinInTwo = function (line, player) {
  console.log(`[canWinInOne] ${player} can win in 2 for lin ${line}: ${playerCountCellsInLine(line, player) === 1 && emptyCountCellsInLine(line) === 2}`);
  return playerCountCellsInLine(line, player) === 1 && emptyCountCellsInLine(line) === 2;
}

// returns count of cells belonging to given player in given line 
const playerCountCellsInLine = function (line, player) {
  console.log(`[playerCountCellsInLine] player ${player} has ${line.filter(cell => belongsToPlayer(cell, player)).length} cells in line ${line}`);
  return line.filter(cell => belongsToPlayer(cell, player)).length;
}

// returns count of empty cells in given line
const emptyCountCellsInLine = function (line) {
  console.log(`[emptyCountCellsInLine] ${line.filter(cell => isEmpty(cell)).length}`);
  return line.filter(cell => isEmpty(cell)).length;
}

// returns cell indices of empty cells in given line
const emptyCellsInLine = function (line) {
  console.log(`[emptyCellsInLine] for line ${line}: line.filter(cell => isEmpty(cell))`);
  return line.filter(cell => isEmpty(cell));
}


export {
  selectAtRandom, getAvailableCells, selectCell, selectCellAsRandom, selectCellAsKid, botSpeed
}
