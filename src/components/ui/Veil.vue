<script>
// veil

  /**
   * Vue.js Component: Veil
   * @property {Number} progress - Arbitrary loading position
   * @property {Number} total - Target loading position
   */
  export default {
    name: 'Veil',
    props: { progress: Number, total: Number },
    methods: {
      /**
       * Click handler.
       * @memberof Veil
       * @instance
       */
      clicked() {
        if ( this.progress >= this.total && this.loading ) {
          this.loading = false;
          setTimeout( () => this.$emit( "veil-closed" ), 2000 )
        }
      }
    },
    data() {
      return {
        lastStep: 0,
        loading: true
      }
    }
  };
</script>

<template>
<transition name="veil">
    <div v-if="loading"
         class="veil"
         @click="clicked">
      <h2>{{`loading: ${Math.ceil(100*(progress/total))}%`}}</h2>
      <transition name="veil">
        <h6 v-if="progress>=total">click anywhere to continue</h6>
      </transition>
    </div>
  </transition>
</template>

<style scoped>
/* veil css */
  .base {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 9999;
  }

  .veil {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 9999;

    width: 100vw;
    height: 100vh;

    display: flex;
    flex-direction: column;
    justify-content: center;

    background-color: rgb(50, 50, 50);
    opacity: 1;
    transition: opacity 310ms ease-in-out;
  }

  .veil-leave-active {
    transition: opacity 2s ease-in-out;
    pointer-events: none;
  }

  .veil-enter,
  .veil-leave-to {
    opacity: 0;
  }

  .veil>h2 {
    display: flex;
    margin: 0.5em auto;
  }

  .veil>h6 {
    font-weight: 300;
    display: flex;
    margin: 0.5em auto;
    transition: opacity 310ms ease-in-out;
  }
</style>
