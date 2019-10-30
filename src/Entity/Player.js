
import Entity from "/src/Entity/Entity.js";

export default class Player extends Entity {

    setControl(controller) {
        this.controller = controller;

        var drag = false;
        function pointerLockChange() {drag = !drag;}
        controller.doc.addEventListener('pointerlockchange', pointerLockChange, false);
        controller.doc.addEventListener('mozpointerlockchange', pointerLockChange, false);
        controller.doc.addEventListener('webkitpointerlockchange', pointerLockChange, false);

        //进入鼠标控制
        controller.addEventListener("mousedown", e => {
            if (!drag) return;
            //在锁定指针的状态下
            drag = !drag;//这个是因为后面pointerLockChange也会运行

            // left button
            if (e.button === 0) {
                var world = this.world, render = world.render,
                    {x: px, y: py, z: pz, pitch, yaw} = this,
                    {sin, cos, round} = Math, dr = 0.1;
                for (var r=0,x,y,z; r<50; r+=dr) {
                    x = round(px - r*cos(pitch)*sin(yaw)),
                    y = round(py + r*sin(pitch)),
                    z = round(pz - r*cos(pitch)*cos(yaw));
                    if (y<0) break;
                    if (y<world.sizeY && world.getTile(x, y, z).name !== "air") {
                        console.log([x, y, z]);
//                        var t = new Date();
                        world.setTile(x, y, z, "air");
                        render.refreshBlock(x, y, z);
//                        console.log(new Date() - t);
                        break;
                    }
                }
            }

            // right button
            else if (e.button === 2) {
                var world = this.world, render = world.render,
                    {x: px, y: py, z: pz, pitch, yaw} = this,
                    {sin, cos, round} = Math, dr = 0.1,
                    [rpx, rpy, rpz] = [px, py, pz].map(round);
                for (var r=0,x,y,z,lx,ly,lz; r<50; r+=dr) {
                    x = round(px - r*cos(pitch)*sin(yaw));
                    y = round(py + r*sin(pitch));
                    z = round(pz - r*cos(pitch)*cos(yaw));
                    if (x===lx && y===ly && z===lz) continue;
                    if (y<0) break;
                    if (y<world.sizeY && world.getTile(x, y, z).name !== "air") {
//                        console.log({lx, ly, lz, rpx, rpy, rpz});
                        if (lx !== rpx || lz !== rpz || (ly !== rpy && ly !== rpy-1)) {
                            console.log([lx, ly, lz]);
//                            var t = new Date();
                            world.setTile(lx, ly, lz, "grass");
                            render.refreshBlock(lx, ly, lz);
//                            console.log(new Date() - t);
                        }
                        break;
                    }
                    lx = x; ly = y; lz = z;
                }
            }

                /*//https://stackoverflow.com/questions/20140711/picking-in-3d-with-ray-tracing-using-ninevehgl-or-opengl-i-phone/20143963#20143963
            //playerSight
        if(this.mouse){
            gl.disable(gl.CULL_FACE);
            var player=this.world.mainPlayer,
                p=player.pitch,
                y=player.yaw,
                pos=gl.createBuffer(),
                col=gl.createBuffer();

            gl.bindBuffer(gl.ARRAY_BUFFER,col);
            gl.bufferData(gl.ARRAY_BUFFER,(new Float32Array([1,0,0,0, 1,0,0,0, 1,0,0,0])),gl.STATIC_DRAW);
            gl.vertexAttribPointer(att.color,4,gl.FLOAT,false,0,0);
            gl.enableVertexAttribArray(att.color);

            var mx=this.mouse.x/canvas.width*2-1,
                my= -(this.mouse.y/canvas.height*2-1),
                vec4_mul_mat4=(v,m)=>[
                    v[0]*m[0]+v[1]*m[4]+v[2]*m[8] +v[3]*m[12],
                    v[0]*m[1]+v[1]*m[5]+v[2]*m[9] +v[3]*m[13],
                    v[0]*m[2]+v[1]*m[6]+v[2]*m[10]+v[3]*m[14],
                    v[0]*m[3]+v[1]*m[7]+v[2]*m[11]+v[3]*m[15]
                ],
                m=this.pM.multiply(this.vM).inverse(),
                n=vec4_mul_mat4([mx,my,-1,1],m),
                f=vec4_mul_mat4([mx,my,1,1],m),
                vec4_except_num=(v,n)=>[v[0]/n,v[1]/n,v[2]/n,v[3]/n];
            n=vec4_except_num(n,n[3]);
            f=vec4_except_num(f,f[3]);

            gl.bindBuffer(gl.ARRAY_BUFFER,pos);
            gl.bufferData(gl.ARRAY_BUFFER,(new Float32Array([
                                                            px,py-0.2,pz,
                                                            px-1*Math.cos(p)*Math.sin(y),
                                                            py+1*Math.sin(p),
                                                            pz-1*Math.cos(p)*Math.cos(y),
//                                                            px*((n[0]+1)/2),py*((n[1]+1)/2),pz*((n[2]+1)/2)
                                                            n[0],n[1],n[2]
                                                           ])),gl.STATIC_DRAW);//DYNAMIC_DRAW
            gl.vertexAttribPointer(att.position,3,gl.FLOAT,false,0,0);
            gl.enableVertexAttribArray(att.position);

            gl.drawArrays(gl.TRIANGLE_STRIP,0,3);
            gl.enable(gl.CULL_FACE);
        }*/

        });
        controller.addEventListener("mouseup", e => {
            controller.canvas.requestPointerLock();
            return false;
        });
        controller.addEventListener("mousemove", e => {
            if (!drag) return false;
            var sensitivity = 360,//鼠标灵敏度
                i = sensitivity*(Math.PI/180);
            this.yaw -= (e.movementX || e.mozMovementX || e.webkitMovementX || 0) * i / controller.canvas.width;
            this.pitch -= (e.movementY || e.mozMovementY || e.webkitMovementY || 0) * i / controller.canvas.height;
        });
    };

    upData() {

        const {keys} = this.controller;
        if (this.pitch*180/Math.PI < -90)
            this.pitch = -Math.PI/2;
        else if (this.pitch*180/Math.PI > 90)
            this.pitch = Math.PI/2;

        var speedYaw = this.yaw*180/Math.PI;
        if ((keys.W || keys.S) && (keys.A || keys.D))
            speedYaw -= (keys.A?-1:1)*(keys.W?1:3)*45;
        else if (keys.A || keys.D)
            speedYaw -= 90*(keys.A?-1:1);
        else if (keys.S)
            speedYaw -= 180;
        speedYaw *= Math.PI/180;


        var playerVelocity = 0.1,
            f = (i, j, k) =>
                this.world.getTile(i, j, k).name === "air" &&
                this.world.getTile(i, j-1, k).name === "air";
//            f = (x, z) => true;
        if (keys.A || keys.D || keys.S || keys.W) {
            var x = this.x + playerVelocity* -Math.sin(speedYaw),
                z = this.z + playerVelocity* -Math.cos(speedYaw);
            if (f(x, this.y, this.z)) this.x = x;
            if (f(this.x, this.y, z)) this.z = z;
        }
//        var y = this.y + (keys.X||keys[16]?-1:keys[32]?1:0)*playerVelocity;
//        this.y = y;
        var y = this.y + (keys[32]? 0.2: -0.1);
        if (f(this.x, ~~y, this.z)) this.y = y;
        else this.y = Math.round(y);

        document.getElementById("out").innerHTML = `x: ${this.x}<br>y: ${this.y}<br>z: ${this.z}<br>yaw: ${this.yaw}<br>pitch: ${this.pitch}`;
    };

}
