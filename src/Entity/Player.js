
import Entity from "./Entity.js";
import {Vec3} from "../util/math/glMath.js";

export default class Player extends Entity {

    constructor() {
        super();
        this.jumpSpeed = 7;
        this.gravity = 20;
        this.moveSpeed = 4;
        this.acc = new Vec3(0, -this.gravity, 0);
        this.vel = new Vec3();
        this.rest = new Vec3();
        this.isFly = false;
    };
    
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
        
        let spaceDownTime = 0, spaceUpTime = 0;
        controller.addEventListener("keyup", e => {
            if (!controller.keys[" "]) {
                spaceUpTime = new Date();
            }
        });
        controller.addEventListener("keydown", e => {
            if (controller.keys[" "]) {
                if (spaceDownTime - spaceUpTime < 0 && new Date() - spaceDownTime > 90 && new Date() - spaceDownTime < 250) {
                    if (this.rest.y === 0 && this.isFly === false) {
                        this.gravity = 0;
                        this.isFly = true;
                    }
                    else if (this.isFly === true) {
                        this.gravity = 20;
                        this.isFly = false;
                    }
                }
//                console.log(spaceDownTime - 0, spaceUpTime - 0, spaceDownTime - spaceUpTime, new Date() - spaceDownTime, this.gravity);
                spaceDownTime = new Date();
            }
            if (controller.keys[16] || controller.keys.X) {
                if (this.isFly) {
                    this.vel.y -= this.jumpSpeed;
                }
//                console.log(this.vel);
            }
//            console.log(controller.keys);
        });
    };

    upData(delta) {
        
        const {keys} = this.controller;
        if (this.pitch*180/Math.PI < -90)
            this.pitch = -Math.PI/2;
        else if (this.pitch*180/Math.PI > 90)
            this.pitch = Math.PI/2;
        
        if (keys[32] && this.isFly) {
            this.vel.y += this.jumpSpeed;
        }
        else if (keys[32] && this.vel.y <= 0 && this.rest.y === -1) {
            this.vel.y += this.jumpSpeed;
        }
        
        var speedYaw = this.yaw*180/Math.PI;
        if ((keys.W || keys.S) && (keys.A || keys.D))
            speedYaw -= (keys.A?-1:1)*(keys.W?1:3)*45;
        else if (keys.A || keys.D)
            speedYaw -= 90*(keys.A?-1:1);
        else if (keys.S)
            speedYaw -= 180;
        speedYaw *= Math.PI/180;
        
        
        this.vel.y -= this.gravity * delta;
        if (keys.A || keys.D || keys.S || keys.W) {
            let d = new Vec3(this.moveSpeed* -Math.sin(speedYaw), 0
                   , this.moveSpeed* -Math.cos(speedYaw));
            this.vel = this.vel["+"](d);
        }
        
        this.rest = new Vec3();
        let pos = this.position["+"](this.vel.scale(delta));
        
        
        const fn = (i, j, k) =>
                this.world.getTile(i, j, k).name === "air" &&
                this.world.getTile(i, j-1, k).name === "air";
        if (!fn(pos.x, this.y, this.z)) pos.x = this.x;
        if (!fn(this.x, this.y, pos.z)) pos.z = this.z;
        if (this.world.getTile(pos.x, pos.y, pos.z).name !== "air") {
            this.rest.y = 1;
            this.vel.y = 0;
            pos.y = this.y;
        }
        if (this.world.getTile(pos.x, (~~pos.y) - 1, pos.z).name !== "air") {
            this.rest.y = -1;
            this.vel.y = 0;
            pos.y = Math.round(this.y);
        }
        this.position = pos;
        this.vel.x = this.vel.z = 0;
        if (this.isFly) this.vel.y = 0;
        
        
        document.getElementById("out").innerHTML = `x: ${this.x}<br>y: ${this.y}<br>z: ${this.z}<br>yaw: ${this.yaw}<br>pitch: ${this.pitch}<br>fps: ${1 / delta}`;
    };
    
