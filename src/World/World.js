
import blocks from "/src/Blocks/blocks.js";
import Player from "/src/Entity/Player.js";
//blocks.initBlocksByDefault();

export default class World {
    constructor() {
        this.allBlock = null;
        this.sizeX = 10;
        this.sizeY = 10;
        this.sizeZ = 10;
        this.initAllBlock();
        this.createFlatWorld();
        this.mainPlayer = new Player();
        this.mainPlayer.x = this.sizeX/2;
        this.mainPlayer.y = this.sizeY;
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
                    this.setTitle(i, j, k, blocks.getBlockByBlockName("stone"));
                }
                for (; j<y; j++) {
                    this.setTitle(i, j, k, blocks.getBlockByBlockName("air"));
                }
            }
        }
    };

    setRender(render) {
        this.render = render;
        render.world = this;
    };
    setTitle(x, y, z, block) {
        this.allBlock[x][y][z] = block;
    };
    getTitle(x, y, z) {
        return this.allBlock[x][y][z];
    };
}
