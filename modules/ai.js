import { store } from './store.js';
import * as ui from './ui.js';

const botSpeed = 900;

const aiPlayer = "o";
const humanPlayer = "x";
const empty = "";

// River = True random play (easy)
// Avery = Student model with poor sequencing - only what was explicitly stated  (medium)
// Bailey = Student model with better sequencing - what was explicity stated or demonstrated consistently (hard)
const bots = ["avery", "bailey", "river"];

const centerCell = 4;
const cornerCells = [0, 2, 6, 8];

const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7],
[2, 5, 8], [0, 4, 8], [2, 4, 6]]

/* shuffle sequence in-place w/ Durstenfeld algorithm */
function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

/*** AI STRATEGIES ***/

// determines which bot is playing and applies appropriate strategy
const selectCell = function (bot) {
  if (bot === "river") {
    return selectCellAsRiver();
  } else if (bot === "bailey") {
    return selectCellAsBailey();
  } else if (bot === "avery") {
    return selectCellAsAvery();
  } else {
    console.log("unknown bot name");
  }
}

// strategy of "River" bot - truly random
const selectCellAsRiver = function () {
  ui.thinkAloudReplace("I'm playing at random.");
  return selectAtRandom();
}

// strategy of "Bailey" bot - Initial student model with better sequencing - what was explicity stated or demonstrated consistently
const selectCellAsBailey = function () {
  if (isFirstTurnOfGame()) {
    ui.thinkAloudReplace("It's the first turn of the game, so I'm playing in the center.")
    return selectCenter();
  } else {
    ui.thinkAloudReplace("It's not the first turn of the game.");
  }
  if (canWinThisTurn(aiPlayer)) {
    ui.thinkAloudAppend("I'm see a place where I can win this turn!");
    return selectWinningCell(aiPlayer);
  } else {
    ui.thinkAloudAppend("I don't see anywhere I can win this turn.");
  }
  if (canWinThisTurn(humanPlayer)) {
    ui.thinkAloudAppend("I see a spot where you could win next turn, so I'm blocking you.");
    return selectWinningCell(humanPlayer);
  } else {
    ui.thinkAloudAppend("I don't see anywhere you could win next turn, so I don't need to block you.");
  }
  if (canWinNextTurn(aiPlayer)) {
    const [maxLinesOfTwoPerCell, bestCells] = selectSecondCellInLine(aiPlayer);
    ui.thinkAloudAppend("I'm looking for places I could go now that would let me win next turn.")
    ui.thinkAloudAppend(`If I go here then there will be ${maxLinesOfTwoPerCell} place${maxLinesOfTwoPerCell > 1 ? "s" : ""} I could win next turn${maxLinesOfTwoPerCell === 1 ? "." : ", and you can only block 1 of them."}`);
    return bestCells[0];
  } else {
    ui.thinkAloudAppend("I don't see any places I could go now that would let me win next turn.")
  }
  ui.thinkAloudAppend("I'm picking a cell at random.");
  return selectAtRandom();
}

// strategy of "Avery" bot - Initial student model with poor sequencing - only what was explicity stated
const unsequencedAveryStrategies = ["winThisTurn", "blockOpponentWin", "setUpWinForNextTurn"];

