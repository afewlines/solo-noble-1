import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { Board } from '@/js/BoardClasses.js'


// ENUM DECLARATIONS
const GameState = {
  LOADING: 'LOADING',
  READY: 'READY',
  PLAYING: 'PLAYING',
  WIN: 'WIN',
  LOSE: 'LOSE',
};

// INITIALIZATIONS
const LOADER_GLTF = new GLTFLoader();


/**
 * Single player version of Standard.
 * @property {Object} data - Game data, no rigid type yet
 * @property {GameState} state - State of game
 * @property {Board} activeBoard - Board in play
 * @property {Object} boardData - Board data, initial peg spots
 * @property {Object} Object - Peg data, maybe more?
 * @property {number} pegsTotal - Total Pegs created for board
 * @property {number} pegsRemoved - Total Pegs jumped/removed
 */
class SinglePlayerStandard {
  /**
   * @constructor
   * @param {Object} gameData - Needs board, peg
   */
  constructor(gameData) {
    this.data = gameData;
    this.state = GameState.LOADING;
    this.activeBoard = new Board(this.data.board);
    this.boardData = null;
    this.pegData = null;
    this.pegsTotal = -1;
    this.pegsRemoved = 0;
  }

  /**
   * @type {number}
   */
  get pegsRemaining() {
    return this.pegsTotal - this.pegsRemoved;
  }

  /**
   * @type {Hole[]}
   */
  get holesReady() {
    return this.activeBoard.readyHoles;
  }

  /**
   * Load Peg data functor
   * @param {function} resolve - Promise resolve
   */
  loadPegData(resolve) {
    if (this.pegData == null) {
      this.data.peg;

      // make callback for when Peg file loads
      let onPegLoadCallback = function(loaded) {
        let geom = loaded.scene.children[0].geometry.clone();
        geom.computeBoundingSphere();
        if (geom.boundingSphere.radius != 0) {
          geom.rotateX(Math.PI / -2);
          geom.scale(0.75, 0.75, 0.75);
        }
        this.pegData = {};
        this.pegData.geometry = geom;
        resolve();
      }.bind(this); // bind 'this' for access to this.pegData

      LOADER_GLTF.load(
        this.data.peg.path, // path to file
        onPegLoadCallback, // on success callback
        undefined, // during load callback
        (e) => console.error(e), // error callback
      );
    }
  }

  /**
   * Functor to enerate Board data for game
   * @param {function} resolve - Promise resolve
   * @param {function} reject - Promise reject
   */
  loadBoardData(resolve, reject) {
    if (this.boardData == null && this.pegData != null) {
      this.boardData = this.activeBoard.constructBoard(this.pegData.geometry);
      resolve();
    } else {
      reject();
    }
  }

  /**
   * Search Board for Hole by ID
   * @param {Hole.id} target - Hole to find
   * @return {Hole} Found Hole, or null;
   */
  findHoleById(target) {
    return this.activeBoard.findHoleById(target.replace("hole", ""));
  }

  /**
   * Search Board for Hole by Peg
   * @param {Peg.id} target - Peg to find
   * @return {Hole} Found Hole, or null;
   */
  findHoleOfPeg(target) {
    return this.activeBoard.findHoleOfPeg(target.replace("peg", ""));
  }

  /**
   * Attempt jump on active Board
   * @param {Hole} from - Hole to jump from
   * @param {Hole} to - Hole to jump to
   * @return {Number} ID of Peg jumped, null if none
   */
  tryJump(from, to) {
    if (from == null || to == null) {
      return null;
    } else {
      let doomed = this.activeBoard.jumpFromTo(from, to);
      this.pegsRemoved += (doomed != null ? 1 : 0);
      return doomed;
    }
  }

  /**
   * Use a SP cheat
   * @param {string} command - Cheat to execute
   * @param {string[]} args - Cheat arguments
   */
  cheat(command, args) {
    switch (command) {
      case 'remove':
        this.activeBoard.jumpPeg(args[0]);
        this.pegsRemoved += 1;
        break;
      default:

    }
  }
}

export { GameState, SinglePlayerStandard };