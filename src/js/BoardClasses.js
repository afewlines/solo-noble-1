import * as THREE from 'three';
import hull from 'hull.js';
const ThreeBSP = require('three-js-csg')(THREE);

/**
 * Custom vector2-like object for boards
 * @property {number} x - x position
 * @property {number} y - y position
 */
class Pos {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  /**
   * Directly set x and y.
   * @param {number} x - any number
   * @param {number} y - any number
   */
  set(x, y) {
    this.x = x;
    this.y = y;
  }

  /**
   * Set this x and y to other x and y.
   * @param {Pos} that - Pos to copy from
   */
  copy(that) {
    this.set(that.x, that.y);
  }

  /**
   * Check if two Pos objects are pointing to the same place.
   * @param {Pos} that - Pos to compare to
   * @return {boolean} Equality
   */
  eq(that) {
    return this.x == that.x && this.y == that.y;
  }

  /**
   * Find index of match in base list.
   * @param {Pos[]} base - List to check
   * @return {number} -1 if not found, else index found
   */
  findIn(base) {
    for (let i = 0; i < base.length; i++) {
      if (this.eq(base[i])) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Check if Pos is a valid position in target board.
   * @param {Board} board - Board to check against
   * @return {boolean} Validity
   */
  isValid(board) {
    if (this.x < 0 || this.y < 0) {
      return false;
    }
    if (this.x >= board.width || this.y >= board.height) {
      return false;
    }
    if (board.shape[this.y][this.x] == '0') {
      return false;
    }
    return true;
  }

  /**
   * Generates 4 points not already present in list
   * @param {Pos[]} base - List to check
   * @return {boolean} Validity
   */
  centeredPoints(base) {
    let corners = [
      new Pos(this.x - 0.5, this.y - 0.5),
      new Pos(this.x - 0.5, this.y + 0.5),
      new Pos(this.x + 0.5, this.y + 0.5),
      new Pos(this.x + 0.5, this.y - 0.5),
    ];
    let out = [];
    for (let i = 0; i < corners.length; i++) {
      if (corners[i].findIn(base) < 0) {
        out.push(corners[i]);
      }
    }
    return out;
  }
}

/**
 * A Peg
 * @property {number} id - ID of Peg
 */
class Peg {
  /**
   * @constructor
   */
  constructor(id) {
    this.id = id;
  }

  /**
   * @type {number}
   */
  static created = 0;
}

/**
 * A hole in the board
 * @property {Pos} pos - simple x, y position
 * @property {Hole[]} arcs - left/up/right/down neighbors
 * @property {Peg} contents - the Peg (or null) currently in
 */
class Hole {
  /**
   * @constructor
   * @param {number} x - Hole x position
   * @param {number} y - Hole y position
   */
  constructor(x, y, id) {
    this.pos = new Pos(x, y);
    this.arcs = [];
    this.contents = null;
    this.id = id;
  }

  /**
   * Does Hole have a peg?
   * @type {boolean}
   */
  get hasContents() {
    return this.contents != null
  }

  /**
   * List of holes that can are a jump away
   * @type {Object[]}
   */
  get fullArcs() {
    let out = [];
    for (let arc of this.arcs) {
      if (arc != null) {
        let dest = arc.getAcrossFrom(this);
        if (dest != null) {
          out.push({ arc: arc, dest: dest });
        }
      }
    }
    return out;
  }

  /**
   * List of holes that can be jumped to from here
   * @type {Object[]}
   */
  get possibleJumps() {
    let out = [];
    for (let fullArc of this.fullArcs) {
      if (fullArc.arc.hasContents && !fullArc.dest.hasContents) {
        out.push(fullArc);
      }
    }
    return out;
  }

  /**
   * Assign new contents
   * @param {Peg} target
   */
  set newContents(target) {
    this.contents = target;
  }

  /**
   * Assign new arcs
   * @param {Hole[]} arcs
   */
  set newArcs(arcs) {
    if (arcs.length != 4) {
      console.log("WARNING: Expected 4 arcs, got " + arcs.length);
    }
    this.arcs = arcs;
  }

  // ---  INSPECTORS  ---
  /**
   * Find the side (of current hole) that is the target Hole
   * @param {Hole} target - Which Hole to find
   * @return {number} Side index if found, else -1
   */
  getSideOf(target) {
    for (let i = 0; i < 4; i++) {
      if (this.arcs[i] == target) {
        return i
      }
    }
    return -1;
  }

  /**
   * Find Hole on opposite side of this Hole, from origin
   * @param {Hole} origin - Hole to get across from
   * @return {Hole} Found Hole
   */
  getAcrossFrom(origin) {
    let spot = this.getSideOf(origin);
    if (spot >= 0) {
      return this.arcs[(spot + 2) % 4];
    }
    return null;
  }

  // most of these were made in preparation for the
  // additional game mode. therefore, they are
  // currently undocumented.
  get isSurrounded() {
    // all sides
    for (let i = 0; i < 4; i++) {
      if (this.arcs[i] == null) {
        return false;
      }
    }
    return true;
  }
  get isEdge() {
    // 3 sides
    let count = 0;
    for (let i = 0; i < 4; i++) {
      count += (this.arcs[i] == null) ? 0 : 1
    }
    return count == 3;
  }
  get isCorner() {
    // 2 adjacent sides
    let hold = false;
    for (let i = 0; i < 4; i++) {
      if ((this.arcs[i] != null) && (this.arcs[(i + 1) % 4] != null)) {
        if (hold) {
          return false
        } else {
          hold = true;
        }
      }
    }
    return hold;
  }
  get isInnerCorner() {
    // 2 adjacent sides
    let hold = false;
    for (let i = 0; i < 4; i++) {
      if ((this.arcs[i] != null) && (this.arcs[(i + 1) % 4] != null)) {
        let side1 = this.arcs[i];
        let side2 = this.arcs[(i + 1) % 4];
        if ((side1.arcs[(i + 1) % 4] == null) && (side2.arcs[i] == null)) {
          if (hold) {
            return false
          } else {
            hold = true;
          }
        }
      }
    }
    return hold;
  }
  get isBridge() {
    // 2 opposite sides
    let hold = false;
    for (let i = 0; i < 2; i++) {
      if ((this.arcs[i] == null) && (this.arcs[i + 2] == null)) {
        if (hold) {
          return false
        } else {
          hold = true;
        }
      }
    }
    return hold;
  }
  get isNub() {
    // 1 sides
    let count = 0;
    for (let i = 0; i < 4; i++) {
      count += (this.arcs[i] == null) ? 0 : 1
    }
    return count == 1;
  }
}

/**
 * A board
 * @property {boards} raw - The raw board object
 * @property {number} height - The height
 * @property {string} width - The width
 * @property {number[][]} shape - The shape (0:nothing,>0:part of board)
 * @property {Hole[][]} holes - Positional list of Holes
 */
class Board {
  /**
   * @constructor
   * @param {boards} brd - The raw board object.
   */
  constructor(brd) {
    this.raw = brd;
    this.height = this.raw.height;
    this.width = this.raw.width;
    this.shape = this.raw.shape;
    this.holes = [];

    //  populate holes
    for (let y = 0; y < this.height; y++) {
      let row = [];
      for (let x = 0; x < this.width; x++) {
        row.push(new Hole(x, y, (this.shape[y][x] > 0) ? (x + (y * this.width)) : -1));
      }
      this.holes.push(row);
    }

    //  assign adj map, contents
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        let h = this.holes[y][x];
        switch (this.shape[y][x]) {
          case '1':
            h.newContents = new Peg(h.id);
            h.newArcs = (this.findNeighbors(y, x));
            break;
          case '2':
            h.newArcs = (this.findNeighbors(y, x));
            break;
          default:

        }
      }
    }
  }

