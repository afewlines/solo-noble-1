<script>

  // EXTERNAL LIBRARIES
  import * as THREE from 'three';
  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
  import { gsap } from 'gsap';

  // MY COMPONENTS
  import Veil from '@/components/ui/Veil.vue';

  // MY LIBRARIES
  import { Board } from '@/js/BoardClasses.js';
  import { THREEx } from '@/js/ExtraThree.js';
  import { CustomMaterials } from '@/js/Materials.js';

  // INITIALIZATIONS
  // enums... again.
  const GameState = {
    LOADING: 'LOADING',
    READY: 'READY',
    PLAYING: 'PLAYING',
    WIN: 'WIN',
    LOSE: 'LOSE',
  };
  const GameTurns = {
    NONE: -1,
    LOCAL: 0,
    OTHER: 1,
  };

  const VersusAIStandard = {};
  const LOADER_TEXTURE = new THREE.TextureLoader();
  const LOADER_GLTF = new GLTFLoader();

  /**
   * Tween factory... again
   */
  const TWEENING = {
    /**
     * Raise object.
     * Used for selecting Peg.
     * @param {Object} target - Object to modify
     */
    raise(target) {
      return [
        target.position,
        {
          duration: 1.15,
          y: 2,
          ease: 'elastic.out(1, 0.5)',
          overwrite: true,
        },
      ];
    },
    /**
     * Lower object.
     * Used for deselecting Peg.
     * @param {Object} target - Object to modify
     */
    lower(target) {
      return [
        target.position,
        {
          duration: 0.5,
          y: 0.5,
          ease: 'power4.out',
          overwrite: true,
        },
      ];
    },
    /**
     * Move object, unblock using callback at end.
     * Used to move a jumping Peg to new hole.
     * @param {Object} target - Object to modify
     * @param {Object} position - Position to move to
     * @param {function} callback - Callback to unblock object
     */
    moveAndBlock(target, position, callback) {
      return [
        target.position,
        {
          duration: 0.5,
          x: position.x,
          z: position.z,
          ease: 'power3.inOut',
          onComplete: callback,
        },
      ];
    },
    /**
     * Lower object, do not override last tween.
     * Used to lower a jumping Peg into new hole.
     * @param {Object} target - Object to modify
     */
    lowerSafe(target) {
      return [
        target.position,
        {
          duration: 0.5,
          y: 0.5,
          ease: 'power4.out',
        },
      ];
    },
    /**
     * Move object slowly.
     * Used for removing jumped Peg.
     * @param {Object} target - Object to modify
     * @param {Object} position - Position to move to
     */
    moveSlow(target, position) {
      return [
        target.position,
        {
          duration: 3.5,
          x: position.x,
          z: position.z,
          ease: 'power2.inOut',
        },
      ];
    },
    /**
     * Raise object, safe.
     * Used for removing jumped Peg.
     * @param {Object} target - Object to modify
     */
    doomedUp(target) {
      return [
        target.position,
        {
          duration: 1.5,
          y: 2,
          ease: 'power4.out',
        },
      ];
    },
    /**
     * Lower object, safe, to y=0.
     * Used for removing jumped Peg.
     * @param {Object} target - Object to modify
     */
    doomedDown(target) {
      return [
        target.position,
        {
          duration: 1.5,
          delay: 2,
          y: -0.05,
          ease: 'power4.in',
        },
      ];
    },
  };

  /**
   * Vue.js View: Standard Versus AI Game
   * @property {number} loading - Loading completion, arbitrary weights
   * @property {Object} gameData - Game data from App
   * @property {GameTurns} turn - Current turn of game
   * @property {element} elThree - Element for Three.js
   * @property {Object3D} boardObjPlayer - Board objects for this player and other
   * @property {Object3D} selectedPeg - Currently selected Peg
   * @property {string[]} movingPegs - List of IDs of Pegs currently in motion
   * @property {number} pegsRemovedPlayer - Pegs removed by this player and other
   * @property {number} possibleJumps - Possible moves for this player and other
   */
  export default {
    name: 'MPBattle',
    components: {
      Veil,
    },
    computed: {
      /**
       * Get active socket
       * @memberof MPBattle
       * @instance
       */
      socket() {
        return this.$parent.socket;
      },
      /**
       * Get current player's name
       * @memberof MPBattle
       * @instance
       */
      currentTurn() {
        if (this.turn < 0) {
          return false;
        }
        return this.turn == 1 ? this.nameOther : this.nameLocal;
      },
    },
    methods: {
      /**
       * Three.js render loop.
       * @memberof MPBattle
       * @instance
       */
      animate() {
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.animate);
      },
      /**
       * Asynchronous loading function, set listeners for game functionality
       * Loads: three.js environment, game class, board/peg layout, three.js meshes
       * @memberof MPBattle
       * @instance
       */
      async load() {
        //define anonymous loading functions

        // wait a sec
        await new Promise(res => setTimeout(res, 1000));

        // init three.js
        this.elThree = document.getElementById('game-screen');
        let loaded = THREEx.loadThree(this.elThree);
        for (let item in loaded) {
          if (this[item] == null) {
            this[item] = loaded[item];
          }
        }
        this.loading += 4;

        // adjust window on resize
        window.addEventListener(
          'resize',
          function(load) {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();

            this.renderer.setSize(window.innerWidth, window.innerHeight);
          }.bind(this),
          false,
        );
        this.loading += 1;

        // load peg
        let loadGLTF = async function(target, pegData, res, rej) {
          // make callback for when Peg file loads
          let onPegLoadCallback = function(loaded) {
            var geom = loaded.scene.children[0].geometry.clone();
            geom.computeBoundingSphere();
            if (geom.boundingSphere.radius != 0) {
              geom.rotateX(Math.PI / -2);
              geom.scale(0.75, 0.75, 0.75);
            }
            this.pegGeometry = geom;
            res();
          }.bind(pegData); // bind 'this' for access to this.pegData

          LOADER_GLTF.load(
            target, // path to file
            onPegLoadCallback, // on success callback
            undefined, // during load callback
            e => console.error(e), // error callback
          );
        };
        await new Promise((res, rej) => {
          loadGLTF('./models/Peg2.glb', this, res, rej);
        });
        this.loading += 4;

        // load board
        await new Promise((resolve, reject) => {
          if (this.pegGeometry != null) {
            this.boardData = this.boardData.constructBoard(this.pegGeometry);
            resolve();
          } else {
            reject();
          }
        });
        this.loading += 9;

        // init scene
        // TODO update to build environment
        // load sky tex
        loaded = await new Promise((res, rej) =>
          LOADER_TEXTURE.load('./sky/skysimple.jpg', res, undefined, rej),
        );
        loaded = THREEx.initSimpleScene(this.scene, loaded);
        for (let item in loaded) {
          this.objects[item] = loaded[item];
          this.loading += 1;
        }

        loaded = THREEx.addBoard(
          this.scene,
          this.boardData.geometry,
          CustomMaterials.silver,
          this.boardData.spots,
          this.pegGeometry,
          CustomMaterials.gold,
        );
        this.boardObjPlayerLocal = loaded.board;
        this.pegsPlayerLocal = loaded.pegs;
        this.boardObjPlayerLocal.translateZ(5);
        this.loading += 2;

        loaded = THREEx.addBoard(
          this.scene,
          this.boardData.geometry,
          CustomMaterials.gold,
          this.boardData.spots,
          this.pegGeometry,
          CustomMaterials.silver,
        );
        this.boardObjPlayerOther = loaded.board;
        this.pegsPlayerOther = loaded.pegs;
        //console.log(loaded.pegs.length);
        this.boardObjPlayerOther.translateZ(-5);
        this.boardObjPlayerOther.rotateOnAxis(
          new THREE.Vector3(0, 1, 0),
          Math.PI,
        );
        this.loading += 2;

        // wait a sec
        await new Promise(res => setTimeout(res, 1000));

        // register socket handles
        this.socket.on('battle-names', names => {
          this.nameLocal = names.local;
          this.nameOther = names.other;
          this.turn = names.turn ? 0 : 1;
        });
        this.socket.on('take-turn', () => {
          this.turnLocal();
        });
        this.socket.on('echo-turn', data => {
          this.turnOpponent(data);
        });
        this.socket.on('jump-confirm', result => {
          if (result) {
            this.movingPegs.push(this.selectedPeg.name);
            this.fireTween(
              this.selectedPeg,
              'move',
              this.boardObjPlayerLocal.getObjectByName(result.to).position,
              null,
            );
            this.selectedPeg = null;

            let doomed = this.boardObjPlayerLocal.getObjectByName(
              `peg${result.over}`,
            );
            doomed.name = `removed${doomed.name}`;
            this.pegsRemovedPlayerLocal++;
            this.fireTween(doomed, 'removePlayerLocal', null, 0.5);
            this.possibleJumpsLocal = result.r1;
            this.possibleJumpsOther = result.r2;
            this.turn = 1;
          } else {
            if (this.selectedPeg != null) {
              this.fireTween(this.selectedPeg, 'lower');
              this.selectedPeg = null;
            }
            this.elThree.addEventListener('click', this.onLeftClick, true);
          }
        });
        this.socket.on('battle-end', data => {
          this.endGame(data);
        });
        this.loading += 4;

        // game is ready, start
        console.log('Ready');
        this.state = GameState.READY;
        this.animate();
      },
      /**
       * Set game state and let server know we're ready.
       * @memberof MPBattle
       * @instance
       */
      sendClientReady() {
        this.state = GameState.PLAYING;
        this.socket.emit('client-loaded');
      },
      /**
       * Initiate local player's (this client) turn.
       * @memberof MPBattle
       * @instance
       */
      turnLocal() {
        console.log('PLAYER TURN');
        this.elThree.addEventListener('click', this.onLeftClick, true);
        this.turn = 0;
      },
      /**
       * Execute opponent's (other client) turn.
       * @param {Object} turn - Data sent from server describing most recent turn
       * @memberof MPBattle
       * @instance
       */
      async turnOpponent(turn) {
        console.log('OPPONENT TURN');

        // find from peg, raise in air
        let pegFrom = this.boardObjPlayerOther.getObjectByName(turn.from);
        this.fireTween(pegFrom, 'raise');

        // wait a bit
        await new Promise(resolve =>
          setTimeout(resolve, Math.random() * 1000 + 750),
        );

        // find over peg and to hole
        let pegOver = this.boardObjPlayerOther.getObjectByName(`peg${turn.over}`);
        let holeTo = this.boardObjPlayerOther.getObjectByName(turn.to);

        this.fireTween(pegFrom, 'move', holeTo.position, null);
        this.pegsRemovedPlayerOther++;
        this.fireTween(pegOver, 'removePlayerOther', null, 0.5);
        this.possibleJumpsLocal = turn.r2;
        this.possibleJumpsOther = turn.r1;
      },
      /**
       * Recieve end events, handle accordingly
       * @param {boolean} win - If game ended as win or loss
       * @memberof MPBattle
       * @instance
       */
      endGame(win) {
        if (win) {
          this.state = GameState.WIN;
        } else {
          this.state = GameState.LOSE;
        }
      },
      /**
       * Apply a series of GSAP tweens to an object.
       * @param {Object} target - Object to modify
       * @param {string} mode - Tween selector
       * @param {Object} arg - Argument to pass to tweens
       * @param {number} sync - Seconds from call to start tweens synced
       * @memberof MPBattle
       * @instance
       */
      fireTween(target, mode, arg = null, sync = null) {
        let queue = [];
        let localTL = gsap.timeline();
        switch (mode) {
          case 'raise':
            queue.push(TWEENING.raise(target));
            break;
          case 'lower':
            queue.push(TWEENING.lower(target));
            break;
          case 'move':
            queue.push(
              TWEENING.moveAndBlock(
                target,
                arg,
                function() {
                  this.movingPegs.splice(this.movingPegs.indexOf(target.name), 1);
                }.bind(this),
              ),
            );
            queue.push(TWEENING.lowerSafe(target));
            break;
          case 'removePlayerLocal':
            queue.push(TWEENING.doomedUp(target));
            queue.push(TWEENING.doomedDown(target));
            queue.push(
              TWEENING.moveSlow(target, {
                x: this.$parent.selecedGameData.width / 2 + 2,
                z: this.pegsRemovedPlayerLocal - 45 / 2,
              }),
            );
            break;
          case 'removePlayerOther':
            queue.push(TWEENING.doomedUp(target));
            queue.push(TWEENING.doomedDown(target));
            queue.push(
              TWEENING.moveSlow(target, {
                x: this.$parent.selecedGameData.width / 2 + 2,
                z: this.pegsRemovedPlayerOther - 45 / 2,
              }),
            );
            break;
          default:
        }

        if (sync == null) {
          for (let part of queue) {
            localTL.to(...part);
          }
        } else {
          for (let part of queue) {
            localTL.to(...part, localTL.time() + sync);
          }
        }
      },
      /**
       * Main click event handler, local player's turn functionality.
       * @param {Event} event - Event from trigger
       * @memberof MPBattle
       * @instance
       */
      onLeftClick(event) {
        event.preventDefault();
        this.raycaster.setFromCamera(
          new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1,
          ),
          this.camera,
        );
        let intersects = this.raycaster.intersectObjects(
          this.boardObjPlayerLocal.children,
        );

        if (intersects.length > 0) {
          if (intersects[0].object.name.startsWith('peg')) {
            // PEG
            if (this.movingPegs.includes(intersects[0].object.name)) {
              return;
            }

            if (this.selectedPeg != null) {
              if (this.selectedPeg.name == intersects[0].object.name) {
                this.fireTween(this.selectedPeg, 'lower');
                this.selectedPeg = null;
              }
            } else {
              this.selectedPeg = intersects[0].object;
              this.fireTween(this.selectedPeg, 'raise');
            }
          }
          if (intersects[0].object.name.startsWith('hole')) {
            // TRIGGER
            if (this.selectedPeg != null) {
              this.socket.emit('try-jump', {
                from: this.selectedPeg.name,
                to: intersects[0].object.name,
              });
              this.elThree.removeEventListener('click', this.onLeftClick, true);
            }
          }
        }
      },
      /**
       * Register menu buttons created in v-if
       * @param {element}
       * @memberof MPBattle
       * @instance
       */
      registerButtons(el) {
        for (let row of el.childNodes) {
          for (let child of row.childNodes) {
            if (child.className == 'button-item') {
              this.$parent.registerButton(child);
            }
          }
        }
      },
      /**
       * Click handler.
       * @param {string} mode - Action to perform
       * @memberof MPBattle
       * @instance
       */
      clicked(mode) {
        if (mode == 'menu') {
          this.$router.replace('/');
          this.socket.emit('disconnect');
          this.socket.emit('logout');
        }
      },
    },
    data() {
      return {
        // UI VARIABLES
        loading: 0,
        // GAME VARIABLES
        gameData: null,
        state: GameState.LOADING,
        turn: GameTurns.NONE,
        // THREE VARIABLES
        elThree: null,
        renderer: null,
        scene: null,
        camera: null,
        raycaster: null,
        controls: null,
        lights: {},
        objects: {},
        pegGeometry: null,
        boardData: null,
        boardObjPlayerLocal: null,
        boardObjPlayerOther: null,
        pegsPlayerLocal: null,
        pegsPlayerOther: null,
        // USER INTERACTION VARIABLES
        selectedPeg: null,
        movingPegs: [],
        nameLocal: '',
        nameOther: '',
        pegsRemovedPlayerLocal: -1,
        pegsRemovedPlayerOther: -1,
        possibleJumpsLocal: 1,
        possibleJumpsOther: 1,
      };
    },
    /**
     * Fire when this View is presented
     */
    mounted() {
      // get board data from server
      this.boardData = new Board(this.$parent.selecedGameData);

      this.load();
    },
  };

