
import spa from "/src/UI/spa.js";
import GlUtils from "/src/util/GlUtils.js";
import {Mat4, Vec3} from "/src/util/math/glMath.js";
import Block from "/src/Blocks/Block.js";
import {asyncLoadResByUrl, RESOURCES} from "/src/loadResources.js";

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

    const {allBlock: map, sizeX, sizeY, sizeZ} = world;
    var vertexPosition = [], texture = [];
    for (var i=0,t={},_t; i<sizeX; ++i) {
        for (var k=0; k<sizeZ; ++k) {
            for (var j=0; j<sizeY; ++j) {
                var block = map[i][j][k];
//                if (block.name !== "air" && !block.transparency) {
                if (block.name !== "air" && block.opacity>15) {
                    switch(block.renderType){
                        case Block.renderType.NORMAL: {
//                            var f = ({transparency}) => transparency===0 ? 1/i>0 :false,
                            var f = ({opacity}) => opacity<16,
                                add = key => {
                                    vertexPosition.push(...block.vertex[key].map((v, index) => index%3==0? v+i: index%3==1? v+j: v+k));
                                    texture.push(...block.texture.uv[key]);
                                };
                            if (i+1 < sizeX && f(map[i+1][j][k])) add("x+");
                            if (i>0         && f(map[i-1][j][k])) add("x-");
                            if (j+1!==sizeY && f(map[i][j+1][k])) add("y+");
                            if (j>0         && f(map[i][j-1][k])) add("y-");
                            if (k+1 < sizeZ && f(map[i][j][k+1])) add("z+");
                            if (k>0         && f(map[i][j][k-1])) add("z-");
                            break;
                        }
                    }
                }
            }
        }
    }

    var {"mvpMatrix": uniMvp, "texture": uniTex} = gl.getCurrentUniforms(),
        baseInd = [0,1,2, 0,2,3],
        pos = gl.createVbo(vertexPosition),
        color = gl.createVbo([...Array(vertexPosition.length/3*4)].map(_=>1)),
        tex = gl.createVbo(texture),
        index = (len => {
            let base = [0,1,2, 0,2,3], out = [];
            for(let i=0,j=0; i<=len; j=i++*4)
                out.push(...base.map(x => x+j));
            return out;
        })(vertexPosition.length/12),
        col = gl.createVbo([...Array(vertexPosition.length/3*4)]
                           .map(_ => 1)),
        ibo = gl.createIbo(index),
        textureImg = gl.createTexture(RESOURCES["res/texture/terrain-atlas.png"]);
    gl.bindVboByAttributeName("position", pos, 3);
    gl.bindVboByAttributeName("textureCoord", tex, 2);
    gl.bindVboByAttributeName("color", col, 4);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textureImg);
    gl.uniform1i(uniTex.loc, 0);

    var fovy = 120,
        p = world.mainPlayer,
        vM = new Mat4().identity().ClookAt([p.x, p.y, p.z], [-1, 0, 0], [0, 1, 0]),
        vpM = new Mat4().identity().Cperspective(fovy, canvas.width/canvas.height, 0.1, 500).mul(vM),
        mM = new Mat4().identity();
    gl.uniformMatrix4fv(uniMvp.loc, false, vpM);
    render.gl = gl;
    render.onresize = () => {
        const {w, h} = gl.fitScreen();
        vpM = new Mat4().identity().Cperspective(fovy, w/h, 0.1, 500).mul(vM);
    };
    window.addEventListener("resize", render.onresize);
    render.stopFlag = false;
    render.play = function animation(){
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.uniformMatrix4fv(uniMvp.loc, false, vpM.mul(mM.Crotate(Math.PI / 180 / 4, [0, 1, 0])));
        gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);
        gl.flush();
        if(!this.stopFlag)
            window.requestAnimationFrame(animation.bind(this));
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
