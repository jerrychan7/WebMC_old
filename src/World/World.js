
import blocks from "../Blocks/blocks.js";
import Player from "../Entity/Player.js";
import {asyncLoadResByUrl} from "../loadResources.js";
//blocks.initBlocksByDefault();

let config = {
    size: { x: 2, y: 2, z: 2 },
    terrain_type: "flat"
};

asyncLoadResByUrl("src/World/world_config.json")
.then(cfg => {
    config = cfg;
});

export default class World {
    constructor() {
        this.allBlock = null;
        console.log(this);
        this.sizeX = config.size.x * 16;
        this.sizeY = config.size.y * 16;
        this.sizeZ = config.size.z * 16;
        this.initAllBlock();
        switch (config.terrain_type) {
            case "flat":
            default:
                this.createFlatWorld();
        }
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
