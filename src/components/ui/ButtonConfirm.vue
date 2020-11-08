<script>
// Confirm Button

  /**
   * Vue.js UI Component: Confirm Button
   */
  export default {
    name: 'ButtonConfirm',
    methods: {
      /**
       * Click handler.
       * @memberof ButtonConfirm
       * @instance
       */
      clicked( e ) {
        this.$emit( 'confirm-selection' );
      },
    },
  };
</script>

<template>
<div class="box button-row">

    <div class="box button-item"
         @click="clicked">
      Confirm
    </div>

  </div>
</template>

<style scoped>
.button-row {
    transition: opacity 250ms ease-in-out;
  }
</style>
