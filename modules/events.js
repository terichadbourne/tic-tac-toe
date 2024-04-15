'use strict'

// require dependcies
import { store } from './store.js';
import * as ui from './ui.js';
import * as ai from './ai.js';

const addHandlers = function () {
  ui.rematchButton.addEventListener("click", startNewGame);
  ui.gameCells.forEach(gameCell => {
    gameCell.addEventListener("click", playHereHuman)
  });
  ui.opponentSelect.addEventListener("change", (event) => {
    console.log('restarting match due to new oppponent');
    resetMatch();
  });
};

// start new game when rematch button is clicked
const startNewGame = function (event) {
  // clear message display
  ui.clearMessage()
  // set game state and current turn and clear out cells array
  store.currentTurn = store.startsFirst
  delete store.game
  // create new game on the server
  onCreateGame()
  // hide rematch button
  ui.rematchButton.classList.add("hidden");
  if (store.currentTurn === "o") {
    document.getElementById('player-x').classList.remove('active');
    document.getElementById('player-o').classList.add('active');
    playComputer(ui.opponentSelect.value);
  } else {
    document.getElementById('player-x').classList.add('active');
    document.getElementById('player-o').classList.remove('active');
  }
}



// steps to take when user clicks on a cell on the game board
const playHereHuman = function (event) {
  if (store.currentTurn === 'o') {
    ui.showMessage("Oops! Not your turn yet.");
  } else {
    // clear any previous messages
    ui.clearMessage();
    ui.thinkAloudReplace("");
    // if the game's not already over...
    if (store.game.over === false) {
      // if cell was blank, add symbol of current player to `store.cells` array,
      // redisplay symbols on all cells, then swap players
      // if ($(event.target).html() === '') {
      if (event.currentTarget.innerHTML === '') {
        store.game.cells[event.currentTarget.id] = store.currentTurn
        // send new move to server (also will run displayCells and processMove
        onUpdateGame(event.currentTarget.id, store.currentTurn)
        // if cell was occupied, log error and prevent play and turn swap
      } else {
        ui.showMessage('That cell is already occupied. Try again!')
      }
      // else if game is over, alert that
    } else {
      ui.showMessage('This game is over. Click the button below for a rematch.')
    }
  }

}

const playComputer = function (bot) {
  ui.thinkAloudReplace("");
  const selectedCell = ai.selectCell(bot);
  store.game.cells[selectedCell] = store.currentTurn;
  setTimeout(() => {
    onUpdateGame(selectedCell, store.currentTurn);
  }
    , ai.botSpeed);
}

// swap players' turns after a successful move (called from processMove)
const swapTurns = function () {
  // swap value of store.currentTurn and toggle active classes
  if (store.currentTurn === 'x') {
    store.currentTurn = 'o'
    ui.players.forEach(player => {
      player.classList.toggle("active");
    });
    playComputer(ui.opponentSelect.value);
  } else if (store.currentTurn === 'o') {
    store.currentTurn = 'x'
    ui.players.forEach(player => {
      player.classList.toggle("active");
    });
  }
}

// array of arrays representing each set of cell indexes that represents a
// winning line
const winningLines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7],
[2, 5, 8], [0, 4, 8], [2, 4, 6]]

const middleCell = 4

const cornerCells = [0, 2, 6, 8]


// callback function returns true if a cell contains an x or o already
const cellOccupied = (cell) => {
  return cell === 'x' || cell === 'o'
}

// run when new player is logged in or new game is rquested, to create a new
// game on the server and update the UI
const onCreateGame = function (playerName) {
  store.game =
  {
    id: 1,
    cells: ["", "", "", "", "", "", "", "", ""],
    over: false,
    player_x: {
      id: 2,
      type: "human",
      name: playerName
    },
    player_o: {
      id: 1,
      type: "computer",
      name: "Marvin"
    }
  }

  // refresh display, contents of game cells, win counts, etc.
  ui.hideWinningCells()
  store.winningCells = []
  ui.displayCells()
  ui.updateWins()
}

