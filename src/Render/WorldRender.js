
import GlUtils from "../util/GlUtils.js";
import {Mat4, Vec3} from "../util/math/glMath.js";
import Block from "../Blocks/Block.js";
import {asyncLoadResByUrl, waitResource, RESOURCES} from "../loadResources.js";
import Control from "../Control.js";

import Model from "./MapModel.js";
import LightMap from "./WorldLight.js";

let shaderSource = {}, render = {};
asyncLoadResByUrl("res/shaders/play_game_page.vertex")
    .then(s => shaderSource.vertex = s);
asyncLoadResByUrl("res/shaders/play_game_page.fragment")
    .then(s => shaderSource.fragment = s);
waitResource("res/texture/terrain-atlas.png");

export default class Render {
    constructor(canvas, world = null) {
//      {"rx,rz": {
//          lightLevel: [x][y][z],
//          pos: vertexWebGLBuffer{},
//          col: colorsWebGLBuffer{},
//          tex: textureCoorWebGLBuffer{},
//          ibo: WebGLBuffer{},
//          iboLen: ibo.length,
//          blockFace: [x][y][z]["x+|x-|y+|y-|z+|z-"]: {
//              pos: vertex coordiate (length == 12)
//              tex: texture uv corrdiate (length == 8)
//              col: vertex color (length == 16)
//          }
//      }}
        this.allRegion = {};
        this.canvas = canvas;
        const gl = this.gl = new GlUtils(canvas),
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

        let {"texture": uniTex} = gl.getCurrentUniforms(),
            textureImg = gl.createTexture(RESOURCES["res/texture/terrain-atlas.png"]);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textureImg);
        gl.uniform1i(uniTex.loc, 0);

        gl.setUniform("fogColor", fogColor);
        gl.setUniform("fogDist", new Float32Array(fogDist));

//        window.addEventListener("resize", this.onresize);
        this.stopFlag = true;
        this.matrixs = {vM: null, pM: null, mM: null};
        this.fovy = 78;
        
        this.onresize = this.onresize.bind(this);
        
        if (world !== null) this.setWorld(world);
    };
    get aspectRatio() {
        return this.canvas.width / this.canvas.height;
    };
    onresize() {
        const {w, h} = this.gl.fitScreen();
        this.matrixs.pM = new Mat4().identity().Cperspective(this.fovy, w/h, 0.1, 500);
    };
    setWorld(world) {
        world.setRender(this);
        this.world = world;
        const gl = this.gl;
        this.model = new Model(gl, world, this.allRegion);
        this.lightMap = new LightMap(gl, world, this.allRegion);
        
        //test
        window.render = this;
        // ----

        let fovy = this.fovy = 78,
            p = world.mainPlayer,
            vM = this.matrixs.vM = new Mat4().identity().lookat([p.x, p.y, p.z], p.yaw, p.pitch),
            pM = this.matrixs.pM = new Mat4().identity().Cperspective(fovy, this.aspectRatio, 0.01, 500),
            mM = this.matrixs.mM = new Mat4().identity(),
            {"mvpMatrix": uniMvp} = gl.getCurrentUniforms();
        p.setControl(new Control(this.canvas));
        gl.uniformMatrix4fv(uniMvp.loc, false, pM["*"](vM).mul(mM));
        
        for (var i=0,_i=world.sizeX>>4; i<_i; i++) {
            for (var j=0,_j=world.sizeZ>>4; j<_j; j++) {
                this.lightMap.updataRegion(i, j);
            }
        }
        for (var i=0,_i=world.sizeX>>4; i<_i; i++) {
            for (var j=0,_j=world.sizeZ>>4; j<_j; j++) {
                this.model.updataRegion(i, j);
            }
        }

    };
    refreshRegion(rx, rz) {
        this.lightMap.updataRegion(rx, rz);
        this.model.updataRegion(rx, rz);
    };
    refreshBlock(bx, by, bz) {
        this.lightMap.updataBlock(bx, by, bz);
        this.model.updataBlock(bx, by, bz);
    };
    stop() {
        console.log("adsf");
        this.stopFlag = true;
    };
    play() {
        this.stopFlag = false;
        this.animation();
        this.onresize();
    };
    animation(lastTime, nowTime) {
        if (this.stopFlag) return;
        
        const {gl, world,
               world:{"mainPlayer": p, sizeX, sizeY, sizeZ}} = this,
              {"mvpMatrix": uniMvp} = gl.getCurrentUniforms();
        let {matrixs: {vM, pM, mM}} = this;
        
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        p.upData(((nowTime - lastTime) / 1000) || (1 / 60));
        vM = this.matrixs.vM = Mat4.identity.lookat([p.x, p.y, p.z], p.yaw, p.pitch);
        gl.uniformMatrix4fv(uniMvp.loc, false, pM.mul(vM).mul(mM));


        gl.setUniform("useTex", 1.0);
        gl.disable(gl.BLEND);
        this.lightMap.refresh();
        this.model.refresh();
        for (let regionKey in this.allRegion) {
            let reg = this.allRegion[regionKey];
            gl.bindVboByAttributeName("position", reg.pos, 3);
            gl.bindVboByAttributeName("color", reg.col, 4);
            gl.bindVboByAttributeName("textureCoord", reg.tex, 2);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, reg.ibo);
            gl.drawElements(gl.TRIANGLES, reg.iboLen, gl.UNSIGNED_SHORT, 0);
        }

        var {x: px, y: py, z: pz, pitch, yaw} = p,
            {sin, cos, round} = Math, dr = 0.1;
        for (var r=0,x,y,z; r<50; r+=dr) {
            x = round(px - r*cos(pitch)*sin(yaw)),
            y = round(py + r*sin(pitch)),
            z = round(pz - r*cos(pitch)*cos(yaw));
            if (y<0) break;
            if (y<sizeY && world.getTile(x, y, z).name !== "air") {
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
                let getRegionBlockFace = (rx, rz) => {
                    return this.allRegion[rx+','+rz]? this.allRegion[rx+','+rz].blockFace: null;
                }, getBlockFace = (x, y, z) => {
                    var {sizeX, sizeY, sizeZ} = this.world;
                    if (x<0 || y<0 || z<0 || x>=sizeX || y>=sizeY || z>=sizeZ)
                        return null;
                    var bf = getRegionBlockFace(x>>4, z>>4);
                    return bf? bf[x%16][y][z%16]: null;
                };
                let bf = getBlockFace(x, y, z);
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
            gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);
            gl.depthMask(true);

        }

        gl.flush();

        if(!this.stopFlag)
            window.requestAnimationFrame(this.animation.bind(this, nowTime));
    };
}
