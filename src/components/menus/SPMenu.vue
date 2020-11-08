<script>
// SINGLE PLAYER MENU COMPONENT

  // COMPONENTS
  import ButtonConfirm from '@/components/ui/ButtonConfirm.vue';

  // MY LIBRARIES
  import { BoardVariants, PegVariants, RoomVariants } from '@/js/GameResources.js';

  // EXTERNAL LIBRARIES
  import { gsap } from 'gsap';

  /**
   * Enum for the SP menu.
   * @readonly
   * @enum {number}
   */
  const SPMenuState = {
    /** @type {number} */
    BOARD: 0,
    /** @type {number} */
    PEG: 1,
    /** @type {number} */
    ROOM: 2,
    /** @type {number} */
    CONFIRM: 3,
  };

  /**
   * Vue.js Component: Single Player Menu
   * @property {SPMenuState} states - SP states reference
   * @property {SPMenuState} option - Current state
   * @property {number} galleryPage - Current gallery page
   * @property {number} galleryLens - Lengths of all generated galleries
   * @property {Object} selected - Currently selected item
   * @property {Object} CHOSEN - Output payload
   */
  export default {
    name: 'SPMenu',
    components: {
      ButtonConfirm,
    },
    methods: {
      /**
       * Change SPMenu state
       * @param {SPMenuState} target - target State
       * @memberof SPMenu
       * @instance
       */
      changeState( target ) {
        this.option = target;
      },
      /**
       * Back button handler
       * @param {Event} e - Click event
       * @memberof SPMenu
       * @instance
       */
      clicked( e ) {
        if ( this.option > 0 ) {
          this.changeState( this.option - 1 );
        } else {
          this.$emit( 'state-change', e.target.dataset.purpose );
        }
      },
      /**
       * Confirm button handler
       * @memberof SPMenu
       * @instance
       */
      confirm() {
        if ( this.selected == -1 ) {
          return;
        }
        let chosen = this.selected;
        this.selected = -1;
        switch ( this.option ) {
        case SPMenuState.BOARD:
          this.CHOSEN.board = this.layouts[ chosen ];
          this.changeState( SPMenuState.PEG );
          break;
        case SPMenuState.PEG:
          this.CHOSEN.peg = this.pegs[ chosen ];
          this.changeState( SPMenuState.ROOM );
          break;
        case SPMenuState.ROOM:
          this.CHOSEN.room = this.rooms[ chosen ];
          this.changeState( SPMenuState.CONFIRM );
          this.selected = 1;
          break;
        case SPMenuState.CONFIRM:
          for ( let data in this.CHOSEN ) {
            if ( this.CHOSEN[ data ] == null ) {
              return;
            }
          }
          this.$emit( "start-sp", this.CHOSEN );
          break;
        default:
        }
        this.galleryPage = 0;
      },
      /**
       * Gallery item selction handler
       * @param {Object} item - Selected object
       * @memberof SPMenu
       * @instance
       */
      selectGalleryItem( item ) {
        this.selected = this.selected == item ? -1 : item;
      },
      /**
       * Generate 2x2 2d array for gallery
       * @param {Object} obj - Object to be gallerized
       * @memberof SPMenu
       * @instance
       */
      gallerize( obj ) {
        let keys = Object.keys( obj );
        let rows = [];
        this.galleryLens[ this.option ] = Math.ceil( keys.length / 4 );
        while ( keys.length && rows.length < 2 ) {
          rows.push( keys.splice( 4 * this.galleryPage, 2 ) );
        }
        return rows;
      },
    },
    computed: {
      /**
       * Reference to Menu states
       * @memberof SPMenu
       * @instance
       */
      MainMenuState() {
        return this.$parent.states;
      },
      /**
       * Gallery rows for layouts
       * @return {Object[]} Prepared layouts
       * @memberof SPMenu
       * @instance
       */
      layoutGalleryRows() {
        return this.gallerize( this.layouts );
      },
      /**
       * Gallery rows for pegs
       * @return {Object[]} Prepared pegs
       * @memberof SPMenu
       * @instance
       */
      pegGalleryRows() {
        return this.gallerize( this.pegs );
      },
      /**
       * Gallery rows for rooms
       * @return {Object[]} Prepared rooms
       * @memberof SPMenu
       * @instance
       */
      roomGalleryRows() {
        return this.gallerize( this.rooms );
      },
      /**
       * Number of items in current gallery
       * @return {number} Count of gallery items
       * @memberof SPMenu
       * @instance
       */
      galleryLen() {
        return this.galleryLens[ this.option ];
      }
    },
    data() {
      return {
        states: SPMenuState,
        option: SPMenuState.BOARD,
        layouts: BoardVariants,
        pegs: PegVariants,
        rooms: RoomVariants,
        galleryPage: 0,
        galleryLens: {},
        selected: -1,
        CHOSEN: { board: null, peg: null, room: null },
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
    },
  };
</script>

<template>
<div class="sp-menu fullscreen">
    <div class="box title">
      <h2>freeplay</h2>
    </div>
    <transition name="menu-transition"
                tag="div"
                mode="out-in"
                appear>
      <div v-if="option==states.BOARD"
           class="sp-menu-page"
           key="BOARD">
        <h3>choose your board:</h3>
        <div class="box flex-gallery">
          <!-- BUILD GALLERY -->
          <div v-for="row in layoutGalleryRows"
               :key="row.toString()"
               class="flex-gallery-row">
            <div v-for="lout in row"
                 :key="lout"
                 :class="`box gallery-item ${lout==selected?'selected':''}`"
                 @click="selectGalleryItem(lout)">
              <!-- DISPLAY BOARD SHAPE -->
              <div v-for="y in layouts[lout].height"
                   :key="y"
                   class="spot flex-gallery-row">
                <div v-for="x in layouts[lout].width"
                     :class="`spot s${layouts[lout].shape[y-1][x-1]}`"
                     :key="x+(y*layouts[lout].width)">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="option==states.PEG"
           class="sp-menu-page"
           key="PEG">
        <h3>choose your peg style:</h3>
        <div class="box flex-gallery">
          <!-- BUILD GALLERY -->
          <div v-for="row in pegGalleryRows"
               :key="row.toString()"
               class="flex-gallery-row">
            <div v-for="peg in row"
                 :key="peg"
                 :class="`box gallery-item ${peg==selected?'selected':''}`"
                 @click="selectGalleryItem(peg)">
              <!-- DISPLAY PEG -->
              <h6>{{pegs[peg].name}}</h6>
            </div>
          </div>
        </div>
      </div>
      <div v-if="option==states.ROOM"
           class="sp-menu-page"
           key="ROOM">
        <h3>choose the environment:</h3>
        <div class="box flex-gallery">
          <!-- BUILD GALLERY -->
          <div v-for="row in roomGalleryRows"
               :key="row.toString()"
               class="flex-gallery-row">
            <div v-for="room in row"
                 :key="room"
                 :class="`box gallery-item ${room==selected?'selected':''}`"
                 @click="selectGalleryItem(room)">
              <!-- DISPLAY ROOM -->
              <h6>{{rooms[room].name}}</h6>
            </div>
          </div>
        </div>
      </div>
    </transition>
    <div class="box button-row gallery-nav">
      <div v-if="galleryPage>0"
           class="box button-item gallery-nav"
           style="left:-3em;"
           @click="galleryPage--">
        -
      </div>
      <div v-if="galleryPage<galleryLen-1"
           class="box button-item gallery-nav"
           style="right:-3em;"
           @click="galleryPage++">
        +
      </div>
    </div>
    <ButtonConfirm @confirm-selection="confirm"
                   :style="`opacity:${selected!=-1?1:0};`" />
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
.sp-menu {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .sp-menu-page {
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

  .sp-menu-page>h3 {
    position: relative;
    top: 1em;
    font-size: 0.6em;
    font-weight: 300;
  }

  .box.flex-gallery>.flex-gallery-row {
    max-height: 50%;
  }

  .box.gallery-item {
    flex-grow: 1;
    max-width: 50%;

    border-radius: 0.5em;
    background-color: rgb(255, 255, 255, 0.5);
    box-shadow: 0 0 1em 0 rgba(0, 0, 0, 0.5);

    justify-content: center;

    transition: all 500ms ease-in-out;
  }

  .box.gallery-item.selected {
    border-color: rgb(99, 139, 106);
    box-shadow: 0 0 1em 0.125em rgba(99, 106, 139, 0.5);
    background-color: rgba(152, 169, 255, 0.5);
  }

  .box.gallery-item:hover {
    transform: scale(1.1);
  }

  /* BOARD PREVIEW */
  .spot {
    pointer-events: none;
  }

  .spot>.spot {
    flex-grow: 1;
  }

  .spot.s0 {
    background-color: rgba(0, 0, 0, 0);
  }

  .spot.s1 {
    background-color: rgba(0, 0, 0, 0.25);
  }

  .spot.s2 {
    background-color: rgba(0, 255, 0, 0.25);
  }

  /* GALLERY NAV BUTTONS */
  .button-row.gallery-nav {
    margin: 0 auto;
    height: 0;
  }

  .button-item.gallery-nav {
    position: relative;
    width: 1.125em;
    height: 1.125em;
    top: -1.5em;

    line-height: 1.125em;

    background-color: rgba(0, 0, 0, 0.5);
  }
</style>
