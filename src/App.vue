<script>
// MAIN APP VUE COMPONENT
  import {
    gsap
  } from 'gsap';
  import * as io from 'socket.io-client';

  /**
   * Vue.js App Component
   * @property {Object} selecedGameData - Data loaded in menu, then gotten by the created game
   * @property {Object} persistentData - Loaded data stored in user's local storage
   */
  export default {
    name: 'App',
    computed: {
      selecedGameData() {
        return this.gameData;
      }
    },
    methods: {
      /**
       * Start SP standard handler
       * @param {Object} payload - Game data to store
       * @memberof App
       * @instance
       */
      startSP( payload ) {
        this.gameData = payload;
        if ( this.$route.path == "/standard/freeplay" ) {
          this.$router.go( -1 );
        }
        setTimeout( function () {
          this.$router.push( '/standard/freeplay' )
        }.bind( this ), 500 )
        console.log( 'STARTING SINGLE PLAYER GAME' );
      },
      /**
       * Start MP battle handler
       * @param {Object} payload - Game data to store
       * @memberof App
       * @instance
       */
      startMP( payload ) {
        this.gameData = payload;
        setTimeout( function () {
          this.$router.push( '/multinoble/play' )
        }.bind( this ), 500 )
        console.log( 'STARTING ONLINE MULTIPLAYER GAME' );
      },
      /**
       * Store persistent data
       * @param {Object} payload - Keys: target var, call
       * @memberof App
       * @instance
       */
      storeData( payload ) {
        if ( payload.data == 'increment' ) {
          localStorage[ payload.target ] = Number( localStorage[ payload.target ] ) + 1;
        } else {
          localStorage[ payload.target ] = payload.data;
        }
      },
      /**
       * Establish/Confirm connection to MP server
       * @returns {boolean} - If connection successful
       * @memberof App
       * @instance
       */
      async connectToServer() {
        if ( this.socket && this.socket.connected ) {
          this.socket.close();
        }

        let sock = "https://solo-noble-server.glitch.me/";
        // let sock = "127.0.0.1:3000";

        var attempts = 0;
        var socket = io( sock );
        await new Promise( ( res ) => setTimeout( res, 1000 ) );
        while ( socket.disconnected && attempts < 5 ) {
          socket = io( sock );
          attempts++;
          console.log( `Connecting to: ${sock}` );
          await new Promise( ( res ) => setTimeout( res, 2000 ) );
        }
        if ( socket.disconnected ) {
          return false;
        }

        this.socket = socket;
        this.socket.on("error",(e)=>{
          window.alert(`Error: ${e}`);
          this.$router.replace("/");
        })
        console.log( "Connection to MP server established" );
        return true;
      },

      /**
       * Assign hover tweens to buttons
       * @param {element} button - Type of game to start
       * @memberof App
       * @instance
       */
      registerButton( button ) {
        // hover in
        button.addEventListener( 'mouseover', el =>
          gsap.to( el.target, {
            duration: 0.5,
            scale: 1,
            boxShadow: '0 0 2em -0.5em rgba(0, 0, 0, 0.5)',
            ease: 'elastic.out(1, 0.5)',
            overwrite: true,
          } ),
        );

        // hover out
        button.addEventListener( 'mouseleave', el =>
          gsap.to( el.target, {
            duration: 0.35,
            scale: 0.8,
            boxShadow: '0 0 0.25em 0em rgba(0, 0, 0, 0.5)',
            ease: 'elastic.out(1, 0.5)',
            overwrite: true,
          } ),
        );
      },
    },
    data() {
      return {
        // GAME DATAS
        gameData: null,
        persistentData: {},
        socket: null,
      };
    },
    /**
     * Fire when this View is presented
     */
    mounted() {
      let persistentVars = [ 'SPgamesPlayed', 'SPgamesWon', 'SPjumpsMade', 'SPfastestWin' ];
      for ( let varName of persistentVars ) {
        if ( !( localStorage[ varName ] ) ) {
          localStorage[ varName ] = 0;
        }
        this.persistentData[ varName ] = localStorage[ varName ];
      }
      //this.connectToServer();
    },
  };
</script>

<template>
<div id="app"
       class="fullscreen">
    <router-view @start-sp="startSP"
                 @start-mp="startMP"
                 @store-data="storeData" />
  </div>
</template>

<style src="@/css/style.css"> </style>
