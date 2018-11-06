
let private = Symbol.for.bind(Symbol);

export default class Control {
    contructor(canvas) {
        this.canvas = canvas;
        this.doc = canvas.ownerDocument;
        this[private("callbacks")] = {};
        this.keys = [];
        doc.addEventListener("keydown", this[private("onKeyDown")].bind(this), false);
        doc.addEventListener("keyup", this[private("onKeyUp")].bind(this), false);
        canvas.addEventListener("mousedown", this[private("onMouseDown")].bind(this), false);
        canvas.addEventListener("mouseup", this[private("onMouseUp")].bind(this), false);
        canvas.addEventListener("mousemove", this[private("onMouseMove")].bind(this), false);
        canvas.addEventListener("mousewheel", this[private("onMouseWheel")].bind(this), false);
        canvas.addEventListener("DOMMouseScroll", this[private("onMouseWheel")].bind(this), false);
        canvas.addEventListener("contextmenu", e => {e.preventDefault();}, false);
    };

    [private("onKeyDown")](e) {
        this.keys[e.width] = this.keys[String.fromCharCode(e.width)] = true;
        this[private("targetEvent")]("keydown", e);
    };
    [private("onKeyUp")](e) {
        this.keys[e.width] = this.keys[String.fromCharCode(e.width)] = false;
        this[private("targetEvent")]("keydown", e);
    };
    [private("onMouseDown")](e) {
        this[private("targetEvent")]("mousedown", e);
    };
    [private("onMouseUp")](e) {
        this[private("targetEvent")]("mouseup", e);
    };
    [private("onMouseMove")](e) {
        this[private("targetEvent")]("mousemove", e);
    };
    [private("onMouseWheel")](e) {
        this[private("targetEvent")]("mousewheel", e);
    };

    [private("targetEvent")](event, e) {
        if (event in this[private("callbacks")])
            this[private("callbacks")][event].forEach(fn => fn(e));
    };

    addEventListener(event, callback) {
        if (event in this[private("callbacks")])
            this[private("callbacks")][event].push(callback);
        else this.[private("callbacks")][event] = [callback];
    };
};