</script>

<template>

  <div>
    <Veil :progress="loading"
          :total="28"
          @veil-closed="sendClientReady" />

    <div id="ui">
      <transition name="ui-fade"
                  mode="out-in"
                  @before-enter="registerButtons">
        <div v-if="state=='PLAYING'"
             key="PLAYING"
             class="ui-box">
          <div class="row info">
            <div class="bar local"
                 :style="`flex-grow:${possibleJumpsLocal};`"></div>
            <div class="bar other"
                 :style="`flex-grow:${possibleJumpsOther};`"></div>
          </div>
          <div v-if="turn>=0"
               class="row info">
            <h3>{{currentTurn}}'s turn</h3>
          </div>
        </div>
        <div v-else-if="state=='WIN'"
             key="WIN"
             class="ui-box cheer"
             style="text-shadow: 0 0 0.75em rgba(255,255,255,0.8);">
          <h1>Victory!</h1>
          <div class="row info-win">
            <h3 style="font-weight:500;">{{nameOther}}</h3>
            <span>has been defeated!</span>
          </div>
          <div class="row">
            <div @click="clicked('menu')"
                 class="button-item">
              Main Menu
            </div>
          </div>
        </div>
        <div v-else-if="state=='LOSE'"
             key="LOSE"
             class="ui-box cheer"
             style="text-shadow: 0 0 5em rgba(0,0,0,1);">
          <h1>Defeat</h1>
          <div class="row info-lose">
            <span>You have fallen to</span>
            <h3 style="font-weight:500;">{{nameOther}}</h3>
          </div>
          <div class="row">
            <div @click="clicked('menu')"
                 class="button-item">
              Main Menu
            </div>
          </div>
        </div>
      </transition>
    </div>
    <div id="game-screen">

    </div>
  </div>

</template>

<style src="@/css/battle.css" scoped>

</style>
