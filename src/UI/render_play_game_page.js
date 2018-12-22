
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
    gl.clearColor(0.62, 0.81, 1.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    gl.enable(gl.BLEND);
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
                for (var j=0; j<sizeY; ++j){
                    lightLevel[i][j] = new Array(16);
                    for (var k=0; k<16; ++k)
                        lightLevel[i][j][k] = 0;
                }
            }
        }
        this.allRegion[regionKey] = this.allRegion[regionKey] || {};
        this.allRegion[regionKey].lightLevel = lightLevel;

        let list = [], list2 = [], rerefresh = new Set(), rerefreshModel = new Set();
        for (var i=0; i<16; ++i) {
          for (var k=0; k<16; ++k) {
              for (var j=sizeY-1; j>=0; --j) {
                var block = this.world.getTile(i+rxb, j, k+rzb);
                if (block.name === "air") {
                    lightLevel[i][j][k] = 15;
                    if ((i === 0 || i === 15) && this.world.getTile(rxb+(i? 16: -1), j, rzb+k).luminance === 0 &&
                       this.world.getTile(rxb+(i? 16: -1), j, rzb+k).opacity<16 && this.getBlockLightLevel(rxb+(i? 16: -1), j, rzb+k) < 14)
                        rerefresh.add((rx+(i? 1: -1)) + ',' + rz);
                    if ((k===15||k===0) && this.world.getTile(rxb+i, j, rzb+(k? 16: -1)).luminance === 0 &&
                       this.world.getTile(rxb+i, j, rzb+(k? 16: -1)).opacity<16 && this.getBlockLightLevel(rxb+i, j, rzb+(k? 16: -1)) < 14)
                        rerefresh.add(rx + ',' + (rz+(k? 1: -1)));
                }
                else {
                    for (; ~j; --j) {
                        lightLevel[i][j][k] = block.luminance;
                        list.push([i, j, k]);
                    }
                    break;
                }
            }
          }
        }

        while (list.length) {
            var [i, j, k] = list.shift(),
                block  = this.world.getTile(i+rxb, j, k+rzb),
                old = lightLevel[i][j][k];
            if (block.luminance) lightLevel[i][j][k] = block.luminance;
            else if (block.opacity>15) lightLevel[i][j][k] = 0;
            else {
                var t1 = [[i+1,j,k], [i-1,j,k], [i,j+1,k], [i,j-1,k], [i,j,k+1], [i,j,k-1]]
                         .reduce((ans, [x, y, z]) => {
                             if (y>=sizeY || y<0 || x+rxb>=sizeX || z+rzb>=sizeZ)
                                 return ans;
                             var ll = this.getBlockLightLevel(x+rxb, y, z+rzb);
                             if (!ll) return ans;
                             var b = this.world.getTile(x+rxb, y, z+rzb);
                             return Math.max(ans, Math.min(15, ll-b.opacity+b.luminance-(b.name==="air")));
                         }, 0);
                if (i===0 || i===15 || k===0 || k===15) {
                    var t2 = [[i+1,j,k], [i-1,j,k], [i,j+1,k], [i,j-1,k], [i,j,k+1], [i,j,k-1]]
                             .reduce((ans, [x, y, z]) => {
                                 if (x<0 || x>=16 || z<0 || z>=16 || y>=sizeY || y<0)
                                     return ans;
                                 var ll = this.getBlockLightLevel(x+rxb, y, z+rzb);
                                 if (!ll) return ans;
                                 var b = this.world.getTile(x+rxb, y, z+rzb);
                                 return Math.max(ans, Math.min(15, ll-b.opacity+b.luminance-(b.name==="air")));
                             }, 0);
                    if (t1 > t2+1 || t1 < t2-1) {
                        var fn = (a, b, c) => {
                                var ll = this.getBlockLightLevel(a, b, c),
                                    ans = [[a, b, c]];
                                if (ll === 15 || this.world.getTile(a, b, c).luminance !== 0)
                                    return ans;
                                for (const [d, e, f] of [[a+1,b,c], [a-1,b,c], [a,b+1,c], [a,b-1,c], [a,b,c+1], [a,b,c-1]]) {
                                    if (this.getBlockLightLevel(d, e, f) === ll+1) {
                                        ans.push(...fn(d, e, f));
                                        var [x, y, z] = ans[ans.length-1];
                                        if (this.getBlockLightLevel(x, y, z) === 15 || this.world.getTile(x, y, z).luminance !== 0)
                                            break;
                                    }
                                }
                                return ans;
                            };
                        var ans = (i===0 || i===15)? fn(rxb+(i? 16: -1), j, rzb+k):
                                  (k===0 || k===15)? fn(rxb+i, j, rzb+(k? 16: -1)):
                                  false;
                        if (ans) {
                            var [a, b, c] = ans[ans.length-1];
                            if (this.getBlockLightLevel(a, b, c) === 15 || this.world.getTile(a, b, c).luminance !== 0)
                                lightLevel[i][j][k] = t1;
                            else if (Math.abs(Math.min(t1, t2) - this.getBlockLightLevel(a, b, c)) >= 2) {
                                ans.forEach(([a, b, c]) => {
                                    rerefresh.add((a>>4) +','+ (c>>4));
                                });
                                list2.push([i, j, k]);
                            }
                        }
                    }
                    else lightLevel[i][j][k] = t1;
                }
                else lightLevel[i][j][k] = t1;
            }
            [[i+1,j,k], [i-1,j,k], [i,j+1,k], [i,j-1,k], [i,j,k+1], [i,j,k-1]].forEach(([x, y, z]) => {
                if (y>=sizeY || y<0 || x+rxb>=sizeX || z+rzb>=sizeZ)
                    return;
                var ll = this.getBlockLightLevel(x+rxb, y, z+rzb);
                if (ll < lightLevel[i][j][k]-1 && this.world.getTile(x+rxb, y, z+rzb).opacity<16) {
                    if (x>=16 || z>=16) rerefresh.add([rx+(x>=16), rz+(z>=16)]+"");
                    else if (x<0 || z<0) rerefresh.add([rx-(x<0), rz-(z<0)]+"");
                    else list.unshift([x, y, z]);
                }
            });
        }

        console.log(regionKey, rerefresh);
        rerefresh.forEach(s => {
            var [x, z] = s.split(",");
            this.refreshRegionLightLevel(x, z);
        });
        rerefresh = new Set();

        while (list2.length) {
            var [i, j, k] = list2.shift(),
                block = this.world.getTile(i+rxb, j, k+rzb),
                old = lightLevel[i][j][k];
            lightLevel[i][j][k] = block.luminance || block.opacity>15? 0:
                [[i+1,j,k], [i-1,j,k], [i,j+1,k], [i,j-1,k], [i,j,k+1], [i,j,k-1]]
                .reduce((ans, [x, y, z]) => {
                    if (y>=sizeY || y<0 || x+rxb>=sizeX || z+rzb>=sizeZ)
                        return ans;
                    var ll = this.getBlockLightLevel(x+rxb, y, z+rzb);
                    if (!ll) return ans;
                    var b = this.world.getTile(x+rxb, y, z+rzb);
                    return Math.max(ans, Math.min(15, ll-b.opacity+b.luminance-(b.name==="air")));
                }, 0);
            [[i+1,j,k], [i-1,j,k], [i,j+1,k], [i,j-1,k], [i,j,k+1], [i,j,k-1]].forEach(([x, y, z]) => {
                if (y>=sizeY || y<0 || x+rxb>=sizeX || z+rzb>=sizeZ)
                    return;
                var ll = this.getBlockLightLevel(x+rxb, y, z+rzb);
                if (ll < lightLevel[i][j][k]-1 && this.world.getTile(x+rxb, y, z+rzb).opacity<16){
                    if (x>=16 || z>=16) rerefresh.add([rx+(x>=16), rz+(z>=16)]+"");
                    else if (x<0 || z<0) rerefresh.add([rx-(x<0), rz-(z<0)]+"");
                    else list2.unshift([x, y, z]);
                }
            });
        }
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
        if (!blockFace){
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
                switch(block.renderType){
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
                        bf2.col = [...Array(len/3*4)].map(_ =>
                            Math.pow(0.9, 16-this.getBlockLightLevel(x, y, z))
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
                for(let i=0,j=0; i<=len; j=i++*4)
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

        var setBlockLightLevel = (x, y, z, ll) => {
                if (this.setBlockLightLevel(x, y, z, ll)) {
                    this.refreshBlock.lightLevelRerefresh(x, y, z);
                };
            };

        var list = [];
        if (this.world.getTile(bx, by+1, bz).name === "air" &&
           this.getBlockLightLevel(bx, by+1, bz) === 15) {
            for (var y=by; ~y; --y) {
                if (this.world.getTile(bx, y, bz).name === "air") {
                    setBlockLightLevel(bx, y, bz, 15);
                    [[bx+1, y, bz], [bx-1, y, bz],
                     [bx, y, bz+1], [bx, y, bz-1]]
                    .forEach(([i, j, k]) => {
                        if (this.getBlockLightLevel(i, j, k) < 14 &&
                           this.world.getTile(i, j, k).luminance === 0 &&
                           this.world.getTile(i, j, k).opacity < 16) {
                            list.push([i, j, k]);
                        }
                    });
                }
                else {
                    setBlockLightLevel(bx, y, bz, 0);
                    if (y === by || this.world.getTile(bx, y, bz).opacity<16){
                        for (--y; ~y && this.world.getTile(bx, y, bz).name === "air"; --y) {
                            setBlockLightLevel(bx, y, bz, 0);
                            list.push([bx, y, bz]);
                        }
                    }
                    break;
                }
            }
        }
        else list.push([bx, by, bz]);

        while (list.length) {
            console.log(list.join("| "));
            var [i, j, k] = list.shift(),
                block  = this.world.getTile(i, j, k),
                old = this.getBlockLightLevel(i, j, k),
                t1 = -1;
            if (block.luminance) setBlockLightLevel(i, j, k, block.luminance);
            else if (block.opacity>15) setBlockLightLevel(i, j, k, 0);
            else
                setBlockLightLevel(i, j, k,
                    [[i+1,j,k], [i-1,j,k], [i,j+1,k], [i,j-1,k], [i,j,k+1], [i,j,k-1]]
                    .reduce((ans, [x, y, z]) => {
                        if (y<0 || y>=sizeY || x<0 || x>=sizeX || z<0 || z>=sizeZ) return ans;
                        var ll = this.getBlockLightLevel(x, y, z);
                        if (!ll) return ans;
                        var flag = false, que = [[x, y, z]];
                        while (que.length) {
                            var [a, b, c] = que.shift(),
                                cll = this.getBlockLightLevel(a, b, c);
                            if (cll === 15 || this.world.getTile(a, b, c).luminance !== 0) {
                                flag = true;
                                break;
                            }
                            [[a+1,b,c], [a-1,b,c], [a,b+1,c], [a,b-1,c], [a,b,c+1], [a,b,c-1]]
                            .forEach(([d, e, f]) => {
                                if (this.getBlockLightLevel(d, e, f) === cll+1) que.unshift([d, e, f]);
                            });
                        }
                        if (!flag) {
                            list.unshift([x, y, z]);
                            return ans;
                        }
                        var b = this.world.getTile(x, y, z);
                        return Math.max(ans, Math.min(15, ll-b.opacity+b.luminance-(b.name==="air")));
                    }, 0)
                 );
            var cll = this.getBlockLightLevel(i, j, k);
            [[i+1,j,k], [i-1,j,k], [i,j+1,k], [i,j-1,k], [i,j,k+1], [i,j,k-1]].forEach(([x, y, z]) => {
                if (y>=sizeY || y<0 || x>=sizeX || z>=sizeZ || x<0 || z<0)
                    return;
                var ll = this.getBlockLightLevel(x, y, z);
                if (ll < cll-1 && this.world.getTile(x, y, z).opacity<16) {
                    list.unshift([x, y, z]);
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
                    bf2.col = [...Array(len/3*4)].map(_ =>
                        Math.pow(0.9, 16-this.getBlockLightLevel(x, y, z))
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
                    face.col = [...Array(len/3*4)].map(_ =>
                        Math.pow(0.9, 16-cll)
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
        console.log([...this.rerefreshRegion].join(", "));
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
                    for(let i=0,j=0; i<=len; j=i++*4)
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

    for (var i=0,_i=world.sizeX>>4; i<_i; i++){
        for (var j=0,_j=world.sizeZ>>4; j<_j; j++){
            render.refreshRegionLightLevel.call(render, i, j);
        }
    }
    render.refreshRegion.rerefreshRegion = new Set();
    for (var i=0,_i=world.sizeX>>4; i<_i; i++){
        for (var j=0,_j=world.sizeZ>>4; j<_j; j++){
            render.refreshRegionModel.call(render, i, j);
        }
    }

    var {"mvpMatrix": uniMvp, "texture": uniTex} = gl.getCurrentUniforms(),
        textureImg = gl.createTexture(RESOURCES["res/texture/terrain-atlas.png"]);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textureImg);
    gl.uniform1i(uniTex.loc, 0);

    Object.defineProperty(render, "aspectRatio", {
        get() { return canvas.width/canvas.height; },
        set(v) {}
    });
    var fovy = render.fovy = 90,
        p = world.mainPlayer,
        vM = new Mat4().identity().lookat([p.x, p.y, p.z], p.yaw, p.pitch),
        pM = new Mat4().identity().Cperspective(fovy, render.aspectRatio, 0.1, 500),
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
    render.play = function animation(){
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        p.upData();
        vM = Mat4.identity.lookat([p.x, p.y, p.z], p.yaw, p.pitch);
        gl.uniformMatrix4fv(uniMvp.loc, false, pM.mul(vM).mul(mM));

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