//    accelerate(acc, delta) {
//        this.vel = this.vel.add((new Vec3(acc)).scale(delta));
//	}
//	
//	move(vel, delta) {
//        let deltavel = vel.scale(delta),
//            pos = this.position["+"](deltavel),
//            f = (i, j, k) =>
//                this.world.getTile(i, j, k).name !== "air";
//        this.rest = new Vec3();
////        this.rest.x = this.rest.z = 0;
//        
//        let [ix, iy, iz] = this.boxmin.add(pos);
//        let [ax, ay, az] = this.boxmax.add(pos);
//        let mx = ix + (ax - ix) / 2,
//            my = iy + (ay - iy) / 2,
//            mz = iz + (az - iz) / 2;
//        
//        if (f(ix, ay, mz)) {
//            this.rest.x = -1;
//            if (this.vel.x <= 0) {
//                vel.x = deltavel.x = 0;
//                pos.x = this.x;
//            }
//        }
//        if (f(ix, iy + 1, mz)) {
//            this.rest.x = -1;
//            if (this.vel.x <= 0) {
//                vel.x = deltavel.x = 0;
//                pos.x = this.x;
//            }
//        }
//        
//        if (f(ax, ay, mz)) {
//            this.rest.x = 1;
//            if (this.vel.x >=0) {
//                vel.x = deltavel.x = 0;
//                pos.x = this.x;
//            }
//        }
//        if (f(ax, iy + 1, mz)) {
//            this.rest.x = 1;
//            if (this.vel.x >=0) {
//                vel.x = deltavel.x = 0;
//                pos.x = this.x;
//            }
//        }
//        
//        if (f(mx, ay, iz)) {
//            this.rest.z = -1;
//            if (this.vel.z <= 0) {
//                vel.z = deltavel.z = 0;
//                pos.z = this.z;
//            }
//        }
//        if (f(mx, iy + 1, iz)) {
//            this.rest.z = -1;
//            if (this.vel.z <= 0) {
//                vel.z = deltavel.z = 0;
//                pos.z = this.z;
//            }
//        }
//        if (f(mx, ay, az)) {
//            this.rest.z = 1;
//            if (this.vel.z >= 0) {
//                vel.z = deltavel.z = 0;
//                pos.z = this.z;
//            }
//        }
//        if (f(mx, iy + 1, az)) {
//            this.rest.z = 1;
//            if (this.vel.z >= 0) {
//                vel.z = deltavel.z = 0;
//                pos.z = this.z;
//            }
//        }
//        
//        if (f(mx, iy, mz)) {
//            this.rest.y = -1;
//            if (vel.y <= 0) {
//                vel.y = deltavel.y = 0;
//                pos.y = this.y;
//            }
//            else this.rest.y = 0;
//        }
//        if (f(mx, ay, mz)) {
//            this.rest.y = 1;
//            if (vel.y >= 0) {
//                vel.y = deltavel.y = 0;
//                pos.y = this.y;
//            }
//        }
//        
//        
////        if (!f(this.x, pos.y, pos.z)) {
////            this.rest.x = 1;
////            vel.x = deltavel.x = 0;
////            pos.x = this.x;
////        }
////        if (!f(pos.x, pos.y, this.z)) {
////            this.rest.z = 1;
////            vel.z = deltavel.z = 0;
////            pos.z = this.z;
////        }
////        if (f(pos.x, Math.round(this.y), pos.z) || f(pos.x, Math.round(this.y)-1, pos.z)) {
////            this.rest.y = -1;
////            vel.y = deltavel.y = 0;
////            pos.y = Math.round(this.y);
////        }
//        this.position = pos;
////        console.log(this.rest);
//        console.log(this.vel, this.rest);
//	}
//    
//    upData(delta) {
//        
//        const {keys} = this.controller;
//        if (this.pitch*180/Math.PI < -90)
//            this.pitch = -Math.PI/2;
//        else if (this.pitch*180/Math.PI > 90)
//            this.pitch = Math.PI/2;
//        
//        if (keys[32] && this.rest.y === -1) {
//            console.log("asdf");
//            this.accelerate([0, this.jumpSpeed, 0], 1);
//        }
//        
//        var speedYaw = this.yaw*180/Math.PI;
//        if ((keys.W || keys.S) && (keys.A || keys.D))
//            speedYaw -= (keys.A?-1:1)*(keys.W?1:3)*45;
//        else if (keys.A || keys.D)
//            speedYaw -= 90*(keys.A?-1:1);
//        else if (keys.S)
//            speedYaw -= 180;
//        speedYaw *= Math.PI/180;
//        
//        
//        this.accelerate(this.acc, delta);
//        if (keys.A || keys.D || keys.S || keys.W) {
//            let d = new Vec3(this.moveSpeed* -Math.sin(speedYaw), 0
//                   , this.moveSpeed* -Math.cos(speedYaw));
////            if (this.rest.x) d.x = 0;
////            if (this.rest.z) d.z = 0;
//            this.vel = this.vel["+"](d);
//        }
//        this.move(this.vel, delta);
//        this.vel.x = this.vel.z = 0;
////
////
////        var playerVelocity = 0.1,
////            f = (i, j, k) =>
////                this.world.getTile(i, j, k).name === "air" &&
////                this.world.getTile(i, j-1, k).name === "air";
//////            f = (x, z) => true;
////        if (keys.A || keys.D || keys.S || keys.W) {
////            var x = this.x + playerVelocity* -Math.sin(speedYaw),
////                z = this.z + playerVelocity* -Math.cos(speedYaw);
////            if (f(x, this.y, this.z)) this.x = x;
////            if (f(this.x, this.y, z)) this.z = z;
////        }
//////        var y = this.y + (keys.X||keys[16]?-1:keys[32]?1:0)*playerVelocity;
//////        this.y = y;
////        let f = (i, j, k) =>
////                this.world.getTile(i, j, k).name === "air" &&
////                this.world.getTile(i, j-1, k).name === "air";
////        var y = this.y + (keys[32]? 0.2: -0.1);
////        if (f(this.x, ~~y, this.z)) this.y = y;
////        else this.y = Math.round(y);
//
//        document.getElementById("out").innerHTML = `x: ${this.x}<br>y: ${this.y}<br>z: ${this.z}<br>yaw: ${this.yaw}<br>pitch: ${this.pitch}<br>fps: ${1 / delta}`;
//    };

}
