<script>
// @ is an alias to /src
  import MainMenu from '@/components/menus/MainMenu.vue';
  import StatisticsMenu from '@/components/menus/StatisticsMenu.vue';
  import SPMenu from '@/components/menus/SPMenu.vue';



  /**
   * Enum for the main menu.
   * @readonly
   * @enum {String}
   */
  const MenuState = {
    /** @type {String} */
    MAIN: 'MAIN',
    /** @type {String} */
    RETURN: 'MAIN',
    /** @type {String} */
    SINGLEPLAYER: 'SINGLEPLAYER',
    /** @type {String} */
    MULTIPLAYER: 'MULTIPLAYER',
    /** @type {String} */
    STATISTICS: 'STATISTICS',
  };


  /**
   * Vue.js View: Main Menu
   * @property {MenuState} states - Main Menu states reference
   * @property {MenuState} state - Current state
   */
  export default {
    name: 'Menu',
    components: {
      MainMenu,
      StatisticsMenu,
      SPMenu,
    },
    methods: {
      /**
       * Change Main Menu state
       * @param {Event} e - Click event
       * @memberof Menu
       * @instance
       */
      tryStateChange( target ) {
        if ( target in this.states ) {
          this.state = target;
          if ( target == MenuState.MULTIPLAYER ) {
            this.$router.push( '/standard/vsAI' );
          }
        }
      },
      /**
       * Emit signal to start specified game type
       * @param {string} mode - Type of game to start
       * @param {Object} payload - Game data for game view
       * @memberof Menu
       * @instance
       */
      start( mode, payload ) {
        this.$emit( mode, payload );
      },
    },
    data() {
      return {
        states: MenuState,
        state: MenuState.MAIN,
      };
    },
  };
</script>

<template>
<transition name="menu-transition"
              tag="div"
              mode="out-in"
              appear>

    <MainMenu v-if="state==states.MAIN"
              @state-change="tryStateChange" />
    <SPMenu v-if="state==states.SINGLEPLAYER"
            @state-change="tryStateChange"
            @start-sp="(e)=>start('start-sp', e)" />
    <StatisticsMenu v-if="state==states.STATISTICS"
                    @state-change="tryStateChange" />
  </transition>
</template>

<style src="@/css/menu.css"> </style>
