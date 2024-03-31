'use strict'

import { addHandlers, startNewGame } from './modules/events.js';
import { store }  from './modules/store.js';

document.addEventListener('DOMContentLoaded', () => {
  addHandlers();
  store.startsFirst = Math.random() < 0.5 ? 'x' : 'o';
  startNewGame();
});