const selectCellAsAvery = function () {
  if (isFirstTurnOfGame()) {
    ui.thinkAloudReplace("It's the first turn of the game, so I'm playing in the center.")
    return selectCenter();
  } else {
    ui.thinkAloudReplace("It's not the first turn of the game.");
  }
  shuffleArray(unsequencedAveryStrategies);
  console.log('Avery strategies after shuffle: ', unsequencedAveryStrategies);
  let returnVal = null;
  let i = 0;
  while (!returnVal && i < unsequencedAveryStrategies.length) {
    console.log(`loop ${1}: ${unsequencedAveryStrategies[i]}`);
    switch (unsequencedAveryStrategies[i]) {
      case 'winThisTurn':
        if (canWinThisTurn(aiPlayer)) {
          ui.thinkAloudAppend("I'm see a place where I can win this turn!");
          returnVal = selectWinningCell(aiPlayer);
        } else {
          ui.thinkAloudAppend("I don't see anywhere I can win this turn.");
        }
        break;
      case 'blockOpponentWin':
        if (canWinThisTurn(humanPlayer)) {
          ui.thinkAloudAppend("I see a spot where you could win next turn, so I'm blocking you.");
          returnVal = selectWinningCell(humanPlayer);
        } else {
          ui.thinkAloudAppend("I don't see anywhere you could win next turn, so I don't need to block you.");
        }
        break;
      case 'setUpWinForNextTurn':
        if (canWinNextTurn(aiPlayer)) {
          const [maxLinesOfTwoPerCell, bestCells] = selectSecondCellInLine(aiPlayer);
          ui.thinkAloudAppend("I'm looking for places I could go now that would let me win next turn.")
          ui.thinkAloudAppend(`If I go here then there will be ${maxLinesOfTwoPerCell} place${maxLinesOfTwoPerCell > 1 ? "s" : ""} I could win next turn${maxLinesOfTwoPerCell === 1 ? "." : ", and you can only block 1 of them."}`);
          returnVal = bestCells[0];
        } else {
          ui.thinkAloudAppend("I don't see any places I could go now that would let me win next turn.")
        }
        break;
      default:
        console.log(`No strategy match for ${unsequencedAveryStrategies[i]} in switch case.`);
    }
    i++;
  }
  if (returnVal) {
    return returnVal;
  } else {
    ui.thinkAloudAppend("I'm picking a cell at random.");
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
  return cornerCells.filter(cell => isEmpty(cell));
}

const centerIsAvailable = function () {
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
  // console.log(`[belongsToPlayer] cell ${cell} belongs to player ${player}: ${store.game.cells[cell] === player}`);
  return store.game.cells[cell] === player;
}

// returns array of all cells where a given player can win this turn 
const cellsThatCanWinThisTurn = function (player) {
  const winningCells = [];
  lines.forEach((line) => {
    if (canWinLineInOne(line, player)) {
      winningCells.push(emptyCellsInLine(line)[0]);
    }
  });
  // console.log(`[cellsThatCanWinThisTurn] ${winningCells}`);
  return winningCells;
}

// return object of cells where we could play now to set up wins for following turn
const cellsThatCanBeSecondInLine = function (player) {
  const nextCellCounter = {};
  lines.forEach((line) => {
    if (canWinLineInTwo(line, player)) {
      emptyCellsInLine(line).forEach(cell => {
        if (nextCellCounter[cell]) {
          nextCellCounter[cell] += 1;
        } else {
          nextCellCounter[cell] = 1;
        }
      });
    }
  });
  // console.log(`[cellsThatCanBeSecondInLine] found ${Object.keys(nextCellCounter).length} helpful cells for player ${player}`);
  // console.log(nextCellCounter);
  return nextCellCounter;
}

// returns whether a given player can win this turn 
const canWinThisTurn = function (player) {
  // console.log(`[canWinThisTurn] ${cellsThatCanWinThisTurn(player).length > 0}`);
  return cellsThatCanWinThisTurn(player).length > 0;
}
const canWinNextTurn = function (player) {
  const nextCells = cellsThatCanBeSecondInLine(player);
  // console.log('[canWinNextTurn] nextCells, keys, keys.length');
  // console.log(nextCells);
  // console.log(Object.keys(nextCells));
  // console.log(Object.keys(nextCells).length);
  // console.log('Object.keys(nextCells).length > 0: ', Object.keys(nextCells).length > 0);
  return Object.keys(nextCells).length > 0;
}

// returns a cell that can win this turn for given player
const selectWinningCell = function (player) {
  return cellsThatCanWinThisTurn(player)[0];
}

const selectSecondCellInLine = function (player) {
  // console.log(`[selectSecondCellInLine]`);
  const nextCells = cellsThatCanBeSecondInLine(player);
  // console.log(nextCells);
  const maxLinesOfTwoPerCell = Math.max.apply(null, Object.values(nextCells));
  // console.log(`maxSetupsPerCell: ${maxLinesOfTwoPerCell}`);
  const bestCells = Object.keys(nextCells).filter(x => {
    return nextCells[x] === maxLinesOfTwoPerCell;
  });
  // console.log('bestCells: ', bestCells);
  return [maxLinesOfTwoPerCell, bestCells];
}

/**** HELPER FUNCTIONS: LINE STATUS *********/

// returns whether a given line is "owned" by a given player (they have at least one cell in it and the other player doesn't)
const lineOwnedByPlayer = function (line, player) {
  return line.some(cell => belongsToPlayer(cell, player)) && !line.some((cell) => belongsToPlayer(cell, opponentOf(player)));
}

// returns whether given player can win on a given line in exactly 1 turn
const canWinLineInOne = function (line, player) {
  // console.log(`[canWinLineInOne] ${player} can win in 1 for lin ${line}: ${playerCountCellsInLine(line, player) === 2 && emptyCountCellsInLine(line) === 1}`);
  return playerCountCellsInLine(line, player) === 2 && emptyCountCellsInLine(line) === 1;
}

// returns whether given player can win on a given line in exactly 2 turns
const canWinLineInTwo = function (line, player) {
  // console.log(`[canWinLineInTwo] ${player} can win in 2 for line ${line}: ${playerCountCellsInLine(line, player) === 1 && emptyCountCellsInLine(line) === 2}`);
  return playerCountCellsInLine(line, player) === 1 && emptyCountCellsInLine(line) === 2;
}

// returns count of cells belonging to given player in given line 
const playerCountCellsInLine = function (line, player) {
  // console.log(`[playerCountCellsInLine] player ${player} has ${line.filter(cell => belongsToPlayer(cell, player)).length} cells in line ${line}`);
  return line.filter(cell => belongsToPlayer(cell, player)).length;
}

// returns count of empty cells in given line
const emptyCountCellsInLine = function (line) {
  // console.log(`[emptyCountCellsInLine] ${line.filter(cell => isEmpty(cell)).length}`);
  return line.filter(cell => isEmpty(cell)).length;
}

// returns cell indices of empty cells in given line
const emptyCellsInLine = function (line) {
  // console.log(`[emptyCellsInLine] for line ${line}: line.filter(cell => isEmpty(cell))`);
  return line.filter(cell => isEmpty(cell));
}


export {
  selectAtRandom, getAvailableCells, selectCell, selectCellAsRiver as selectCellAsRandom, selectCellAsBailey as selectCellAsKid, botSpeed
}
