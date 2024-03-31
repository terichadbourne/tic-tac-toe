'use strict'

/*************************************
     UI
***************************************/

import { store }  from './store.js';

const gameCells =  Array.from(document.getElementsByClassName('game-cell'));
const players = Array.from(document.getElementsByClassName('player'));
const rematchButton = document.getElementById('rematch-button');
const opponentSelect = document.getElementById('opponent-select');


// display a message to the user
const showMessage = function (message) {
  document.getElementById("message").innerHTML = message;
}

// remove message currently displayed to user
const clearMessage = function () {
  document.getElementById("message").innerHTML = '';
}

// loop through `store.cells` array to draw symbols on game board
const displayCells = function () {
  store.game.cells.forEach((element, index) => {
    document.getElementById(index).innerHTML = element;
  })
}

// update display of win and draw counts
const updateWins = function () {
  document.getElementById('player-x-wins').innerHTML = store.xWins;
  document.getElementById('player-o-wins').innerHTML = store.oWins;
  document.getElementById('draws').innerHTML = store.draws;
}

// highlight cells that make up the winning line
const showWinningCells = function () {
  store.winningCells.forEach((cellIndex) => {
    document.getElementById(cellIndex).classList.add('winning-cell');
  })
}

// remove highlighting from game board
const hideWinningCells = function () {
  gameCells.forEach(gameCell => {
    gameCell.classList.remove('winning-cell');
  });
}

export {
  showMessage, clearMessage, displayCells, updateWins, showWinningCells, hideWinningCells, gameCells, players, rematchButton, opponentSelect
}
