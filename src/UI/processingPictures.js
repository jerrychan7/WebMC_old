
import asyncLoadResByUrl from "/src/loadResources.js";

class Canvas2D {
    constructor(width = 0, height = 0) {
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
        if (width > 0 && height > 0)
            this.setSize(width, height);
        return new Proxy(this, {
            get(tar, key) {
                if (key in tar) return tar[key];
                if (key in tar.canvas) return tar.canvas[key].bind(tar.canvas);
                if (key in tar.ctx) return tar.ctx[key].bind(tar.ctx);
            }
        });
    };
    setSize(w, h) {
        this.canvas.width = w;
        this.canvas.height = h;
        this.ctx.mozImageSmoothingEnabled    = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.msImageSmoothingEnabled     = false;
        this.ctx.imageSmoothingEnabled       = false;
        this.ctx.oImageSmoothingEnabled      = false;
    };
}

//背景样式
asyncLoadResByUrl("/res/texture/gui/background.png")
.then(img => {
    const {width, height} = img,
          canvas = new Canvas2D(128, 128),
          style = document.createElement("style");
    canvas.drawImage(img, 0, 0, width, height, 0, 0, 128, 128);
    style.innerHTML = `.mc-background{background-image: url(${canvas.toDataURL()});}`;
    document.head.appendChild(style);
})
.catch(err => {throw err;});

//button
asyncLoadResByUrl("/res/texture/gui/gui.png")
.then(img => {
    const {width, height} = img,
          canvas = new Canvas2D(200, 20),
          style = document.createElement("style");
    canvas.drawImage(img, 0, 66*height/256, 200*width/256, 20*height/256, 0, 0, 200, 20);
    var b1 = canvas.toDataURL();
    canvas.drawImage(img, 0, 86*height/256, 200*width/256, 20*height/256, 0, 0, 200, 20);
    var b2 = canvas.toDataURL();
    canvas.drawImage(img, 0, 46*height/256, 200*width/256, 20*height/256, 0, 0, 200, 20);
    var b3 = canvas.toDataURL();
    style.innerHTML = ".mc-button{\n"+
                      `    background-image: url(${b1});\n`+
                      "    background-size: 100% 100%;\n"+
                      "    background-repeat: no-repeat;\n"+
                      "    color: #E0E0E0;\n"+
                      "    text-shadow: 1px 1px 1px #383838;\n"+
                      "}\n\n"+
                      ".mc-button:hover {\n"+
                      `    background-image: url(${b2});\n`+
                      "    color: #FFFFA0;\n"+
                      "    text-shadow: 1px 1px 1px #3F3F28;\n"+
                      "}\n\n"+
                      ".mc-button:active {\n"+
                      `    background-image: url(${b3});\n`+
                      "}";
    document.head.appendChild(style);
})
.catch(err => {throw err});

//crosshair
asyncLoadResByUrl("/res/texture/gui/icons.png")
.then(img => {
    const {width, height} = img,
          canvas = new Canvas2D(32, 32),
          style = document.createElement("style");
    canvas.drawImage(img, 0, 0, 15*width/256, 15*height/256, 0, 0, 32, 32);
    style.innerHTML = ".mc-crosshair {\n" +
                      `    background-image: url(${canvas.toDataURL()});\n` +
                      "    background-size: 100% 100%;\n" +
                      "    background-repeat: no-repeat;\n" +
                      "    pointer-events: none;\n" +
                      "    display: block;\n" +
                      "    width: 32px;\n" +
                      "    height: 32px;\n" +
                      "    position: absolute;\n" +
                      "    left: 0;\n" +
                      "    top: 0;\n" +
                      "    bottom: 0;\n" +
                      "    right: 0;\n" +
                      "    margin: auto auto;\n" +
                      "}";
    document.head.appendChild(style);
});

//start_game_canvas image
asyncLoadResByUrl("/res/texture/gui/background/panorama_0.png")
.then(async img => {
    const {width, height} = img,
          canvas = new Canvas2D(),
          outImg = new Image();
    outImg.onload = function() {
        import("/src/loadResources.js").then(({setResource}) => {
            setResource("/res/texture/gui/background", this);
        });
    };
    canvas.setSize((_=>{for(var j=1;_;_>>=1) j<<=1;return j;})(width*6),
                   (_=>{for(var j=1;_;_>>=1) j<<=1;return j;})(height>>1));
    for(let imgCount=0; imgCount<6; ++imgCount)
        canvas.drawImage(await asyncLoadResByUrl(`/res/texture/gui/background/panorama_${imgCount}.png`),
                         0,0,width,height,imgCount*width,0,width,height);
    outImg.src = canvas.toDataURL();
})
.catch(err => {throw err});
