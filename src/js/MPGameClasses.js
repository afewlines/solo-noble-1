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

const GameTurns = {
  PLAYER: 0,
  COMPUTER: 1,
}

// INITIALIZATIONS
const LOADER_GLTF = new GLTFLoader();


/**
 * Versus (AI) version of Standard.
 * @property {Object} data - Game data, no rigid type yet
 * @property {GameState} state - State of game
 * @property {Board} boardPlayer - Board in play
 * @property {Board} boardComputer - Board in play
 * @property {Object} boardData - Board data, initial peg spots
 * @property {Object} Object - Peg data, maybe more?
 * @property {number} pegsTotal - Total Pegs created for board
 * @property {number} pegsRemoved - Total Pegs jumped/removed
 */
class VersusAIStandard {
  /**
   * @constructor
   * @param {Object} gameData - Needs board, peg
   */
  constructor(gameData) {
    this.data = gameData;
    this.state = GameState.LOADING;
    this.boardData = null;
    this.pegData = null;
    this.pegsTotal = -1;
    this.boardPlayer = new Board(this.data.board);
    this.boardComputer = new Board(this.data.board);
    this.pegsRemovedPlayer = 0;
    this.pegsRemovedComputer = 0;
  }

  /**
   * @type {number}
   */
  get pegsRemainingPlayer() {
    return this.pegsTotal - this.pegsRemovedPlayer;
  }

  /**
   * @type {number}
   */
  get pegsRemainingComputer() {
    return this.pegsTotal - this.pegsRemovedComputer;
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
      this.boardData = this.boardPlayer.constructBoard(this.pegData.geometry);
      resolve();
    } else {
      reject();
    }
  }

  /**
   * Search Board for Hole by ID
   * @param {Hole.id} target - Hole to find
   * @param {boolean} player - If checking Player
   * @return {Hole} Found Hole, or null;
   */
  findHoleById(target, player) {
    if (player) {
      return this.boardPlayer.findHoleById(target.replace("hole", ""));
    } else {
      return this.boardComputer.findHoleById(target.replace("hole", ""));
    }

  }

  /**
   * Search Board for Hole by Peg
   * @param {Peg.id} target - Peg to find
   * @param {boolean} player - If checking Player
   * @return {Hole} Found Hole, or null;
   */
  findHoleOfPeg(target, player) {
    if (player) {
      return this.boardPlayer.findHoleOfPeg(target.replace("peg", ""));
    } else {
      return this.boardComputer.findHoleOfPeg(target.replace("peg", ""));
    }
  }

  /**
   * Attempt jump on active Board
   * @param {Hole} from - Hole to jump from
   * @param {Hole} to - Hole to jump to
   * @param {boolean} player - If jumping for Player
   * @return {Number} ID of Peg jumped, null if none
   */
  tryJump(from, to, player) {
    if (from == null || to == null) {
      return null;
    } else {
      let doomed = null;
      if (player) {
        doomed = this.boardPlayer.jumpFromTo(from, to);
        this.pegsRemovedPlayer += (doomed != null ? 1 : 0);
      } else {
        doomed = this.boardComputer.jumpFromTo(from, to);
        this.pegsRemovedComputer += (doomed != null ? 1 : 0);
      }
      return doomed;
    }
  }
}


export { GameState, GameTurns, VersusAIStandard };