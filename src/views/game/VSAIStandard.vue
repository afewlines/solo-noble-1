<script>
// EXTERNAL LIBRARIES
  import * as THREE from 'three';
  import { gsap } from 'gsap';

  // MY COMPONENTS
  import Veil from '@/components/ui/Veil.vue';

  // MY LIBRARIES
  import { GameState, GameTurns, VersusAIStandard } from '@/js/MPGameClasses.js';
  import { THREEx } from '@/js/ExtraThree.js';
  import { CustomMaterials } from '@/js/Materials.js';

  // INITIALIZATIONS
  const LOADER_TEXTURE = new THREE.TextureLoader();

  /**
   * Tween factory
   */
  const TWEENING = {
    /**
     * Raise object.
     * Used for selecting Peg.
     * @param {Object} target - Object to modify
     */
    raise( target ) {
      return [ target.position, {
        duration: 1.15,
        y: 2,
        ease: 'elastic.out(1, 0.5)',
        overwrite: true,
      } ];
    },
    /**
     * Lower object.
     * Used for deselecting Peg.
     * @param {Object} target - Object to modify
     */
    lower( target ) {
      return [ target.position, {
        duration: 0.5,
        y: 0.5,
        ease: 'power4.out',
        overwrite: true,
      } ];
    },
    /**
     * Move object, unblock using callback at end.
     * Used to move a jumping Peg to new hole.
     * @param {Object} target - Object to modify
     * @param {Object} position - Position to move to
     * @param {function} callback - Callback to unblock object
     */
    moveAndBlock( target, position, callback ) {
      return [ target.position, {
        duration: 0.5,
        x: position.x,
        z: position.z,
        ease: 'power3.inOut',
        onComplete: callback,
      }, ];
    },
    /**
     * Lower object, do not override last tween.
     * Used to lower a jumping Peg into new hole.
     * @param {Object} target - Object to modify
     */
    lowerSafe( target ) {
      return [ target.position, {
        duration: 0.5,
        y: 0.5,
        ease: 'power4.out',
      } ];
    },
    /**
     * Move object slowly.
     * Used for removing jumped Peg.
     * @param {Object} target - Object to modify
     * @param {Object} position - Position to move to
     */
    moveSlow( target, position ) {
      return [ target.position, {
        duration: 3.5,
        x: position.x,
        z: position.z,
        ease: 'power2.inOut',
      }, ];
    },
    /**
     * Raise object, safe.
     * Used for removing jumped Peg.
     * @param {Object} target - Object to modify
     */
    doomedUp( target ) {
      return [ target.position, {
        duration: 1.5,
        y: 2,
        ease: 'power4.out',
      }, ];
    },
    /**
     * Lower object, safe, to y=0.
     * Used for removing jumped Peg.
     * @param {Object} target - Object to modify
     */
    doomedDown( target ) {
      return [ target.position, {
        duration: 1.5,
        delay: 2,
        y: -0.05,
        ease: 'power4.in',
      }, ];
    },
  };

  /**
   * Vue.js View: Standard Versus AI Game
   * @property {number} loading - Loading completion, arbitrary weights
   * @property {Object} gameData - Game data from App
   * @property {VersusAIStandard} game - Game logic
   * @property {number} turn - Current turn of game
   * @property {element} elThree - Element for Three.js
   * @property {Object3D} selectedPeg - Currently selected Peg (PlayeR)
   * @property {string[]} movingPegs - List of IDs of Pegs currently in motion
   */
  export default {
    name: 'VSAIStandard',
    components: {
      Veil
    },
    computed: {
      /**
       * Get/Set current game state
       * @param {GameState}
       * @memberof VSAIStandard
       * @instance
       */
      state: {
        get: function () {
          return this.game == null ? null : this.game.state;
        },
        set: function ( x ) {
          this.game.state = x;
        }
      },
    },
    methods: {
      /**
       * Asynchronous loading function.
       * Loads: three.js environment, game class, board/peg layout, three.js meshes
       * @memberof VSAIStandard
       * @instance
       */
      async load() {
        // wait a sec
        await new Promise( ( res ) => setTimeout( res, 1000 ) );

        // init three.js
        this.elThree = document.getElementById( 'game-screen' );
        let loaded = THREEx.loadThree( this.elThree );
        for ( let item in loaded ) {
          if ( this[ item ] == null ) {
            this[ item ] = loaded[ item ];
          }

        }
        this.loading += 4;

        // make game logic class
        this.game = new VersusAIStandard( this.gameData );
        this.loading += 4;

        // adjust window on resize
        window.addEventListener( 'resize',
          function ( load ) {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();

            this.renderer.setSize( window.innerWidth, window.innerHeight );

          }.bind( this ),
          false );
        this.loading += 1;

        // load peg
        await new Promise( ( res ) => this.game.loadPegData( res ) );
        this.loading += 4;

        // load board
        await new Promise( ( res, rej ) => this.game.loadBoardData( res, rej ) );
        this.loading += 9;

        // init scene
        // TODO update to build environment
        // load sky tex
        loaded = await new Promise( ( res, rej ) => LOADER_TEXTURE.load( './sky/skysimple.jpg', res, undefined, rej ) );
        loaded = THREEx.initSimpleScene( this.scene, loaded );
        for ( let item in loaded ) {
          this.objects[ item ] = loaded[ item ];
          this.loading += 1;
        }

        loaded = THREEx.addBoard( this.scene,
          this.game.boardData.geometry,
          CustomMaterials.silver,
          this.game.boardData.spots,
          this.game.pegData.geometry,
          CustomMaterials.gold );
        this.boardObjPlayer = loaded.board;
        this.pegsPlayer = loaded.pegs;
        this.game.pegsTotal = loaded.pegs.length;
        this.boardObjPlayer.translateZ( 5 );
        this.loading += 2;

        loaded = THREEx.addBoard( this.scene,
          this.game.boardData.geometry,
          CustomMaterials.gold,
          this.game.boardData.spots,
          this.game.pegData.geometry,
          CustomMaterials.silver );
        this.boardObjComputer = loaded.board;
        this.pegsComputer = loaded.pegs;
        this.boardObjComputer.translateZ( -8 );
        this.loading += 2;

        // wait a sec
        await new Promise( ( res ) => setTimeout( res, 1000 ) );

        // game is ready, start
        console.log( "Ready" );
        this.state = GameState.READY;
        this.animate();
      },
      /**
       * Initiate Player's turn.
       * @memberof VSAIStandard
       * @instance
       */
      turnPlayer() {
        console.log( "PLAYER TURN" );
        this.elThree.addEventListener( 'click', this.onLeftClick, true );
      },
      /**
       * Initiate Computers's turn, with waits.
       * @memberof VSAIStandard
       * @instance
       */
      async turnComputer() {
        // find jumpable pegs, choose 1
        // find possible jump, choose 1
        console.log( "COMPUTER TURN" );
        let origin = Math.floor( Math.random() * this.game.boardComputer.readyHoles.length );
        origin = this.game.boardComputer.readyHoles[ origin ];

        let pegJump = this.boardObjComputer.getObjectByName( `peg${origin.contents.id%this.game.pegsTotal}` );

        // PEG HAS BEEN SELECTED
        this.fireTween( pegJump, 'raise' );
        await new Promise( resolve => setTimeout( resolve, ( Math.random() * 250 ) + 250 ) );

        // FIND DESTINATION
        let dest = Math.floor( Math.random() * origin.possibleJumps.length );
        dest = origin.possibleJumps[ dest ];
        await new Promise( resolve => setTimeout( resolve, ( Math.random() * 500 ) + 250 ) );

        // JUMP, FIND DOOMED PEG
        let pegDoomed = this.game.tryJump( origin, dest.dest, false );
        pegDoomed = this.boardObjComputer.getObjectByName( `peg${pegDoomed%this.game.pegsTotal}` );

        let moveTo = this.boardObjComputer.getObjectByName( `hole${dest.dest.id}` );
        this.pegsRemovedComputer++;
        this.fireTween(
          pegJump,
          'move', moveTo.position,
          null,
        );
        this.fireTween( pegDoomed, 'removeComputer', null, 0.5, );
        this.stepGame();
      },
      /**
       * Set game state and attach click listeners.
       * @memberof VSAIStandard
       * @instance
       */
      startGame() {
        this.state = GameState.PLAYING;
        this.turn = 0;
        this.turnPlayer();
      },
      /**
       * Observe current state of game, update accordingly.
       * @memberof VSAIStandard
       * @instance
       */
      stepGame() {
        if ( this.state == GameState.PLAYING ) {
          // increase turns played
          this.turn++;

          if ( this.active == GameTurns.PLAYER ) {
            // if player, turn off their clicks, check for end, continue
            this.elThree.removeEventListener( 'click', this.onLeftClick, true );
            if ( this.game.boardPlayer.readyHoles.length < 1 ) {
              this.endGame( this.game.pegsRemainingPlayer <= 1 );
              return;
            }
            this.active = GameTurns.COMPUTER;
            this.turnComputer();
          } else {
            // if comp turn, check for end, continue
            if ( this.game.boardComputer.readyHoles.length < 1 ) {
              this.endGame( this.game.pegsRemainingComputer > 1 );
              return;
            }
            this.active = GameTurns.PLAYER;

            this.turnPlayer( true );
          }
        }
      },
      /**
       * Set state on end
       * @param {boolean} win - If game ended as win or loss
       * @memberof VSAIStandard
       * @instance
       */
      endGame( win ) {
        if ( win ) {
          this.state = GameState.WIN;
        } else {
          this.state = GameState.LOSE;
        }
      },
      /**
       * Three.js render loop.
       * @memberof VSAIStandard
       * @instance
       */
      animate() {
        this.renderer.render( this.scene, this.camera );
        requestAnimationFrame( this.animate );
      },
      /**
       * Apply a series of GSAP tweens to an object.
       * @param {Object} target - Object to modify
       * @param {string} mode - Tween selector
       * @param {Object} arg - Argument to pass to tweens
       * @param {number} sync - Seconds from call to start tweens synced
       * @memberof VSAIStandard
       * @instance
       */
      fireTween( target, mode, arg = null, sync = null ) {
        let queue = [];
        let localTL = gsap.timeline();
        switch ( mode ) {
        case 'raise':
          queue.push( TWEENING.raise( target ) );
          break;
        case 'lower':
          queue.push( TWEENING.lower( target ) );
          break;
        case 'move':
          queue.push( TWEENING.moveAndBlock( target, arg,
            function () {
              this.movingPegs.splice( this.movingPegs.indexOf( target.name ), 1 );
            }.bind( this )
          ) );
          queue.push( TWEENING.lowerSafe( target ) );
          break;
        case 'removePlayer':
          queue.push( TWEENING.doomedUp( target ) );
          queue.push( TWEENING.doomedDown( target ) );
          queue.push( TWEENING.moveSlow(
            target, {
              x: 2 + ( this.game.boardPlayer.width / 2 ),
              z: this.game.pegsRemovedPlayer - ( this.game.pegsTotal / 2 )
            } ) );
          break;
        case 'removeComputer':
          queue.push( TWEENING.doomedUp( target ) );
          queue.push( TWEENING.doomedDown( target ) );
          queue.push( TWEENING.moveSlow(
            target, {
              x: -2 - ( this.game.boardComputer.width / 2 ),
              z: this.game.pegsRemovedComputer - ( this.game.pegsTotal / 2 )
            } ) );
          break;
        default:

        }

        if ( sync == null ) {
          for ( let part of queue ) {
            localTL.to( ...part );
          }
        } else {
          for ( let part of queue ) {
            localTL.to( ...part, localTL.time() + sync );
          }
        }

      },
      /**
       * Main click event handler, main game functionality.
       * @param {Event} event - Event from trigger
       * @memberof VSAIStandard
       * @instance
       */
      onLeftClick( event ) {
        event.preventDefault();
        this.raycaster.setFromCamera( new THREE.Vector2(
          ( event.clientX / window.innerWidth ) * 2 - 1,
          -( event.clientY / window.innerHeight ) * 2 + 1,
        ), this.camera );
        let intersects = this.raycaster.intersectObjects( this.boardObjPlayer.children );

        if ( intersects.length > 0 ) {
          if ( intersects[ 0 ].object.name.startsWith( "peg" ) ) {
            // PEG
            if ( this.movingPegs.includes( intersects[ 0 ].object.name ) ) {
              return;
            }

            if ( this.selectedPeg != null ) {
              if ( this.selectedPeg.name == intersects[ 0 ].object.name ) {
                this.fireTween( this.selectedPeg, 'lower' );
                this.selectedPeg = null;
              }
            } else {
              this.selectedPeg = intersects[ 0 ].object;
              this.fireTween( this.selectedPeg, 'raise' );
            }
          }
          if ( intersects[ 0 ].object.name.startsWith( "hole" ) ) {
            // TRIGGER
            if ( this.selectedPeg != null ) {
              let from = this.game.findHoleOfPeg( this.selectedPeg.name, true );
              let to = this.game.findHoleById( intersects[ 0 ].object.name, true );
              let target = this.game.tryJump( from, to, true );
              if ( target != null ) {
                this.movingPegs.push( this.selectedPeg.name );
                this.fireTween(
                  this.selectedPeg, 'move',
                  intersects[ 0 ].object.position, null,
                );
                this.selectedPeg = null;
                target = this.boardObjPlayer.getObjectByName( `peg${target}` );
                target.name = `removed${target.name}`
                this.fireTween( target, 'removePlayer', null, 0.5, );
                this.$emit( 'store-data', { target: 'SPjumpsMade', data: 'increment' } );
                this.stepGame();
              }
            }
          }
        }

      },
      /**
       * Register menu buttons created in v-if
       * @param {element}
       * @memberof VSAIStandard
       * @instance
       */
      registerButtons( el ) {
        for ( let row of el.childNodes ) {
          for ( let child of row.childNodes ) {
            if ( child.className == "button-item" ) {
              this.$parent.registerButton( child );
            }
          }
        }
      },
      /**
       * Click handler.
       * @param {string} mode - Action to perform
       * @memberof VSAIStandard
       * @instance
       */
      clicked( mode ) {
        if ( mode == "menu" ) {
          this.$router.go( -1 );
        } else if ( mode == "restart" ) {
          this.$router.go( 0 );
        }
      },
    },
    data() {
      return {
        // UI VARIABLES
        loading: 0,
        // GAME VARIABLES
        gameData: null,
        game: null,
        turn: -1,
        active: GameTurns.PLAYER,
        // THREE VARIABLES
        elThree: null,
        renderer: null,
        scene: null,
        camera: null,
        raycaster: null,
        controls: null,
        lights: {},
        objects: {},
        boardObjPlayer: null,
        pegsPlayer: null,
        boardObjComputer: null,
        pegsComputer: null,
        selectedPeg: null,
        movingPegs: [],
      };
    },
    /**
     * Fire when this View is presented
     */
    mounted() {
      this.gameData = this.$parent.selecedGameData;
      if ( this.gameData == null ) {
        this.gameData = {
          board: {
            name: "English",
            height: 7,
            width: 7,
            shape: [
              [ "0", "0", "1", "1", "1", "0", "0" ],
              [ "0", "0", "1", "1", "1", "0", "0" ],
              [ "1", "1", "1", "1", "1", "1", "1" ],
              [ "1", "1", "1", "2", "1", "1", "1" ],
              [ "1", "1", "1", "1", "1", "1", "1" ],
              [ "0", "0", "1", "1", "1", "0", "0" ],
              [ "0", "0", "1", "1", "1", "0", "0" ]
            ]
          },
          peg: {
            name: "Standard",
            image: "",
            path: "./models/Peg2.glb",
          },
          room: {
            name: "Study",
            image: "",
            data: "",
          }
        };
      }

      this.load();
    },
  };
