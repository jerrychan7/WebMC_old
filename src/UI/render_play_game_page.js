
import spa from "/src/UI/spa.js";
import GlUtils from "/src/util/GlUtils.js";
import {Mat4, Vec3} from "/src/util/math/glMath.js";
import Block from "/src/Blocks/Block.js";
import {asyncLoadResByUrl, RESOURCES} from "/src/loadResources.js";
import Control from "/src/Control.js";

let shaderSource = {}, render = {};
asyncLoadResByUrl("res/shaders/play_game_page.vertex")
    .then(s => shaderSource.vertex = s);
asyncLoadResByUrl("res/shaders/play_game_page.fragment")
    .then(s => shaderSource.fragment = s);

spa.addEventListener("play_game_page", "load", (pageID, world) => {
    if (pageID !== "loading_terrain_page") return;
    const canvas = document.getElementById("mainGamePage"),
          gl = new GlUtils(canvas),
          prg = gl.createProgram(shaderSource.vertex, shaderSource.fragment);
    var fogColor = new Vec3(0.62, 0.81, 1.0),
        fogDist = [30, 32];
    gl.clearColor(fogColor[0], fogColor[1], fogColor[2], 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    gl.enable(gl.BLEND);
//    gl.enable(gl.SAMPLE_ALPHA_TO_COVERAGE);
//    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);
    // 开启多边形偏移
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(1.0, 1.0);          // 设置偏移量
    gl.useProgram(prg);

    world.setRender(render);

    //test
    window.render = render;
    render.gl = gl;

    render.allRegion = {};
    render.getRegionLightLevel = function(rx, rz) {
        return render.allRegion[rx+','+rz]? render.allRegion[rx+','+rz].lightLevel: null;
    };
    render.getRegionBlockFace = function(rx, rz) {
        return render.allRegion[rx+','+rz]? render.allRegion[rx+','+rz].blockFace: null;
    };
    render.getBlockLightLevel = function(x, y, z) {
        const {sizeX, sizeY, sizeZ} = render.world;
        if (x<0 || y<0 || z<0 || x>=sizeX || y>=sizeY || z>=sizeZ)
            return NaN;
        var ll = render.getRegionLightLevel(x>>4, z>>4);
        return ll? ll[x%16][y][z%16]: NaN;
    };
    render.setBlockLightLevel = function(x, y, z, v) {
        const {sizeX, sizeY, sizeZ} = render.world;
        if (x<0 || y<0 || z<0 || x>=sizeX || y>=sizeY || z>=sizeZ)
            return false;
        var ll = render.getRegionLightLevel(x>>4, z>>4);
        if (ll === null) return false;
        ll[x%16][y][z%16] = v;
        return true;
    };
    render.getBlockFace = function(x, y, z) {
        var {sizeX, sizeY, sizeZ} = render.world;
        if (x<0 || y<0 || z<0 || x>=sizeX || y>=sizeY || z>=sizeZ)
            return null;
        var bf = render.getRegionBlockFace(x>>4, z>>4);
        return bf? bf[x%16][y][z%16]: null;
    };
    render.refreshRegionLightLevel = function(rx, rz) {
        rx *= 1; rz *= 1;
        const {sizeX, sizeY, sizeZ} = this.world,
              rxb = rx<<4, rzb = rz<<4;
        if (rxb<0 || rzb<0 || rxb>=sizeX || rzb>=sizeZ) return;
        const regionKey = rx + ',' + rz;
        /*
            最后计算方块当前亮度的时候: max(0,min(15,天光-方块不透明度+方块亮度)) 队列处理光照渲染
            不透明度范围0~16，不透明度为0是透明但不影响亮度的意思，
            不透明度为16是不透明的意思 在渲染时两个不透明度为16的紧挨着将不会渲染这两个面
        */
        var lightLevel = this.getRegionLightLevel(rx, rz);
        if (!lightLevel) {
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

        var rerefresh = new Set(),
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
                let b = this.world.getTile(x, y, z);
                if (l === 15 || b.luminance !== 0)
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
            this.refreshRegionLightLevel(x, z);
        });
        this.refreshRegion.lightLevelRefresh(rx, rz);
    };
    render.refreshRegionModel = function(rx, rz) {
        rx *= 1; rz *= 1;
        const regionKey = rx + ',' + rz,
              {sizeX, sizeY, sizeZ} = this.world;
        if (rx>(sizeX>>4) || rz>sizeZ>>4) return;
        var vertexPosition = [], texture = [], color = [],
            lightLevel = this.getRegionLightLevel(rx, rz);


        var blockFace = this.getRegionBlockFace(rx, rz);
        if (!blockFace) {
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
                switch(block.renderType) {
                case Block.renderType.NORMAL: {
                    var bf = blockFace[i%16][j][k%16];
                    [[i+1,j,k,"x+"], [i-1,j,k,"x-"], [i,j+1,k,"y+"], [i,j-1,k,"y-"], [i,j,k+1,"z+"], [i,j,k-1,"z-"]].forEach(([x, y, z, key]) => {
                        if (x<0 || z<0 || y<0 || x>=sizeX || z>=sizeX || y>=sizeY ||
                            this.world.getTile(x, y, z).opacity>15)
                            return delete bf[key];
                        var len = block.vertex[key].length,
                            bf2 = bf[key] || {};
                        bf2.pos = block.vertex[key].map((v, ind) => ind%3===0? v+i: ind%3===1? v+j: v+k);
                        bf2.tex = block.texture.uv[key];
                        bf2.col = [...Array(len/3*4)].map((_, ind) =>
                            ind%4 === 3? 1.0: Math.pow(0.9, 16-this.getBlockLightLevel(x, y, z))
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
//        console.log(regionKey, this.allRegion[regionKey].lightLevel);
    };
    render.refreshRegion = function(rx, rz) {
        render.refreshRegionLightLevel(rx, rz);
        render.refreshRegionModel(rx, rz);
    };
    render.refreshRegion.rerefreshRegion = new Set();
    render.refreshRegion.lightLevelRefresh = function(rx, rz) {
        render.refreshRegion.rerefreshRegion.add(rx +','+ rz);
    };
    render.refreshRegion.run = function() {
        render.refreshRegion.rerefreshRegion.forEach(k => {
            var [rx, rz] = k.split(",").map(x => x*1);
            render.refreshRegionModel(rx, rz);
        });
        render.refreshRegion.rerefreshRegion = new Set();
    };
    render.refreshBlockLightLevel = function(bx, by, bz) {
        bx = Math.round(bx); by = Math.round(by); bz = Math.round(bz);
        const {sizeX, sizeY, sizeZ} = this.world;
        if (bx<0 || by<0 || bz<0 || bx>=sizeX || by>=sizeY || bz>=sizeZ)
            return;
        const rx = bx>>4, rz = bz>>4, regionKey = rx + ',' + rz;
        if (this.getRegionLightLevel(rx, rz) === null)
            return this.refreshRegionLightLevel(rx, rz);

        const setBlockLightLevel = (x, y, z, ll) => {
                  if (ll !== this.getBlockLightLevel(x, y, z) && this.setBlockLightLevel(x, y, z, ll)) {
//                      console.log({x, y, z, ll});
                      this.refreshBlock.lightLevelRerefresh(x, y, z);
                      return true;
                  }
                  return false;
              },
              computeLightLevel = (arountLightLevel, centerBlock) =>
                  Math.max(0, Math.min(15, arountLightLevel - centerBlock.opacity + centerBlock.luminance - (centerBlock.name === "air"))),
              lighting = (x, y, z) => {
                  let l = this.getBlockLightLevel(x, y, z);
                  if (!l) return false;
                  let b = this.world.getTile(x, y, z);
                  if (l === 15 || b.luminance !== 0)
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
    render.refreshBlockModel = function(bx, by, bz) {
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
        this.refreshBlock.blockRerefresh(bx, by, bz);
    };
    render.refreshBlock = function(bx, by, bz) {
        render.refreshBlockLightLevel(bx, by, bz);
        render.refreshBlockModel(bx, by, bz);
    };
    render.refreshBlock.rerefreshRegion = new Set();
    render.refreshBlock.lightLevelRerefresh = function(bx, by, bz) {
        const {sizeX, sizeY, sizeZ} = render.world;
        [[bx+1, by, bz, "x+"], [bx-1, by, bz, "x-"],
         [bx, by+1, bz, "y+"], [bx, by-1, bz, "y-"],
         [bx, by, bz+1, "z+"], [bx, by, bz-1, "z-"]]
        .forEach(([i, j, k, key]) => {
            if (i<0 || j<0 || k<0 || i>=sizeX || j>=sizeY || k>=sizeZ) return;
            const b = render.world.getTile(i, j, k);
            if (b.name === "air") return;
            const fkey =  key[0]+(key[1]==='+'? '-': '+'),
                  bf2 = render.getBlockFace(i, j, k);
            switch (b.renderType) {
            case Block.renderType.NORMAL:{
                if (fkey in bf2) {
                    var len = b.vertex[fkey].length,
                        cll = render.getBlockLightLevel(bx, by, bz);
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
            this.rerefreshRegion.add((x>>4) +','+ (z>>4));
        });
    };
    render.refreshBlock.blockRerefresh = function(bx, by, bz) {
        [[bx+1, bz], [bx-1, bz], [bx, bz],
         [bx, bz+1], [bx, bz-1]]
        .forEach(([x, z]) => {
            this.rerefreshRegion.add((x>>4) +','+ (z>>4));
        });
    };
    render.refreshBlock.run = function() {
//        console.log([...this.rerefreshRegion].join(", "));
        this.rerefreshRegion.forEach(regionKey => {
            const [rx, rz] = regionKey.split(",").map(r => r*1);
            var vertexPosition = [], color = [], texture = [], bf = render.getRegionBlockFace(rx, rz);
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
                ar = render.allRegion[regionKey];
            ar.pos = render.gl.createVbo(vertexPosition);
            ar.col = render.gl.createVbo(color);
            ar.tex = render.gl.createVbo(texture);
            ar.ibo = render.gl.createIbo(index);
            ar.iboLen = index.length;
        });
        this.rerefreshRegion = new Set();
    };

    for (var i=0,_i=world.sizeX>>4; i<_i; i++) {
        for (var j=0,_j=world.sizeZ>>4; j<_j; j++) {
            render.refreshRegionLightLevel.call(render, i, j);
        }
    }
    render.refreshRegion.rerefreshRegion = new Set();
    for (var i=0,_i=world.sizeX>>4; i<_i; i++) {
        for (var j=0,_j=world.sizeZ>>4; j<_j; j++) {
            render.refreshRegionModel.call(render, i, j);
        }
    }

    var {"mvpMatrix": uniMvp, "texture": uniTex} = gl.getCurrentUniforms(),
        textureImg = gl.createTexture(RESOURCES["res/texture/terrain-atlas.png"]);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textureImg);
    gl.uniform1i(uniTex.loc, 0);

    gl.setUniform("fogColor", fogColor);
    gl.setUniform("fogDist", new Float32Array(fogDist));

    Object.defineProperty(render, "aspectRatio", {
        get() { return canvas.width/canvas.height; },
        set(v) {}
    });
    var fovy = render.fovy = 78,
        p = world.mainPlayer,
        vM = new Mat4().identity().lookat([p.x, p.y, p.z], p.yaw, p.pitch),
        pM = new Mat4().identity().Cperspective(fovy, render.aspectRatio, 0.01, 500),
        mM = new Mat4().identity();
    p.setControl(new Control(canvas));
    gl.uniformMatrix4fv(uniMvp.loc, false, pM["*"](vM).mul(mM));
    render.aspectRatio = canvas.width/canvas.height;
    render.onresize = () => {
        const {w, h} = gl.fitScreen();
        pM = new Mat4().identity().Cperspective(fovy, w/h, 0.1, 500);
    };
    window.addEventListener("resize", render.onresize);
    render.stopFlag = false;
    render.play = function animation() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        p.upData();
        vM = Mat4.identity.lookat([p.x, p.y, p.z], p.yaw, p.pitch);
        gl.uniformMatrix4fv(uniMvp.loc, false, pM.mul(vM).mul(mM));


        gl.setUniform("useTex", 1.0);
        gl.disable(gl.BLEND);
        if (this.refreshBlock.rerefreshRegion.size)
            this.refreshBlock.run();
        if (this.refreshRegion.rerefreshRegion.size)
            this.refreshRegion.run();
        for (var regionKey in this.allRegion) {
            var reg = this.allRegion[regionKey];
            this.gl.bindVboByAttributeName("position", reg.pos, 3);
            this.gl.bindVboByAttributeName("color", reg.col, 4);
            this.gl.bindVboByAttributeName("textureCoord", reg.tex, 2);
            this.gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, reg.ibo);
            this.gl.drawElements(gl.TRIANGLES, reg.iboLen, gl.UNSIGNED_SHORT, 0);
        }

        var world = this.world, {sizeX, sizeY, sizeZ} = world,
            {x: px, y: py, z: pz, pitch, yaw} = this.world.mainPlayer,
            {sin, cos, round} = Math, dr = 0.1;
        for (var r=0,x,y,z; r<50; r+=dr) {
            x = round(px - r*cos(pitch)*sin(yaw)),
            y = round(py + r*sin(pitch)),
            z = round(pz - r*cos(pitch)*cos(yaw));
            if (y<0) break;
            if (y<world.sizeY && world.getTile(x, y, z).name !== "air") {
                break;
            }
        }
        // 高亮当前所指方块
        // vbo的内存问题 后面改善
        if (x>=0 && x<sizeX && z>=0 && z<sizeZ && y>=0 && y<sizeY) {
            gl.setUniform("useTex", 0.0);
            gl.enable(gl.BLEND);

            // draw line
            let vertexPosition = [], llcolor = [], block = world.getTile(x, y, z);
            switch (block.renderType) {
            case Block.renderType.NORMAL: {
                let bf = this.getBlockFace(x, y, z);
                for (let key in bf) {
                    vertexPosition.push(...bf[key].pos);
                    llcolor.push(...bf[key].col);
                }
                break;}
            }
            let index = (len => {
                    if (!len) return [];
                    let base = [0,1, 0,3, 1,2, 2,3], out = [];
                    for(let i=0,j=0; i<len; j=++i*4)
                        out.push(...base.map(x => x+j));
                    return out;
                })(vertexPosition.length/12),
                color = llcolor.map((num, ind) => ind%4===3? 0.4: num/0.6561);
            gl.bindVboByAttributeName("position", gl.createVbo(vertexPosition), 3);
            gl.bindVboByAttributeName("color", gl.createVbo(color), 4);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createIbo(index));
            gl.drawElements(gl.LINES, index.length, gl.UNSIGNED_SHORT, 0);

            // draw surface
            gl.depthMask(false);
            index = (len => {
                if (!len) return [];
                let base = [0,1,2, 0,2,3], out = [];
                for(let i=0,j=0; i<len; j=++i*4)
                    out.push(...base.map(x => x+j));
                return out;
            })(vertexPosition.length/12);
            color = llcolor.map((num, ind) => ind%4===3? 0.1: num/0.6561);
            gl.bindVboByAttributeName("position", gl.createVbo(vertexPosition), 3);
            gl.bindVboByAttributeName("color", gl.createVbo(color), 4);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createIbo(index));
            this.gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);
            gl.depthMask(true);

        }

        gl.flush();

        if(!this.stopFlag)
            window.requestAnimationFrame(this.play.bind(this));
    };

    render.play();
    render.onresize();
});
spa.addEventListener("play_game_page", "unload", pageID => {
    window.removeEventListener("resize",render.onresize);
    render = {};
});
spa.addEventListener("play_game_page", "overlap", pageID => {
    render.stopFlag = true;
});
spa.addEventListener("play_game_page", "unoverlap", pageID => {
    render.stopFlag = false;
    render.play();
});
