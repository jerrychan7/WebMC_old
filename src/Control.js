
export default class Control {
    constructor(canvas) {
        this.canvas = canvas;
        this.doc = canvas.ownerDocument;
        this[Symbol.for("callbacks")] = {};
        this.keys = [];
        canvas.requestPointerLock = canvas.requestPointerLock    ||
                                    canvas.mozRequestPointerLock ||
                                    canvas.webkitRequestPointerLock;
        this.doc.addEventListener("keydown", this[Symbol.for("onKeyDown")].bind(this), false);
        this.doc.addEventListener("keyup", this[Symbol.for("onKeyUp")].bind(this), false);
        canvas.addEventListener("mousedown", this[Symbol.for("onMouseDown")].bind(this), false);
        canvas.addEventListener("mouseup", this[Symbol.for("onMouseUp")].bind(this), false);
        canvas.addEventListener("mousemove", this[Symbol.for("onMouseMove")].bind(this), false);
        canvas.addEventListener("mousewheel", this[Symbol.for("onMouseWheel")].bind(this), false);
        canvas.addEventListener("DOMMouseScroll", this[Symbol.for("onMouseWheel")].bind(this), false);
        canvas.addEventListener("contextmenu", e => {e.preventDefault();}, false);
    };

    [Symbol.for("onKeyDown")](e) {
        this.keys[e.keyCode] = this.keys[String.fromCharCode(e.keyCode)] = true;
        this[Symbol.for("targetEvent")]("keydown", e);
        return true;
    };
    [Symbol.for("onKeyUp")](e) {
        this.keys[e.keyCode] = this.keys[String.fromCharCode(e.keyCode)] = false;
        this[Symbol.for("targetEvent")]("keydown", e);
        return true;
    };
    [Symbol.for("onMouseDown")](e) {
        this[Symbol.for("targetEvent")]("mousedown", e);
        return true;
    };
    [Symbol.for("onMouseUp")](e) {
        this[Symbol.for("targetEvent")]("mouseup", e);
        return true;
    };
    [Symbol.for("onMouseMove")](e) {
        this[Symbol.for("targetEvent")]("mousemove", e);
        return true;
    };
    [Symbol.for("onMouseWheel")](e) {
        this[Symbol.for("targetEvent")]("mousewheel", e);
        return true;
    };

    [Symbol.for("targetEvent")](event, e) {
        if (event in this[Symbol.for("callbacks")])
            this[Symbol.for("callbacks")][event].forEach(fn => fn(e));
    };

    addEventListener(event, callback) {
        if (event in this[Symbol.for("callbacks")])
            this[Symbol.for("callbacks")][event].push(callback);
        else this[Symbol.for("callbacks")][event] = [callback];
    };
};
