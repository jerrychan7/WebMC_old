
import blocks from "/src/Blocks/blocks.js";
import Player from "/src/Entity/Player.js";
//blocks.initBlocksByDefault();

export default class World {
    constructor() {
        this.allBlock = null;
        this.sizeX = 32;
        this.sizeY = 32;
        this.sizeZ = 32;
        this.initAllBlock();
        this.createFlatWorld();
        this.mainPlayer = new Player();
        this.mainPlayer.setWorld(this);
        this.mainPlayer.x = this.sizeX/2;
        this.mainPlayer.y = this.sizeY/2+5;
        this.mainPlayer.z = this.sizeZ/2;
    };

    initAllBlock() {
        const {sizeX: x, sizeY: y, sizeZ: z} = this,
              allBlock = this.allBlock = new Array(x);
        for (var i=0; i<x; i++) {
            allBlock[i] = new Array(y);
            for (var j=0; j<y; j++) {
                allBlock[i][j] = new Array(z);
            }
        }
    };

    createFlatWorld() {
        const {sizeX: x, sizeY: y, sizeZ: z} = this;
        for (var i=0; i<x; i++){
            for (var k=0; k<z; k++){
                var j = 0;
                for (var _j=y>>1; j<_j; j++){
                    this.setTile(i, j, k, "stone");
                }
                for (; j<y; j++) {
                    this.setTile(i, j, k, "air");
                }
            }
        }
    };

    setRender(render) {
        this.render = render;
        render.world = this;
    };
    setTile(x, y, z, blockName = "air") {
        this.allBlock[x][y][z] = blocks.getBlockByBlockName(blockName);
    };
    getTile(x, y, z) {
//        x = ~~x; y = ~~y; z = ~~z;
        x = Math.round(x); y = Math.round(y); z = Math.round(z);
        if (x>=this.sizeX || y>=this.sizeY || z>=this.sizeZ || x<0 || y<0 || z<0)
            return blocks.getBlockByBlockName("air");
        return this.allBlock[x][y][z];
    };
}
