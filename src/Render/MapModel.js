
import Block from "../Blocks/Block.js";

export default class Model {
    constructor(gl, world, allRegion) {
        this.gl = gl;
        this.world = world;
        this.needRebuildRegion = new Set();
        this.allRegion = allRegion;
    };
    get needRebuild() {
        return !!this.needRebuildRegion.size;
    };
    getRegionBlockFace(rx, rz) {
        return this.allRegion[rx+','+rz]? this.allRegion[rx+','+rz].blockFace: null;
    };
    getBlockFace(x, y, z) {
        var {sizeX, sizeY, sizeZ} = this.world;
        if (x<0 || y<0 || z<0 || x>=sizeX || y>=sizeY || z>=sizeZ)
            return null;
        var bf = this.getRegionBlockFace(x>>4, z>>4);
        return bf? bf[x%16][y][z%16]: null;
    };
    
    getRegionLightLevel(rx, rz) {
        return this.allRegion[rx+','+rz]? this.allRegion[rx+','+rz].lightLevel: null;
    }
    getBlockLightLevel(x, y, z) {
        const {sizeX, sizeY, sizeZ} = this.world;
        if (x<0 || y<0 || z<0 || x>=sizeX || y>=sizeY || z>=sizeZ)
            return NaN;
        var ll = this.getRegionLightLevel(x>>4, z>>4);
        return ll? ll[x%16][y][z%16]: NaN;
    };
    
