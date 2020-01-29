
import {Vec3} from "../util/math/glMath.js";

export default class Entity {
    constructor(boxmin = new Vec3(-0.25, -1.5, -0.25),
                 boxmax = new Vec3( 0.25,  0,  0.25)) {
        this.boxmin = boxmin; this.boxmax = boxmax;
        
        this.position = new Vec3();
        
        //以y正半轴为正方向，与xz平面的夹角，弧度制，∈[π/2, -π/2]
        this.pitch = -Math.PI/2;
        //在xz平面，以逆时针为正方向，与z负半轴的夹角，弧度制
        this.yaw = 0;
    }
    
    get x() { return this.position[0]; };
    set x(v) { return this.position[0] = v; };
    get y() { return this.position[1]; };
    set y(v) { return this.position[1] = v; };
    get z() { return this.position[2]; };
    set z(v) { return this.position[2] = v; };
    
//    get faceDirection() {
//        return new Vec3(this.x - Math.cos(this.pitch) * Math.sin(this.yaw),
//                        this.y + Math.sin(this.pitch),
//                        this.z - Math.cos(this.pitch) * Math.cos(this.yaw));
//    };
//    // ?
//    set faceDirection(v) {
//        this.pitch = Math.acos(v[1] / Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]));
//        this.yaw = Math.acos(v[0] / Math.sqrt(v[0]*v[0] + v[2]*v[2]));
//        return v;
//    };
//    
    setWorld(world) {
        this.world = world;
    };
}