// save current game state to server and udpate display after each move
const onUpdateGame = function (cellIndex, value) {
  console.log('onUpdateGame');
  // gather data needed for AJAX call
  store.game.cells[cellIndex] = value;
  // refresh display to add x or o
  ui.displayCells()
  // process move (check for wins, etc.)
  processMove()
}

// run when game is over to update status on server
const onFinishGame = function () {
  // format data to show game is over
  store.game.over = true;
  if (store.startsFirst === "x") {
    store.startsFirst = "o"
  } else {
    store.startsFirst = "x"
  }
  // send to server
  // onUpdateGame(event.currentTarget.id, store.currentTurn)
  ui.displayCells()
  // $('#rematch-button').removeClass('hidden')
  ui.rematchButton.classList.remove("hidden");
  // request full list of user's games (including one just added)
  // (this will automatically run checkForWin)
  onGetCompletedGames();
}

// fetch record of user's completed games and use data to update stats displayed
const onGetCompletedGames = function () {
  // call to server to retrieve list of completed games
  store.games.push(store.game);
  // reset win and draw counts for reprocessing
  store.xWins = 0
  store.oWins = 0
  store.draws = 0
  // if there are any games returned, determine the winner of each and
  // adjust counts
  if (store.games.length > 0) {
    store.games.forEach((game) => {
      checkForWin(game.cells)
    })
  }
  // display win and draw counts on page
  ui.updateWins()
}

// process latest move made to check for a win or swap turns accordingly
const processMove = function () {
  // update winner and winningCells variables using checkForWin function,
  // which returns x, o, draw, or incomplete
  const currentGameStatus = checkForWin(store.game.cells)
  // if game is incomplete, swap turns
  if (currentGameStatus === 'incomplete') {
    swapTurns()
  } else {
    // if a draw, alert user
    if (currentGameStatus === 'draw') {
      ui.showMessage("It's a draw! Click below to start a new game.")
      // if a win, alert user and highlght winning cells
    } else {
      ui.showMessage(`Player ${currentGameStatus.toUpperCase()} has won the game!`)
      ui.showWinningCells()
    }
    // for any completed game, update completed status on server
    onFinishGame()
  }
}

// test a single gaame to find win, draw, incomplete
const checkForWin = function (cellsArray) {
  // temporaty variables
  let winner = null
  let gameStatus = null
  // loop through all potential winning lines...
  winningLines.forEach((winningLine) => {
    // write each cell value from this specific winningLine to an array
    const testArray = []
    winningLine.forEach((cellIndex) => {
      testArray.push(cellsArray[cellIndex])
    })
    // check if all values in the array are identical and NOT ''
    // if so, set winner variable to that value
    if (testArray[0] === testArray[1] && testArray[1] === testArray[2] &&
      testArray[0] !== '') {
      winner = testArray[0]
      store.winningCells = [winningLine[0], winningLine[1], winningLine[2]]
    }
  })
  // after looping, if a winner was found (value isn't null), increase
  // appropriate win count and update gameStatus
  if (winner) {
    gameStatus = winner
    store[`${winner}Wins`]++
    // else if no winner but all cells full, add to both draw records and updates
    // gameStatus
  } else if (cellsArray.every(cellOccupied)) {
    gameStatus = 'draw'
    store[`draws`]++
    // else if no win or draw, set gameStatus to incomplete
  } else {
    gameStatus = 'incomplete'
  }
  // return gameStatus as "x", "o", "draw", or "incomplete"
  return gameStatus
}

const resetMatch = function () {
  store.games = []
  store.xWins = 0;
  store.oWins = 0;
  store.draws = 0;
  ui.updateWins();
  startNewGame();
}

export {
  addHandlers,
  swapTurns,
  playHereHuman,
  processMove,
  cellOccupied,
  winningLines,
  startNewGame,
  onCreateGame,
  onUpdateGame,
  onFinishGame,
  onGetCompletedGames,
  checkForWin
}
