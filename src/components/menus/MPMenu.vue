<script>
// SINGLE PLAYER MENU COMPONENT

  // COMPONENTS
  //import ButtonConfirm from '@/components/ui/ButtonConfirm.vue';

  // MY LIBRARIES
  import {
    BoardVariants,
    PegVariants,
    RoomVariants,
  } from '@/js/GameResources.js';

  // EXTERNAL LIBRARIES
  import {
    gsap
  } from 'gsap';

  /**
   * Enum for the MP menu.
   * @readonly
   * @enum {number}
   */
  const MPMenuState = {
    /** @type {number} */
    LOGIN: 0,
    /** @type {number} */
    MATCHMAKING: 1,
    /** @type {number} */
    FOUND: 2,
  };

  /**
   * Vue.js Component: Single Player Menu
   * @property {MPMenuState} states - MP states reference
   * @property {MPMenuState} option - Current state
   * @property {number} galleryPage - Current gallery page
   * @property {number} galleryLens - Lengths of all generated galleries
   * @property {Object} selected - Currently selected item
   * @property {Object} CHOSEN - Output payload
   */
  export default {
    name: 'MPMenu',
    components: {},
    methods: {
      /**
       * Change MPMenu state
       * @param {MPMenuState} target - target State
       * @memberof MPMenu
       * @instance
       */
      changeState( target ) {
        this.option = target;
      },
      /**
       * Back button handler
       * @param {Event} e - Click event
       * @memberof MPMenu
       * @instance
       */
      clicked( e ) {
        if ( this.option > 0 ) {
          if(this.socket){
            this.socket.emit( "mm-exit" );  
          }
          this.changeState( this.states.LOGIN );
        } else {
          if(this.socket){
            this.socket.emit( "logout" );  
          }
          this.$emit( 'state-change', e.target.dataset.purpose );
        }
      },
      /**
       * Attempt to login
       * @memberof MPMenu
       * @param {Object} e - captured submit event
       * @instance
       */
      async login( e ) {
        for (let i = 0; i < e.target.length; i++) {
          e.target[i].disabled = true;
        }

        // WAIT FOR CONNECTION
        let conn = await this.$parent.$parent.connectToServer();

        if ( !conn ) {
          window.alert( "Could not establish connection with multiplayer servers.\nPlease try again later." );
          this.$router.go( '/' )
        } else {
          localStorage.username = this.username;
          this.socket.on("login-attempt", ( res ) => {
            // check if username is okay or not
            if ( res ) {
              this.socket.emit( "mm-enter" );
              this.option = this.states.MATCHMAKING;
            } else {
              window.alert( "Username already taken." )
              this.username = "";
              for (let i = 0; i < e.target.length; i++) {
                e.target[i].disabled = false;
              }
            }
          });
          this.socket.on("game-found", () => {
            this.changeState(MPMenuState.FOUND);
            this.socket.off('game-found');
          });
          this.socket.on("game-start", (data) => {
            this.$emit("start-mp", data);
            this.socket.off('game-start');
          });
          this.socket.emit("login", this.username);
        }
      }
    },
    computed: {
      /**
       * Reference to Menu states
       * @memberof MPMenu
       * @instance
       */
      MainMenuState() {
        return this.$parent.states;
      },
      /**
       * Reference to socket
       * @memberof MPMenu
       * @instance
       */
      socket() {
        return this.$parent.$parent.socket;
      }
    },
    data() {
      return {
        states: MPMenuState,
        option: MPMenuState.LOGIN,
        username: '',
        selected: -1,
      };
    },
    /**
     * Fire when this Component is presented
     */
    mounted() {
      // set button hover anims
      for ( let button of document.getElementsByClassName( 'button-item' ) ) {
        this.$parent.$parent.registerButton( button );
      }

      if ( localStorage[ 'username' ] ) {
        this.username = localStorage.username;
      }
    },
  };
</script>

