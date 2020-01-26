
import Block from "../Blocks/Block.js";

export default class LightMap {
    constructor(gl, world, allRegion) {
        this.gl = gl;
        this.world = world;
        this.needRebuildRegion = new Set();
        this.needRebuildBlock = new Set();
        this.allRegion = allRegion;
    };
    get needRebuild() {
        return this.needRebuildRegion.size || this.needRebuildBlock.size;
    };
    getRegionLightLevel(rx, rz) {
        return this.allRegion[rx+','+rz]? this.allRegion[rx+','+rz].lightLevel: null;
    };
    getBlockLightLevel(x, y, z) {
        const {sizeX, sizeY, sizeZ} = this.world;
        if (x<0 || y<0 || z<0 || x>=sizeX || y>=sizeY || z>=sizeZ)
            return NaN;
        var ll = this.getRegionLightLevel(x>>4, z>>4);
        return ll? ll[x%16][y][z%16]: NaN;
    };
    setBlockLightLevel(x, y, z, v) {
        const {sizeX, sizeY, sizeZ} = this.world;
        if (x<0 || y<0 || z<0 || x>=sizeX || y>=sizeY || z>=sizeZ)
            return false;
        var ll = this.getRegionLightLevel(x>>4, z>>4);
        if (ll === null) return false;
        ll[x%16][y][z%16] = v;
        return true;
    };
    updataRegion(rx, rz) {
        rx *= 1; rz *= 1;
        const {sizeX, sizeY, sizeZ} = this.world,
              rxb = rx<<4, rzb = rz<<4;
        if (rxb<0 || rzb<0 || rxb>=sizeX || rzb>=sizeZ) return;
        const regionKey = rx + ',' + rz;
        
//      最后计算方块当前亮度的时候: max(0,min(15,天光-方块不透明度+方块亮度)) 队列处理光照渲染
//      不透明度范围0~16，不透明度为0是透明但不影响亮度的意思，
//      不透明度为16是不透明的意思 在渲染时两个不透明度为16的紧挨着将不会渲染这两个面
        
        var lightLevel = this.getRegionLightLevel(rx, rz);
        if (!lightLevel) {
            // 首次计算光照等级
            lightLevel = new Array(16);
            for (var i=0; i<16; ++i) {
                lightLevel[i] = new Array(sizeY);
                for (var j=0; j<sizeY; ++j) {
                    lightLevel[i][j] = new Array(16);
                    for (var k=0; k<16; ++k)
                        lightLevel[i][j][k] = 0;
                }
            }
        }
        this.allRegion[regionKey] = this.allRegion[regionKey] || {};
        this.allRegion[regionKey].lightLevel = lightLevel;

        // rerefresh 需要重新计算的区块
        var rerefresh = new Set(),
            // 记录需要刷新的方块
            priorityQueue = new class extends Array {
                pop() {
                    delete this[this[0].join()];
                    return super.shift();
                };
                push(zb) {
                    var k = zb.join();
                    if (this[k]) return this.length;
                    this[k] = true;
                    super.push(zb);
//                    super.sort(this.sortFn);
                    return this.length;
                };
            };
//        priorityQueue.sortFn = ([x1, y1, z1], [x2, y2, z2]) =>
//            this.getBlockLightLevel(rxb+x2, y2, rzb+z2) - this.getBlockLightLevel(rxb+x1, y1, rzb+z1);
        const lighting = (x, y, z) => {
//                if (x<0 || x>=sizeX || z<0 || z>=sizeZ || y<0 || y>=sizeY)
//                    return false;
                let l = this.getBlockLightLevel(x, y, z);
                if (!l) return false;
                if (l === 15 || this.world.getTile(x, y, z).luminance !== 0)
                    return true;
                for (const [d, e, f] of [[x+1,y,z], [x-1,y,z], [x,y+1,z], [x,y-1,z], [x,y,z+1], [x,y,z-1]])
                    if (this.getBlockLightLevel(d, e, f) === l+1 && lighting(d, e, f))
                        return true;
                return false;
            },
              computeLightLevel = (arountLightLevel, centerBlock) =>
                Math.max(0, Math.min(15, arountLightLevel - centerBlock.opacity + centerBlock.luminance - (centerBlock.name === "air")));

        for (var i=0; i<16; ++i) {
          for (var k=0; k<16; ++k) {
            for (var j=sizeY-1; j>=0; --j) {
                var block = this.world.getTile(i+rxb, j, k+rzb);
                // 天光
                if (block.name === "air") {
                    lightLevel[i][j][k] = 15;
                    if (i===0 || i===15) {
                        var x = rxb+(i? 16: -1), b = this.world.getTile(x, j, rzb+k);
                        if (b.luminance === 0 && b.opacity < 16 && this.getBlockLightLevel(x, j, rzb+k) < 14)
                            rerefresh.add((rx+(i? 1: -1)) + ',' + rz);
                    }
                    if (k===0 || k===15) {
                        var z = rzb+(k? 16: -1), b = this.world.getTile(rxb+i, j, z);
                        if (b.luminance === 0 && b.opacity < 16 && this.getBlockLightLevel(rxb+i, j, z) < 14)
                            rerefresh.add(rx + ',' + (rz+(k? 1: -1)));
                    }
                }
                else {
                    if (j !== sizeY-1)
                        priorityQueue.push([i, j+1, k]);
                    for (; ~j ; --j) {
                        block = this.world.getTile(i+rxb, j, k+rzb);
                        lightLevel[i][j][k] = block.luminance;
                        if (lightLevel[i][j][k] !== 0
                           || ((i===0 || i===15) && lighting(rxb+(i? 16: -1), j, rzb+k))
                           || ((k===0 || k===15) && lighting(rxb+i, j, rzb+(k? 16: -1))))
                            priorityQueue.push([i, j, k]);
                        else if (block.opacity < 16)
                            for (const [x, y, z] of [[i+1, j, k], [i-1, j, k], [i, j, k+1], [i, j, k-1]]) {
                                if (x<0 || x>15 || z<0 || z>15) continue;
                                if (lightLevel[x][y][z] > 1) {
                                    lightLevel[i][j][k] = computeLightLevel(lightLevel[x][y][z], block);
                                    priorityQueue.push([i, j, k]);
                                    break;
                                }
                            }
                    }
                }
            }
          }
        }

        while (priorityQueue.length) {
            var [i, j, k] = priorityQueue.pop(),
                cll = lightLevel[i][j][k],
                cblock = this.world.getTile(rxb+i, j, rzb+k);
            if (cblock.opacity>15 && cblock.luminance === 0) {
                lightLevel[i][j][k] = 0;
                continue;
            }
            [[i+1,j,k], [i-1,j,k], [i,j+1,k], [i,j-1,k], [i,j,k+1], [i,j,k-1]]
            .forEach(([a, b, c]) => {
                var wx = a+rxb, wy = b, wz = rzb+c;
                if (wx<0 || wx>=sizeX || wz<0 || wz>=sizeZ || wy<0 || wy>=sizeY)
                    return;
                var ablock = this.world.getTile(wx, wy, wz),
                    ll = this.getBlockLightLevel(wx, wy, wz);
                if (ll > cll+1) {
                    if (a===-1 || a===16 || c===-1 || c===16) {
                        if (lighting(wx, wy, wz)) {
                            lightLevel[i][j][k] = computeLightLevel(ll, cblock);
                            priorityQueue.push([i, j, k]);
                        }
                        else rerefresh.add((wx>>4) + ',' + (wz>>4));
                    }
                    else {
                        lightLevel[i][j][k] = computeLightLevel(ll, cblock);
                        priorityQueue.push([i, j, k]);
                    }
                }
                else if (ll < cll-1) {
                    if (a===-1 || a===16 || c===-1 || c===16) {
                        if (ablock.opacity<16) rerefresh.add((wx>>4) + ',' + (wz>>4));
                    }
                    else {
                        lightLevel[a][b][c] = computeLightLevel(cll, ablock);
                        priorityQueue.push([a, b, c]);
                    }
                }
            });
        }

//        console.log(regionKey, rerefresh);
        rerefresh.forEach(s => {
            var [x, z] = s.split(",");
            this.updataRegion(x, z);
        });
        this.needRebuildRegion.add(rx+','+rz);
    };
    updataBlock(bx, by, bz) {
        bx = Math.round(bx); by = Math.round(by); bz = Math.round(bz);
        const {sizeX, sizeY, sizeZ} = this.world;
        if (bx<0 || by<0 || bz<0 || bx>=sizeX || by>=sizeY || bz>=sizeZ)
            return;
        const rx = bx>>4, rz = bz>>4, regionKey = rx + ',' + rz;
        if (this.getRegionLightLevel(rx, rz) === null)
            return this.updataRegion(rx, rz);

        const setBlockLightLevel = (x, y, z, ll) => {
                  if (ll !== this.getBlockLightLevel(x, y, z) && this.setBlockLightLevel(x, y, z, ll)) {
//                      console.log({x, y, z, ll});
                      this.needRebuildBlock.add([x, y, z]);
                      return true;
                  }
                  return false;
              },
              computeLightLevel = (arountLightLevel, centerBlock) =>
                  // return 0 <= ll <= 15
                  Math.max(0, Math.min(15, arountLightLevel - centerBlock.opacity + centerBlock.luminance - (centerBlock.name === "air"))),
              lighting = (x, y, z) => {
                  let l = this.getBlockLightLevel(x, y, z);
                  if (!l) return false;
                  if (l === 15 || this.world.getTile(x, y, z).luminance !== 0)
                      return true;
                  for (const [d, e, f] of [[x+1,y,z], [x-1,y,z], [x,y+1,z], [x,y-1,z], [x,y,z+1], [x,y,z-1]])
                      if (this.getBlockLightLevel(d, e, f) === l+1 && lighting(d, e, f))
                          return true;
                  return false;
              };

        var queue = new class extends Array {
                pop() {
                    delete this[this[0].join()];
                    return super.shift();
                };
                push(zb) {
                    var k = zb.join();
                    if (this[k]) return this.length;
                    this[k] = true;
                    super.push(zb);
                    return this.length;
                };
            },
            obstructed = by;
        while (obstructed<sizeY &&
               this.world.getTile(bx, ++obstructed, bz).opacity === 0);
        if (obstructed === sizeY) {
            for (var y=sizeY-1; ~y && this.world.getTile(bx, y, bz).opacity===0; --y) {
                if (this.getBlockLightLevel(bx, y, bz) !== 15) {
                    setBlockLightLevel(bx, y, bz, 15);
                    queue.push([bx, y, bz]);
                    continue;
                }
                for (const [i, j, k] of [[bx+1, y, bz], [bx-1, y, bz], [bx, y, bz+1], [bx, y, bz-1]]) {
                    let ll = this.getBlockLightLevel(i, j, k);
                    if (ll < 14) {
                        if (setBlockLightLevel(i, j, k, computeLightLevel(15, this.world.getTile(i, j, k)))) {
                            queue.push([i, j, k]);
                        }
                    }
                }
            }
            if (this.world.getTile(bx, by, bz).opacity !== 0) {
                let com = computeLightLevel(14, this.world.getTile(bx, by, bz));
                if (com !== this.getBlockLightLevel(bx, by, bz)) {
                    setBlockLightLevel(bx, by, bz, com);
                    queue.push([bx, by, bz]);
                    for (var y = by-1; ~y && this.world.getTile(bx, y, bz).opacity===0; --y) {
                        setBlockLightLevel(bx, y, bz, this.world.getTile(bx, y, bz).luminance);
                        queue.push([bx, y, bz]);
                    }
                }
            }

        }
        else {
            for (var y = obstructed-1; y>by && this.world.getTile(bx, y, bz).opacity===0; --y) {
                setBlockLightLevel(bx, y, bz, this.world.getTile(bx, y, bz).luminance);
                queue.push([bx, y, bz]);
            }
            if (this.world.getTile(bx, by, bz).opacity !== 0 || obstructed === by+1) {
//            if (obstructed === by+1) {
                let b = this.world.getTile(bx, by, bz);
                if (b.opacity>15 && b.luminance === 0) {
                    setBlockLightLevel(bx, by, bz, 0);
                    [[bx+1, by, bz], [bx-1, by, bz], [bx, by, bz+1], [bx, by, bz-1]].forEach(([x, y, z]) => {
                        if (this.getBlockLightLevel(x, y, z) !== 15) {
                            setBlockLightLevel(x, y, z, computeLightLevel(0, this.world.getTile(x, y, z)));
                        }
                        queue.push([x, y, z]);
                    });
                }
                else {
                    setBlockLightLevel(bx, by, bz, b.luminance);
                    queue.push([bx, by, bz]);
                }
            }
            for (var y = by-1; ~y && this.world.getTile(bx, y, bz).opacity===0; --y) {
                setBlockLightLevel(bx, y, bz, this.world.getTile(bx, y, bz).luminance);
                queue.push([bx, y, bz]);
            }
        }

        while (queue.length) {
//            console.log(queue.join("| "));
            let [i, j, k] = queue.pop(),
                cll = this.getBlockLightLevel(i, j, k),
                cblock = this.world.getTile(i, j, k);
            if (cblock.opacity>15 && cblock.luminance === 0) {
                setBlockLightLevel(i, j, k, 0);
                continue;
            }
            [[i+1,j,k], [i-1,j,k], [i,j+1,k], [i,j-1,k], [i,j,k+1], [i,j,k-1]]
            .forEach(([a, b, c]) => {
                var ll = this.getBlockLightLevel(a, b, c),
                    ablock = this.world.getTile(a, b, c);
                if (ll > cll+1) {
                    if (lighting(a, b, c)) {
                        setBlockLightLevel(i, j, k, computeLightLevel(ll, cblock));
                        queue.push([i, j, k]);
                    }
                    else {
                        setBlockLightLevel(a, b, c, computeLightLevel(cll, ablock));
                        queue.push([a, b, c]);
                    }
                }
                else if (ll < cll-1) {
                    setBlockLightLevel(a, b, c, computeLightLevel(cll, ablock));
                    queue.push([a, b, c]);
                }
            });
        }
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
    
    refresh() {
        if (!this.needRebuild) return;
        this.needRebuildBlock.forEach(([bx, by, bz]) => {
            const {sizeX, sizeY, sizeZ} = this.world;
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
                    if (fkey in bf2) {
                        var len = b.vertex[fkey].length,
                            cll = this.getBlockLightLevel(bx, by, bz);
                        bf2[fkey].col = [...Array(len/3*4)].map(_ =>
                            Math.pow(0.9, 16-cll)
                        );
                    }
                    break;}
                }
            });
            [[bx+1, bz], [bx-1, bz], [bx, bz],
             [bx, bz+1], [bx, bz-1]]
            .forEach(([x, z]) => {
                this.needRebuildRegion.add((x>>4) +','+ (z>>4));
            });
        });
        this.needRebuildBlock = new Set();
        const getRegionBlockFace = (rx, rz) => {
            return this.allRegion[rx+','+rz]? this.allRegion[rx+','+rz].blockFace: null;
        };
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