</script>

<template>
<div>
    <Veil :progress="loading"
          :total="28"
          @veil-closed="startGame" />

    <div id="ui">
      <transition name="ui-fade"
                  mode="out-in"
                  @before-enter="registerButtons">
        <div v-if="state=='PLAYING'"
             key="PLAYING"
             class="ui-box">
          <div class="row info">
            <h3>Turn:</h3>
            <span>{{turn}}</span>
          </div>
        </div>
        <div v-else-if="state=='WIN'"
             key="WIN"
             class="ui-box cheer"
             style="text-shadow: 0 0 0.75em rgba(255,255,255,0.8);">
          <h1>Victory!</h1>
          <div class="row info-win">
            <h3>Turns -</h3>
            <span>{{turn}}</span>
          </div>
          <div class="row info-lose">
            <h3>Pegs Remaining -</h3>
            <span>{{game.pegsRemainingPlayer}} of {{game.pegsTotal}}</span>
          </div>
          <div class="row">
            <div @click="clicked('menu')"
                 class="button-item">
              Main Menu
            </div>
            <div @click="clicked('restart')"
                 class="button-item">
              Reset Board
            </div>
          </div>
        </div>
        <div v-else-if="state=='LOSE'"
             key="LOSE"
             class="ui-box cheer"
             style="text-shadow: 0 0 5em rgba(0,0,0,1);">
          <h1>Defeat</h1>
          <div class="row info-lose">
            <h3>Turns -</h3>
            <span>{{turn}}</span>
          </div>
          <div class="row info-lose">
            <h3>Pegs Remaining -</h3>
            <span>{{game.pegsRemainingPlayer}} of {{game.pegsTotal}}</span>
          </div>
          <div class="row">
            <div @click="clicked('menu')"
                 class="button-item">
              Main Menu
            </div>
            <div @click="clicked('restart')"
                 class="button-item">
              Reset Board
            </div>
          </div>
        </div>
      </transition>
    </div>
    <div id="game-screen">

    </div>
  </div>
</template>

<style src="@/css/game.css" scoped>
</style>
