import { store } from './store.js';
import * as ui from './ui.js';

/*************************************
*         CONSTANTS                  *
**************************************/

const bots = ["avery", "bailey", "river"];

const botSpeed = 900;

const aiPlayer = "o";
const humanPlayer = "x";
const empty = "";

const centerCell = 4;
const cornerCells = [0, 2, 6, 8];
const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7],
[2, 5, 8], [0, 4, 8], [2, 4, 6]]

/*************************************
*         BOT STRATEGIES             *
**************************************/

/* 
  BOTS: 
    River = True random play (easy)
    Avery = Student model with poor sequencing - only what was explicitly stated  (medium)
    Bailey = Student model with better sequencing - what was explicity stated OR demonstrated consistently (hard)
*/

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

/*******   RIVER BOT: Random play  ******/
const selectCellAsRiver = function () {
  ui.thinkAloudReplace("I'm playing at random.");
  return selectAtRandom();
}

/********   BAILEY BOT: Student model w/ better sequencing  *****/
const selectCellAsBailey = function () {

  // OPENING MOVE
  if (isFirstTurnOfGame()) {
    ui.thinkAloudReplace("When I go first, I play in the middle so I'll have lots of options.")
    return selectCenter();
  } else if (isFirstTurnForBot() && isEmpty(centerCell)) {
    ui.thinkAloudReplace("I'm playing in the middle because it gives me lots of options and blocks one of your options.");
    return selectCenter();
  } else if (isFirstTurnForBot() && belongsToPlayer(centerCell, humanPlayer)) {
    ui.thinkAloudReplace("I didn't get to go first, and you already took the middle, so I'll play in a corner to block one of your options and make multiple options for myself.");
    return selectRandomCorner();
  } else {
    ui.thinkAloudReplace("It's not the first turn of the game.");
  }


  // ATTEMPT TO WIN NOW
  if (canWinThisTurn(aiPlayer)) {
    ui.thinkAloudAppend("I'm see a place where I can win this turn!");
    return selectWinningCell(aiPlayer);
  } else {
    ui.thinkAloudAppend("I don't see anywhere I can win this turn.");
  }

  // ATTEMPT TO BLOCK IMPENDING OPPONENT WIN
  if (canWinThisTurn(humanPlayer)) {
    ui.thinkAloudAppend("I see a spot where you could win next turn, so I'm blocking you.");
    return selectWinningCell(humanPlayer);
  } else {
    ui.thinkAloudAppend("I don't see anywhere you could win next turn, so I don't need to block you.");
  }

  // SET UP FUTURE WIN, BALANCING OFFENSE / DEFENSE
  if (canWinNextTurn(aiPlayer)) {
    const [maxOffensiveLinesOfTwoPerCell, bestOffensiveCells] = selectSecondCellInLine(aiPlayer);
    ui.thinkAloudAppend(`I'm looking for places I could go now that would let me win next turn. I see ${bestOffensiveCells.length} places where I could go now that would each give me ${maxOffensiveLinesOfTwoPerCell} ways to win next turn. Let me see if any of those options would be best defensively...`);
    // check whether any of these best offensive options can also be defensive
    const defensiveCellCounts = cellsThatCanBeSecondInLine(humanPlayer);
    let defensiveScores = Object.keys(defensiveCellCounts)
      .filter(key => bestOffensiveCells.includes(key))
      .reduce((obj, key) => {
        obj[key] = defensiveCellCounts[key];
        return obj;
      }, {});
    if (Object.keys(defensiveScores).length > 0) {
      const maxDefensiveLines = Math.max.apply(null, Object.values(defensiveScores));
      const bestDefensiveCellsAmonstBestOffensiveCells = Object.keys(defensiveScores).filter(x => {
        return defensiveScores[x] === maxDefensiveLines;
      });
      ui.thinkAloudAppend(`I'm going here because there will be ${maxOffensiveLinesOfTwoPerCell} way(s) I could win next turn and I'm blocking you in ${maxDefensiveLines} direction(s).`);
      return bestDefensiveCellsAmonstBestOffensiveCells[0];
    } else {
      ui.thinkAloudAppend(`It won't help with defense, but I'm going here because there will be ${maxOffensiveLinesOfTwoPerCell} way(s) I could win next turn."}`);
      return bestOffensiveCells[0];
    }
  } else {
    ui.thinkAloudAppend("I don't see any places I could go now that would let me win next turn.")
  }

  // PLAY AT RANDOM
  ui.thinkAloudAppend("I'm picking a cell at random.");
  return selectAtRandom();
}

/******** AVERY BOT: Student model w/ poor sequencing *******/

const unsequencedAveryStrategies = ["winThisTurn", "blockOpponentWin", "setUpWinForNextTurn"];

/* shuffle in-place using Durstenfeld algorithm */
const shuffleArr = function (arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
}

