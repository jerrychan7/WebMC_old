
export default class GlUtils {
    constructor(canvas/*webGLRenderingContext*/) {
//        this.gl = gl;
//        Object.defineProperties(this, "gl", {value: webGLRenderingContext, writable: false});
        var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
//        console.log(gl);
        Object.defineProperties(this, {
            ctx: {value: gl, writable: false},
            gl: {value: gl, writable: false}
        });
        return new Proxy(this, {
            get(tar, key, val) {
                const t = key in tar ? tar : tar.ctx,
                      o = t[key];
                if (typeof o === "function") return o.bind(t);
                return o;
            }
        });
    };

    createProgram(vertex, fragment) {
        const {gl} = this,
              p = this.program = gl.createProgram(),
              vs = this.compileShader(vertex, gl.VERTEX_SHADER),
              fs = this.compileShader(fragment, gl.FRAGMENT_SHADER);
        gl.attachShader(p, vs);
        gl.attachShader(p, fs);
        gl.linkProgram(p);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS))
            throw gl.getProgramInfoLog(p);
        return p;
    };

    compileShader(src, type) {
        const gl = this.gl,
              s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
            throw gl.getShaderInfoLog(s);
        return s;
    };

    createIbo(data) {
        const {gl} = this,
              ibo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        return ibo;
    };

    createVbo(data) {
        const {gl} = this,
              vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return vbo;
    };

    bindVboByAttributeName(valueName, vbo, size) {
        const {gl} = this,
              att = gl.getAttribLocation(this.program, valueName);
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.enableVertexAttribArray(att);
        gl.vertexAttribPointer(att, size, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    };

    createTexture(img, doYFlip = false) {
        const {gl} = this,
              tex = gl.createTexture();
        if (doYFlip) gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.bindTexture(gl.TEXTURE_2D, tex);
//        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER, gl.LINEAR);
//        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
//        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
        if (doYFlip) gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        return tex;
    };

    getCurrentAttribs(){
        const {gl, program} = this;
        return [...Array(gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES))]
            .map((_, i) => {
                const {size, type, name} = gl.getActiveAttrib(program, i),
                      loc = gl.getAttribLocation(program, name);
                return {size, type, name: name.split("[")[0], loc};
            }).reduce((ac, el) => {
                ac[el.name] = el;
                return ac;
            }, {});
//        var ans = {};
//        for(var i = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES); ~i; --i) {
//            var {size, type, name} = gl.getActiveAttrib(program, i),
//                loc = gl.getAttribLocation(program, name);
//            name = name.split("[")[0];
//            ans[name] = {name, size, type, loc};
//        }
//        return ans;
    };

    getCurrentUniforms() {
        const {gl, program} = this;
        return [...Array(gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS))]
            .map((_, i) => {
                const {size, type, name} = gl.getActiveUniform(program, i),
                      loc = gl.getUniformLocation(program, name);
                return {size, type, name: name.split("[")[0], loc};
            })
            .reduce((ac, {name, size, type, loc}) => {
                ac[name] = { name, size, type, loc };
                return ac;
            }, {});
    };

    setSize(w, h) {
        const c = this.gl.canvas;
//        c.style.width = w + "px";
//        c.style.height = h + "px";
        c.width = w; c.height = h;
        this.gl.viewport(0, 0, w, h);
        return {w, h};
    };

    fitScreen(wp = 1, hp = 1) {
        return this.setSize(
            window.innerWidth * wp,
            window.innerHeight * hp
        );
    };
};
