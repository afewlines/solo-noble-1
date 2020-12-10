<script>

  // MAIN MENU COMPONENT

  /**
   * Vue.js Component: Main Menu
   */
  export default {
    name: 'MainMenu',
    methods: {
      /**
       * Click handler.
       * @memberof MainMenu
       * @instance
       */
      clicked(e) {
        this.$emit('state-change', e.target.dataset.purpose);
      },
    },
    computed: {
      /**
       * Reference to Menu states
       * @memberof MainMenu
       * @instance
       */
      states() {
        return this.$parent.states;
      },
    },
    /**
     * Fire when this Component is presented
     */
    mounted() {
      // set button hover anims
      for (let button of document.getElementsByClassName('button-item')) {
        this.$parent.$parent.registerButton(button);
      }

      if (this.$parent.$parent.socket != null) {
        try {
          this.$parent.$parent.socket.emit('logout');
        } finally {
          this.$parent.$parent.socket.close();
        }
      }
    },
  };

</script>

<template>

  <div class="main-menu fullscreen">
    <div class="box title">
      <h6>brad, seeker's</h6>
      <h1>solo, noble</h1>
    </div>
    <div class="box button-row">
      <div :data-purpose="states.SINGLEPLAYER"
           class="box button-item"
           @click="clicked">
        Freeplay
      </div>
      <div :data-purpose="states.VSAI"
           class="box button-item"
           @click="clicked">
        Versus
      </div>
    </div>
    <div class="box button-row">
      <div :data-purpose="states.MULTIPLAYER"
           class="box button-item"
           @click="clicked"
           style="height:2.5em;width:6em;margin:0.25em;font:1.25em Cardo;">
        multi, noble
      </div>
    </div>
    <div class="box button-row">
      <div :data-purpose="states.STATISTICS"
           class="box button-item"
           @click="clicked">
        Statistics
      </div>
    </div>
  </div>

</template>

<style scoped>

  .main-menu {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  /* TITLE FORMATTING */
  .box.title {
    flex-grow: 0;
    text-shadow: 0 0 0.5em rgba(0, 0, 0, 0.5);
  }

  .box.title > h1 {
    font-weight: 400;
    font-size: 3em;
  }

  .box.title > h6 {
    font-weight: 300;
  }

</style>