  /**
   * Hole objects in valid spots of the Board
   * @type {Hole[]}
   */
  get validHoles() {
    let out = []
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.holes[y][x].id >= 0) {
          out.push(this.holes[y][x]);
        }
      }
    }
    return out;
  }

  /**
   * Find all Holes from which a move can currently be made
   * @type {Hole[]}
   */
  get readyHoles() {
    let out = [];
    for (let hole of this.validHoles) {
      if (hole.hasContents && hole.possibleJumps.length > 0) {
        out.push(hole);
      }
    }
    return out;
  }

  /**
   * Point cloud of Board
   * @type {Pos[]}
   */
  get points() {
    let out = []
    for (let hole of this.validHoles) {
      out.push(...hole.pos.centeredPoints(out));
    }
    return out;
  }

  /**
   * Generate valid neighbors (arcs) of position on Board
   * @param {number} x - X position
   * @param {number} y - Y position
   * @return {Hole[]} Valid neighbors of position
   */
  findNeighbors(y, x) {
    // calculate which holes are next to which
    // !sides/out is ordered!
    let sides = [
      new Pos(x - 1, y), // left
      new Pos(x, y + 1), // up
      new Pos(x + 1, y), // right
      new Pos(x, y - 1), // down
    ];
    let out = []
    for (let i = 0; i < sides.length; i++) {
      if (!sides[i].isValid(this)) {
        out.push(null);
        continue;
      }
      if (this.shape[sides[i].y][sides[i].x] == '0') {
        //sides[i].set(-1, -1);
        out.push(null);
        continue;
      }
      out.push(this.holes[sides[i].y][sides[i].x]);
    }

    return out;
  }

  /**
   * Find Hole by its ID
   * @param {number} target - ID of target Hole
   * @return {Hole} Found Hole, or null;
   */
  findHoleById(target) {
    for (let hole of this.validHoles) {
      if (hole.id == target) {
        return hole;
      }
    }
    return null;
  }

  /**
   * Find Hole that holds target Peg
   * @param {number} target - ID of Peg to find
   * @return {Hole} Found Hole, or null;
   */
  findHoleOfPeg(target) {
    for (let hole of this.validHoles) {
      if (hole.hasContents && hole.contents.id == target) {
        return hole;
      }
    }
    return null;
  }

  /**
   * Moves jumping Peg, removes jumped Peg
   * @param {Hole} target Hole to remove
   * @param {Hole} from Hole to move Peg from
   * @param {Hole} to Hole to move Peg to
   * @return {Number} ID of Peg jumped, null if none
   */
  jumpPeg(target, from = null, to = null) {

    if (to != null) {
      to.newContents = from.contents;
      if (from != null) {
        from.newContents = null;
      }
    }

    if (target != null) {
      target.newContents = null;
    }
  }

  /**
   * Try to jump a Peg from one Hole to another
   * @param {Hole} from Hole to move Peg from
   * @param {Hole} to Hole to move Peg to
   * @return {Number} ID of Peg jumped, null if none
   */
  jumpFromTo(from, to) {
    if (from.hasContents && !to.hasContents) {
      // if from has peg, to doesn't
      // loop through jump arcs on from
      for (let fullArc of from.possibleJumps) {
        // if we find to, do the jump
        if (fullArc.dest == to) {
          let doomed = fullArc.arc.contents.id;
          this.jumpPeg(fullArc.arc, from, to, );
          return doomed;
        }
      }
    }
    return null;
  }

  /**
   * Construct the three.js geometry for the board
   * Heavy load due to CSG, designed to be server-side later
   * @param {THREE.BufferGeometry} pegGeometry - X position
   * @return {BoardData} Valid neighbors of position
   */
  constructBoard(pegGeometry) {

    // a couple things in one:
    //    get the point cloud of board
    //    get a convex hull of that point cloud
    //    make a shape out of that hull
    //    extrude the shape
    let boardGeometry = new THREE.ExtrudeBufferGeometry(
      new THREE.Shape(hull(this.points, 1, ['.x', '.y'])), {
        depth: 0.75,
        bevelEnabled: true,
        bevelSegments: 1,
        steps: 1,
        bevelSize: 0.075,
        bevelThickness: 0.125,
      }
    );

    // verify the geometry and center it
    boardGeometry.computeBoundingSphere();
    boardGeometry.center();
    boardGeometry.rotateX(Math.PI / 2);

    // generate malliable geometry from board geom
    let boardBSP = new ThreeBSP(
      new THREE.Geometry()
      .fromBufferGeometry(boardGeometry),
    );
    // init peg stamper
    let pegStamper = new THREE.Mesh(
      new THREE.Geometry()
      .fromBufferGeometry(pegGeometry),
    );
    // init carving map
    let pegMaster = new THREE.Geometry();

    // get all holes in board
    let spots = this.validHoles;

    // generate carving map
    for (let i = 0; i < spots.length; i++) {
      let tx = spots[i].pos.x - this.width / 2 + 0.5;
      let ty = spots[i].pos.y - this.height / 2 + 0.5;

      pegStamper.position.set(tx, 0.5, ty);
      pegStamper.updateMatrix();
      pegMaster.merge(pegStamper.geometry, pegStamper.matrix);
      spots[i] = {
        pos: new Pos(tx, ty),
        id: spots[i].hasContents ? spots[i].contents.id : null,
        holeId: spots[i].id,
      };
    }

    // carve the board!
    // most of the holding happens here
    boardBSP = boardBSP.subtract(new ThreeBSP(pegMaster));

    //populate
    return { geometry: boardBSP.toGeometry(), spots: spots }
  }
}

export { Hole, Board };