const selectCellAsAvery = function () {
  // OPENING MOVE (same as Bailey)
  if (isFirstTurnOfGame()) {
    ui.thinkAloudReplace("When I go first, I play in the middle so I'll have lots of options.")
    return selectCenter();
  } else if (isFirstTurnForBot() && isEmpty(centerCell)) {
    ui.thinkAloudReplace("I'm playing in the middle because it gives me lots of options and blocks one of your options.");
    return selectCenter();
  } else if (isFirstTurnForBot() && belongsToPlayer(centerCell, humanPlayer)) {
    ui.thinkAloudReplace("I didn't get to go first, and you already took the middle, so I'll play in a corner to block one of your options and make multiple options for myself.");
    return selectRandomCorner();
  } else {
    ui.thinkAloudReplace("It's not the first turn of the game.");
  }

  // SELECT FROM UNSEQUENCED STRATEGIES IN RANDOM ORDER
  shuffleArr(unsequencedAveryStrategies);
  // console.log('Avery strategies after shuffle: ', unsequencedAveryStrategies);
  let returnVal = null;
  let i = 0;
  while (!returnVal && i < unsequencedAveryStrategies.length) {
    switch (unsequencedAveryStrategies[i]) {

      // ATTEMPT TO WIN NOW
      case 'winThisTurn':
        if (canWinThisTurn(aiPlayer)) {
          ui.thinkAloudAppend("I'm see a place where I can win this turn!");
          returnVal = selectWinningCell(aiPlayer);
        } else {
          ui.thinkAloudAppend("I don't see anywhere I can win this turn.");
        }
        break;

      // ATTEMPT TO BLOCK IMPENDING OPPONENT WIN
      case 'blockOpponentWin':
        if (canWinThisTurn(humanPlayer)) {
          ui.thinkAloudAppend("I see a spot where you could win next turn, so I'm blocking you.");
          returnVal = selectWinningCell(humanPlayer);
        } else {
          ui.thinkAloudAppend("I don't see anywhere you could win next turn, so I don't need to block you.");
        }
        break;

      // SET UP FUTURE WIN, BALANCING OFFENSE / DEFENSE
      case 'setUpWinForNextTurn':
        if (canWinNextTurn(aiPlayer)) {
          const [maxOffensiveLinesOfTwoPerCell, bestOffensiveCells] = selectSecondCellInLine(aiPlayer);
          ui.thinkAloudAppend(`I'm looking for places I could go now that would let me win next turn. I see ${bestOffensiveCells.length} places where I could go now that would each give me ${maxOffensiveLinesOfTwoPerCell} ways to win next turn. Let me see if any of those options would be best defensively...`);
          // check whether any of these best offensive options can also be defensive
          const defensiveCellCounts = cellsThatCanBeSecondInLine(humanPlayer);
          let defensiveScores = Object.keys(defensiveCellCounts)
            .filter(key => bestOffensiveCells.includes(key))
            .reduce((obj, key) => {
              obj[key] = defensiveCellCounts[key];
              return obj;
            }, {});
          if (Object.keys(defensiveScores).length > 0) {
            const maxDefensiveLines = Math.max.apply(null, Object.values(defensiveScores));
            const bestDefensiveCellsAmonstBestOffensiveCells = Object.keys(defensiveScores).filter(x => {
              return defensiveScores[x] === maxDefensiveLines;
            });
            ui.thinkAloudAppend(`I'm going here because there will be ${maxOffensiveLinesOfTwoPerCell} way(s) I could win next turn and I'm blocking you in ${maxDefensiveLines} direction(s).`);
            returnVal = bestDefensiveCellsAmonstBestOffensiveCells[0];
          } else {
            ui.thinkAloudAppend(`It won't help with defense, but I'm going here because there will be ${maxOffensiveLinesOfTwoPerCell} way(s) I could win next turn."}`);
            returnVal = bestOffensiveCells[0];
          }
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

/*************************************
*         MOVES                      *
**************************************/

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

// select randomly among corner cells
const selectRandomCorner = function () {
  const available = getAvailableCornerCells();
  const randomCornerCellIndex = available[(Math.floor(Math.random() * available.length))];
  return randomCornerCellIndex;
}

// select randomly among cells that can win this turn for given player
const selectWinningCell = function (player) {
  const winningCells = cellsThatCanWinThisTurn(player);
  const winningCellIndex = winningCells[(Math.floor(Math.random() * winningCells.length))];
  return winningCellIndex;
}

/*************************************
*      HELPERS: GAME STATE, ETC      *
**************************************/

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

// returns whether a given player can win this turn 
const canWinThisTurn = function (player) {
  // console.log(`[canWinThisTurn] ${cellsThatCanWinThisTurn(player).length > 0}`);
  return cellsThatCanWinThisTurn(player).length > 0;
}

// returns whether a given player can set themselves up now to win next turn 
const canWinNextTurn = function (player) {
  const nextCells = cellsThatCanBeSecondInLine(player);
  // console.log('[canWinNextTurn] nextCells, keys, keys.length');
  // console.log(nextCells);
  // console.log(Object.keys(nextCells));
  // console.log(Object.keys(nextCells).length);
  // console.log('Object.keys(nextCells).length > 0: ', Object.keys(nextCells).length > 0);
  return Object.keys(nextCells).length > 0;
}


/*************************************
*      HELPERS: CELL STATUS      *
**************************************/

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

// returns array of available corner cells
const getAvailableCornerCells = function () {
  return cornerCells.filter(cell => isEmpty(cell));
}

// returns whether given cell is empty
const isEmpty = function (cell) {
  return store.game.cells[cell] === empty;
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

// returns array containing: 
//    - max number of lines a specific cell play could increase to two per line
//    - array of cells that would acheive that result
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


/*************************************
*      HELPERS: LINE STATUS          *
**************************************/

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
  botSpeed, selectCell
}