<template>
<div class="mp-menu fullscreen">
    <div class="box title">
      <h2>multi, noble</h2>
      <h6>vs multiplayer</h6>
    </div>
    <transition name="menu-transition"
                tag="div"
                mode="out-in"
                appear>
      <div v-if="option==states.LOGIN"
           class="mp-menu-page"
           key="BOARD">
        <h3>enter your username</h3>
        <div class="box panel">
          <form @submit.prevent="login">
            <input type="text"
                   name="username"
                   v-model="username"
                   minlength="1"
                   maxlength="16"
                   pattern="^[\w\d!@#$%^*(),<.>?;:|+= \[\]-]*$">
            <br>
            <input type="submit"
                   value="Find a Game"
                   style="font-size: 0.75em;">
          </form>
        </div>
      </div>
      <div v-if="option==states.MATCHMAKING"
           class="mp-menu-page"
           key="BOARD">
        <h3>matchmaking</h3>
        <div class="box panel">
          <h2 class="loading">finding an opponent</h2>
        </div>
      </div>
      <div v-if="option==states.FOUND"
           class="mp-menu-page"
           key="BOARD">
        <h3>matchmaking</h3>
        <div class="box panel">
          <h2 class="">game found!</h2>
          <div :data-purpose="MainMenuState.MAIN"
               class="box button-item"
               @click="()=>socket.emit('game-enter', username)">
            Enter Game
          </div>
        </div>
      </div>
    </transition>
    <div class="box button-row back">
      <div :data-purpose="MainMenuState.MAIN"
           class="box button-item back"
           @click="clicked">
        Back
      </div>
    </div>
  </div>
</template>


<style scoped>
/* STRUCTURAL FORMATTING */
  .mp-menu {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .mp-menu-page {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .menu-transition-enter-active {
    transition: opacity 2000ms ease;
  }

  .menu-transition-leave-active {
    transition: opacity 500ms ease;
  }

  .menu-transition-enter,
  .menu-transition-leave-to {
    opacity: 0;
  }

  /* TITLE FORMATTING */
  .box.title {
    flex-grow: 0;
    text-shadow: 0 0 0.5em rgba(0, 0, 0, 0.5);
  }

  .box.title>h2 {
    font-weight: 300;
  }

  .box.title>h6 {
    position: relative;
    font-weight: 300;
    font-size: 0.5em;
    font-style: italic;
    top: -12.5%;
  }

  .mp-menu-page>h3 {
    position: relative;
    top: 2.5em;
    font-size: 0.6em;
    font-weight: 300;
  }

  /* PANEL FORMATTING */
  .box.panel {
    max-width: 24em;
    margin: auto;
    padding: 2em 1em 1em;
    display: flex;
    flex-grow: 0;
    flex-direction: column;
    justify-content: center;
    background-color: rgba(255, 255, 255, 0.25);
    border: 0.125em solid rgb(255, 255, 255);
    border-radius: 0.5em;
    box-shadow: 0 0 0.25em 0 rgba(0, 0, 0, 0.5);
    transition: all 1s ease-in-out;
  }

  /* INPUT FORMATTING */
  input {
    border: none;
    outline: none;

    margin: 0.6em 0em;
    color: rgb(255, 255, 255);
    text-align: center;

    filter: drop-shadow(0 0 1em rgb(0, 0, 0));
    transition: all 1s;
  }

  input[type="text"] {
    background: none;
    padding: 0;
    font: 1.25em Cardo;
    width: 9.5em;
  }

  input[type="submit"] {
    padding: 0.5em;
    color: rgb(50, 50, 50);
    filter: drop-shadow(0 0 0 rgb(0, 0, 0));
  }

  input:focus {
    /* box-shadow:0 0 0.5em 0.125em rgba(0, 0, 0, 0.35); */
    filter: drop-shadow(0 0 0.5em rgb(255, 255, 255));
  }

  /* LOADING OBJECT ANIMATION */
  .loading {
    background: linear-gradient(90deg, grey, 40%, white 50%, 60%, grey);
    background-clip: text;
    color: transparent;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: loadingWave 8s ease-in-out infinite;
  }

  @keyframes loadingWave {
    0% {
      background-position: -30vw;
    }

    50% {
      background-position: 30vw;
    }

    100% {
      background-position: -30vw;
    }
  }
</style>
