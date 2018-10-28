
import spa from "/src/UI/spa.js";
import GlUtils from "/src/util/GlUtils.js";
import {Mat4, Vec3} from "/src/util/math/glMath.js";
import {asyncLoadResByUrl, RESOURCES} from "/src/loadResources.js";

let shaderSource = {}, render = {};
asyncLoadResByUrl("res/shaders/start_game_page.vertex")
    .then(s => shaderSource.vertex = s);
asyncLoadResByUrl("res/shaders/start_game_page.fragment")
    .then(s => shaderSource.fragment = s);

spa.addEventListener("start_game_page", "load", pageID => {
    var canvas = document.getElementById("start-game-canvas"),
        gl = new GlUtils(canvas),
        prg = gl.createProgram(shaderSource.vertex, shaderSource.fragment);
    gl.clearColor(.0, .0, .0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.frontFace(gl.CW);
    gl.useProgram(prg);

    const {"mvpMatrix": uniMvp, "texture": uniTex} = gl.getCurrentUniforms(),
          vertexPosition = [
              -1, 1,-1, -1,-1,-1, -1,-1, 1, -1, 1, 1,
              -1, 1, 1, -1,-1, 1,  1,-1, 1,  1, 1, 1,
               1, 1, 1,  1,-1, 1,  1,-1,-1,  1, 1,-1,
               1, 1,-1,  1,-1,-1, -1,-1,-1, -1, 1,-1,
               1, 1,-1, -1, 1,-1, -1, 1, 1,  1, 1, 1,
              -1,-1,-1,  1,-1,-1,  1,-1, 1, -1,-1, 1
          ],
          index = (len => {
              let base = [0,1,2, 0,2,3], out = [];
              for(let i=0,j=0; i<=len; j=i++*4)
                  out.push.apply(out, base.map(x => x+j));
              return out;
          })(vertexPosition.length/12),
          textureCoord = (_ => {
              let out = [], min = 0.001;
              for(let i=0; i<6; i++)
                  out.push(
                      0.125*i+min, 0+min,
                      0.125*i+min, 1-min,
                      0.125*(i+1)-min, 1-min,
                      0.125*(i+1)-min, 0+min);
              return out;
          })(),
          pos = gl.createVbo(vertexPosition),
          tex = gl.createVbo(textureCoord),
          ibo = gl.createIbo(index),
          texture = gl.createTexture(RESOURCES["/res/texture/gui/background"]);
    gl.bindVboByAttributeName("position", pos, 3);
    gl.bindVboByAttributeName("textureCoord", tex, 2);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
//    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.uniform1i(uniTex.loc, 0);

    var fovy = 120,
        vM = new Mat4().identity().ClookAt([0, 0, 0], [-1, 0, 0], [0, 1, 0]),
        vpM = new Mat4().identity().Cperspective(fovy, canvas.width/canvas.height, 0.1, 10).mul(vM);
    gl.uniformMatrix4fv(uniMvp.loc, false, vpM);
    render.gl = gl;
    render.onresize = () => {
        const {w, h} = gl.fitScreen();
        vpM = new Mat4().identity().Cperspective(fovy, w/h, 0.1, 10).mul(vM);
    };
    window.addEventListener("resize", render.onresize);
    render.stopFlag = false;
    render.play = (() => {
        var count = 0, PI = Math.PI, cos = Math.cos, indexLength = index.length;
    return function animation(){
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        var rad = (count++/4 % 360) * PI / 180;
        gl.uniformMatrix4fv(uniMvp.loc, false, vpM.mul(new Mat4().identity().Crotate(rad, [0, 1, 0])));
        gl.drawElements(gl.TRIANGLES, indexLength, gl.UNSIGNED_SHORT, 0);
        gl.flush();
        if(!this.stopFlag)
            window.requestAnimationFrame(animation.bind(this));
    };
    })();

    render.play();
    render.onresize();
});
spa.addEventListener("start_game_page", "unload", pageID => {
    window.removeEventListener("resize",render.onresize);
    render.stopFlag=true;
    render.onresize=null;
    render.play=null;
});
spa.addEventListener("start_game_page", "overlap", pageID => {
    render.stopFlag=true;
});
spa.addEventListener("start_game_page", "unoverlap", pageID => {
    render.stopFlag=false;
    render.play();
});
