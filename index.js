'use strict'

import * as events from './modules/events.js';
import { store } from './modules/store.js';

document.addEventListener('DOMContentLoaded', () => {
  events.addHandlers();
  store.startsFirst = Math.random() < 0.5 ? 'x' : 'o';
  events.startNewGame();
});
