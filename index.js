'use strict'

import { addHandlers, startNewGame } from './modules/events.js';

document.addEventListener('DOMContentLoaded', () => {
  addHandlers();
  startNewGame();
});
