
export default class Entity {
    constructor() {
        this.x = this.y = this.z = 0;
        //以y正半轴为正方向，与xz平面的夹角，弧度制，∈[π/2, -π/2]
        this.pitch = -Math.PI/2;
        //在xz平面，以逆时针为正方向，与z负半轴的夹角，弧度制
        this.yaw = 0;
    }

    setWorld(world) {
        this.world = world;
    };
}
