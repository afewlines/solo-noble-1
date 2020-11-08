<script>
// STATISTICS MENU COMPONENT

  /**
   * Vue.js Component: Statistics Menu
   */
  export default {
    name: 'StatisticsMenu',
    methods: {
      /**
       * Click handler.
       * @memberof StatisticsMenu
       * @instance
       */
      clicked( e ) {
        this.$emit( 'state-change', e.target.dataset.purpose );
      },
    },
    computed: {
      /**
       * Reference to Menu states
       * @memberof StatisticsMenu
       * @instance
       */
      states() {
        return this.$parent.states;
      },
      gamesPlayed() {
        return Number( localStorage.SPgamesPlayed );
      },
      gamesWon() {
        return Number( localStorage.SPgamesWon );
      },
      gamesLost() {
        return this.gamesPlayed - this.gamesWon;
      },
      gameWinRatio() {
        return `${(this.gamesWon / this.gamesPlayed).toFixed(2)}%`;
      },
      fastestWin() {
        let t = ( Number( localStorage.SPfastestWin ) / 1000 )
          .toFixed( 0 );
        return `${Math.floor(t/60)}:${String(t%60).padStart(2,0)}`;
      },
      pegsJumped() {
        return Number( localStorage.SPjumpsMade );
      },
      pegsJumpedAvg() {
        return ( this.pegsJumped / this.gamesPlayed )
          .toFixed( 2 );
      },
    },
    /**
     * Fire when this Component is presented
     */
    mounted() {
      // set button hover anims
      for ( let button of document.getElementsByClassName( 'button-item' ) ) {
        this.$parent.$parent.registerButton( button );
      }
    },
  };
</script>

<template>
<div class="statistics-menu fullscreen">
    <div class="box title">
      <h2>freeplay statistics</h2>
    </div>
    <div class="stats-menu-page">
      <div class="flex-gallery">
        <div class="flex-gallery-row">
          <h3>Games Played</h3>
          <span> {{gamesPlayed}} </span>
        </div>
        <div class="flex-gallery-row">
          <h3>Wins</h3>
          <span> {{gamesWon}} </span>
        </div>
        <div class="flex-gallery-row">
          <h3>Losses</h3>
          <span> {{gamesLost}} </span>
        </div>
        <div class="flex-gallery-row">
          <h3>Win Ratio</h3>
          <span> {{gameWinRatio}} </span>
        </div>
        <div class="flex-gallery-row">
          <h3>Fastest Win</h3>
          <span> {{fastestWin}} </span>
        </div>
        <div class="flex-gallery-row">
          <h3>Pegs Jumped</h3>
          <span> {{pegsJumped}} </span>
        </div>
        <div class="flex-gallery-row">
          <h3>Average Pegs Jumped per Game</h3>
          <span> {{pegsJumpedAvg}} </span>
        </div>
      </div>
    </div>
    <div class="box button-row">
      <div :data-purpose="states.MAIN"
           class="box button-item back"
           @click="clicked">
        Back
      </div>
    </div>
  </div>
</template>

<style scoped>
.statistics-menu {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .stats-menu-page {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  /* TITLE FORMATTING */
  .box.title {
    flex-grow: 0;
    text-shadow: 0 0 0.5em rgba(0, 0, 0, 0.5);
  }

  .box.title>h2 {
    font-weight: 300;
  }

  .flex-gallery {
    height: max-content;
    padding: 1em;
  }

  .flex-gallery-row {
    justify-content: center;
    align-items: center;
    flex-grow: 0;
    padding: 0.125em 0.125em;
  }

  .flex-gallery-row>h3 {
    height: 1em;
    font-size: 0.5em;
  }

  .flex-gallery-row>span {
    height: 1em;
    font-size: 0.5em;
    flex-grow: 1;
    text-align: right;
  }
</style>