    updataRegion(rx, rz) {
        rx *= 1; rz *= 1;
        const regionKey = rx + ',' + rz,
              {sizeX, sizeY, sizeZ} = this.world;
        if (rx>(sizeX>>4) || rz>sizeZ>>4) return;
        var vertexPosition = [], texture = [], color = [];


        var blockFace = this.getRegionBlockFace(rx, rz);
        if (!blockFace) {
            // 第一次构建
            blockFace = new Array(16);
            for (var i=0; i<16; ++i) {
                blockFace[i] = new Array(sizeY);
                for (var j=0; j<sizeY; ++j) {
                    blockFace[i][j] = new Array(16);
                    for (var k=0; k<16; ++k) {
                        blockFace[i][j][k] = {};
                    }
                }
            }
        }

        for (var j=0; j<sizeY; ++j) {
          for (var i=rx<<4,_i=i+16; i<_i; ++i) {
            for (var k=rz<<4,_k=k+16; k<_k; ++k) {
                var block = this.world.getTile(i, j, k);
                if (block.name === "air") continue;
                // 如果周围方块透明 绘制
                switch(block.renderType) {
                case Block.renderType.NORMAL: {
                    var bf = blockFace[i%16][j][k%16];
                    [[i+1,j,k,"x+"], [i-1,j,k,"x-"], [i,j+1,k,"y+"], [i,j-1,k,"y-"], [i,j,k+1,"z+"], [i,j,k-1,"z-"]]
                    .forEach(([x, y, z, key]) => {
                        if (x<0 || z<0 || y<0 || x>=sizeX || z>=sizeX || y>=sizeY ||
                            this.world.getTile(x, y, z).opacity>15)
                            return delete bf[key];
                        var len = block.vertex[key].length,
                            bf2 = bf[key] || {};
                        bf2.pos = block.vertex[key].map((v, ind) => ind%3===0? v+i: ind%3===1? v+j: v+k);
                        bf2.tex = block.texture.uv[key];
                        bf2.col = [...Array(len/3*4)].map((_, ind) =>
                            ind%4 === 3? 1.0: Math.pow(0.9, 16-this.getBlockLightLevel(x, y, z))
//                            ind%4 === 3? 1.0: Math.pow(0.9, 16-this.allRegion[regionKey].lightLevel[x][y][z])
                        );
                        vertexPosition.push(...bf2.pos);
                        texture.push(...bf2.tex);
                        color.push(...bf2.col);
                        bf[key] = bf2;
                    });
                    break;}
                }
            }
          }
        }

        var index = (len => {
                if (!len) return [];
                let base = [0,1,2, 0,2,3], out = [];
                for(let i=0,j=0; i<len; j=++i*4)
                    out.push(...base.map(x => x+j));
                return out;
            })(vertexPosition.length/12),
            reg = this.allRegion[regionKey] = this.allRegion[regionKey] || {};
        reg.pos = this.gl.createVbo(vertexPosition);
        reg.col = this.gl.createVbo(color);
        reg.tex = this.gl.createVbo(texture);
        reg.ibo = this.gl.createIbo(index);
        reg.iboLen = index.length;
        reg.blockFace = blockFace;
//        console.log(regionKey, this.this.allRegion[regionKey].lightLevel);
    };
    updataBlock(bx, by, bz) {
        bx = Math.round(bx); by = Math.round(by); bz = Math.round(bz);
        const {sizeX, sizeY, sizeZ} = this.world;
        if (bx<0 || bx>=sizeX || by<0|| by>=sizeY || bz<0 || bz>=sizeZ)
            return;
        const rx = bx>>4, rz = bz>>4, regionKey = rx +','+ rz;
        if (this.getRegionBlockFace(rx, rz) === null)
            return this.refreshRegionModel(rx, rz);

        var bf = this.getBlockFace(bx, by, bz);
        for (let k in bf) delete bf[k];
        var block = this.world.getTile(bx, by, bz);
        // handle center
        if (block.name !== "air") {
            switch (block.renderType) {
            case Block.renderType.NORMAL: {
                [[bx+1, by, bz, "x+"], [bx-1, by, bz, "x-"],
                 [bx, by+1, bz, "y+"], [bx, by-1, bz, "y-"],
                 [bx, by, bz+1, "z+"], [bx, by, bz-1, "z-"]]
                .forEach(([x, y, z, key]) => {
                    if (x<0 || z<0 || y<0 || x>=sizeX || z>=sizeX || y>=sizeY || this.world.getTile(x, y, z).opacity>15)
                        return;
                    var len = block.vertex[key].length,
                        bf2 = bf[key] || {};
                    bf2.pos = block.vertex[key].map((v, ind) => ind%3===0? v+bx: ind%3===1? v+by: v+bz);
                    bf2.tex = block.texture.uv[key];
                    bf2.col = [...Array(len/3*4)].map((_, ind) =>
//                        Math.pow(0.9, 16-this.getBlockLightLevel(x, y, z))
                        ind%4 === 3? 1.0: Math.pow(0.9, 16-this.getBlockLightLevel(x, y, z))
//                        ind%4 === 3? 1.0: Math.pow(0.9, 16-this.allRegion[regionKey].lightLevel[x][y][z])
                    );
                    bf[key] = bf2;
                });
                break;}
            }
        }
        // handle around
        [[bx+1, by, bz, "x+"], [bx-1, by, bz, "x-"],
         [bx, by+1, bz, "y+"], [bx, by-1, bz, "y-"],
         [bx, by, bz+1, "z+"], [bx, by, bz-1, "z-"]]
        .forEach(([i, j, k, key]) => {
            if (i<0 || j<0 || k<0 || i>=sizeX || j>=sizeY || k>=sizeZ) return;
            const b = this.world.getTile(i, j, k);
            if (b.name === "air") return;
            const fkey =  key[0]+(key[1]==='+'? '-': '+'),
                  bf2 = this.getBlockFace(i, j, k);
            switch (b.renderType) {
            case Block.renderType.NORMAL:{
                if (block.opacity>15 && fkey in bf2) {
                    return delete bf2[fkey];
                }
                else if (block.opacity<16 && !(fkey in bf2)) {
                    var len = b.vertex[fkey].length,
                        cll = this.getBlockLightLevel(bx, by, bz),
//                        cll = this.allRegion[regionKey].lightLevel[bx][by][bz],
                        face = {};
                    face.pos = b.vertex[fkey].map((v, ind) => ind%3===0? v+i: ind%3===1? v+j: v+k);
                    face.tex = b.texture.uv[fkey];
                    face.col = [...Array(len/3*4)].map((_, ind) =>
//                        Math.pow(0.9, 16-cll)
                        ind%4===3? 1.0: Math.pow(0.9, 16-cll)
                    );
                    bf2[fkey] = face;
                }
                break;}
            }
        });
//        this.refreshBlock.blockRerefresh(bx, by, bz);
        [[bx+1, bz], [bx-1, bz], [bx, bz],
         [bx, bz+1], [bx, bz-1]]
        .forEach(([x, z]) => {
            this.needRebuildRegion.add((x>>4) +','+ (z>>4));
        });
    };
    refresh() {
        if (!this.needRebuild) return;
        this.needRebuildRegion.forEach(regionKey => {
            const [rx, rz] = regionKey.split(",").map(r => r*1);
            var vertexPosition = [], color = [], texture = [], bf = this.getRegionBlockFace(rx, rz);
            if (bf === null) return;
            for (var i=0; i<bf.length; ++i) {
              for (var j=0; j<bf[i].length; ++j) {
                for (var k=0; k<bf[i][j].length; ++k) {
                    for (var key in bf[i][j][k]) {
                        var obj = bf[i][j][k][key];
                        vertexPosition.push(...obj.pos);
                        color.push(...obj.col);
                        texture.push(...obj.tex);
                    }
                }
              }
            }
            var index = (len => {
                    if (!len) return [];
                    let base = [0,1,2, 0,2,3], out = [];
                    for(let i=0,j=0; i<len; j=++i*4)
                        out.push(...base.map(x => x+j));
                    return out;
                })(vertexPosition.length/12),
                ar = this.allRegion[regionKey];
            ar.pos = this.gl.createVbo(vertexPosition);
            ar.col = this.gl.createVbo(color);
            ar.tex = this.gl.createVbo(texture);
            ar.ibo = this.gl.createIbo(index);
            ar.iboLen = index.length;
        });
        this.needRebuildRegion = new Set();
    };
}
