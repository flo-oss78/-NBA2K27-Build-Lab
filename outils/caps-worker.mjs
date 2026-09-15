/* Règle un modèle de plafonds dans un fil séparé (voir caps-modele.mjs). */
import { parentPort } from 'node:worker_threads';
import { modele } from './caps-modele.mjs';

parentPort.on('message', ({ h, sans, corps, A }) => {
  parentPort.postMessage({ h, sans, m: modele(corps, A) });
});
