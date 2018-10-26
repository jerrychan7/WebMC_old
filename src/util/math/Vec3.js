
export default class Vec3 extends Float32Array{
    constructor(...args){
        if(args.length===0) super(3);
        else if(args.length===3) super(args);
        else switch(({}).toString.apply(args[0])){
            case "[object Number]":
                super(3);
                if(args.length<3) args.forEach((c,i)=>{this[i]=c;});
                else for(let i=0;i<3;++i) this[i]=args[i];
                break;
            case "[object Array]":
            case "[object Float32Array]":{
                args=args[0];
                if(args.length===3) super(args);
                else{
                    super(3);
                    if(args.length<3) args.forEach((c,i)=>{this[i]=c;});
                    else for(let i=0;i<3;++i) this[i]=args[i];
                }
                break;}
            default:
                super(3);
        }
    };

    get x(){return this[0];};
    get y(){return this[1];};
    get z(){return this[2];};
    set x(x){return this[0]=x;};
    set y(y){return this[1]=y;};
    set z(z){return this[2]=z;};

    add(vec3){
        return new Vec3(this[0]+vec3[0], this[1]+vec3[1], this[2]+vec3[2]);
    };
    ["+"](vec3){return this.add(vec3);};

    subtract(vec3){
        return new Vec3(this[0]-vec3[0], this[1]-vec3[1], this[2]-vec3[2]);
    };
    sub(vec3){return this.subtract(vec3);};
    ["-"](vec3){return this.subtract(vec3);};;

    multiply(vec3){
        return new Vec3(this[0]*vec3[0], this[1]*vec3[1], this[2]*vec3[2]);
    };
    mul(vec3){return this.multiply(vec3);};
//        ["x"](vec3){return this.multiply(vec3);};
    ["^"](vec3){return this.multiply(vec3);};
    ["*"](vec3_num){
        if(typeof vec3==="number")
            return this.scale(vec3_num);
        return this.multiply(vec3_num);
    };

    divide(vec3){
        return new Vec3(this[0]/vec3[0],this[1]/vec3[1],this[2]/a[2]);
    };
    div(vec3){return this.divide(vec3);};
    ["/"](vec3){return this.divide(vec3);};

    length(){
        var x=this[0],y=this[1],z=this[0];
        return Math.sqrt(x*x+y*y+z*z);
    };
    len(){return this.length();};
    get len(){return this.length();};

    scale(num){
        return new Vec3(this[0]*num, this[1]*num, this[2]*num);
    };

    negate(){
        return new Vec3(-this[0], -this[1], -this[2]);
    };

    inverse(){
        return new Vec3(1.0/this[0],1.0/this[1],1.0/this[2]);
    };

//    rotateX(b,c){
//        var p = [], r=[];
//        //Translate point to the origin
//        p[0] = this[0] - b[0];
//        p[1] = this[1] - b[1];
//        p[2] = this[2] - b[2];
//        //perform rotation
//        r[0] = p[0];
//        r[1] = p[1]*Math.cos(c) - p[2]*Math.sin(c);
//        r[2] = p[1]*Math.sin(c) + p[2]*Math.cos(c);
//        //translate to correct position
//        return new Vec3(
//            r[0] + b[0],
//            r[1] + b[1],
//            r[2] + b[2]
//        );
//    };
//    rotateY(b,c){
//        var p = [], r=[];
//        //Translate point to the origin
//        p[0] = this[0] - b[0];
//        p[1] = this[1] - b[1];
//        p[2] = this[2] - b[2];
//
//        //perform rotation
//        r[0] = p[2]*Math.sin(c) + p[0]*Math.cos(c);
//        r[1] = p[1];
//        r[2] = p[2]*Math.cos(c) - p[0]*Math.sin(c);
//
//        //translate to correct position
//        return new Vec3(
//            r[0] + b[0],
//            r[1] + b[1],
//            r[2] + b[2]
//        );
//    };
//    rotateZ(b,c){
//        var p = [], r=[];
//        //Translate point to the origin
//        p[0] = this[0] - b[0];
//        p[1] = this[1] - b[1];
//        p[2] = this[2] - b[2];
//
//        //perform rotation
//        r[0] = p[0]*Math.cos(c) - p[1]*Math.sin(c);
//        r[1] = p[0]*Math.sin(c) + p[1]*Math.cos(c);
//        r[2] = p[2];
//
//        //translate to correct position
//        return new Vec3(
//            r[0] + b[0],
//            r[1] + b[1],
//            r[2] + b[2]
//        );
//    };

    exactEquals(vec3) {
        return this[0] === vec3[0] && this[1] === vec3[1] && this[2] === vec3[2];
    };
    ["==="](vec3){return this.exactEquals(vec3);};

    equals(b) {
        var a0 = this[0], a1 = this[1], a2 = this[2],
            b0 = b[0], b1 = b[1], b2 = b[2],
            abs=Math.abs , max=Math.max,
            EPSILON=0.000001;
        return (abs(a0 - b0) <= EPSILON*max(1.0, abs(a0), abs(b0)) &&
                abs(a1 - b1) <= EPSILON*max(1.0, abs(a1), abs(b1)) &&
                abs(a2 - b2) <= EPSILON*max(1.0, abs(a2), abs(b2)));
    };
    ["=="](vec3){return this.equals(vec3);};

    transformMat4(m) {
        var x = this[0], y = this[1], z = this[2],
            w = m[3] * x + m[7] * y + m[11] * z + m[15];
        w = w || 1.0;
        return new Vec3(
            (m[0] * x + m[4] * y + m[8] * z + m[12]) / w,
            (m[1] * x + m[5] * y + m[9] * z + m[13]) / w,
            (m[2] * x + m[6] * y + m[10]* z + m[14]) / w
        );
    };

};
