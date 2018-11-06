
import Entity from "/src/Entity/Entity.js";

export default class Player extends Entity {

    setControl(controller) {
        this.controller = controller;
        controler.addEventListener("mousedown", e => {});
        controler.addEventListener("mouseup", e => {});
        controler.addEventListener("mousemove", e => {
            var sensitivity = 360,//鼠标灵敏度
                i = sensitivity*(Math.PI/180);
            this.yaw -= (e.movementX || e.mozMovementX || e.webkitMovementX || 0) * i / controler.canvas.width;
            this.pitch -= (e.movementY || e.mozMovementY || e.webkitMovementY || 0) * i / controler.canvas.height;
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
        else if (keys.A || keys.S)
            speedYaw -= 90*(keys.A?-1:1);
        else if (keys.S)
            speedYaw *= Math.PI/180;

        var playerVelocity = 0.8;
        if (keys.A || keys.D || keys.S || keys.W) {
            this.x += playerVelocity* -Math.sin(speedYaw);
            this.z += playerVelocity* -Math.cos(speedYaw);
        }
        this.y += (keys.X||keys[16]?-1:keys[32]?1:0)*playerVelocity;
    };

}
