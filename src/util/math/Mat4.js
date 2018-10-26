
export default class Mat4 extends Float32Array {
    constructor(...args){
        if(args.length===0) super(16);
        else if(args.length===16) super(args);
        else switch(({}).toString.apply(args[0])){
            case "[object Number]":
                super(16);
                if(args.length<16) args.forEach((c,i)=>{this[i]=c;});
                else for(let i=0;i<16;++i) this[i]=args[i];
                break;
            case "[object Array]":
            case "[object Float32Array]":
                args=args[0];
                if(args.length===16) super(args);
                else{
                    super(16);
                    if(args.length<16) args.forEach((c,i)=>{this[i]=c;});
                    else for(let i=0;i<16;++i) this[i]=args[i];
                }
                break;
            default:
                super(16);
        }
    };

    ["*="](mat4){
        if(mat4 instanceof Float32Array && mat4.length===16){
            var a = this[0],  b = this[1],  c = this[2],  d = this[3],
                e = this[4],  f = this[5],  g = this[6],  h = this[7],
                i = this[8],  j = this[9],  k = this[10], l = this[11],
                m = this[12], n = this[13], o = this[14], p = this[15],
                A = mat4[0],  B = mat4[1],  C = mat4[2],  D = mat4[3],
                E = mat4[4],  F = mat4[5],  G = mat4[6],  H = mat4[7],
                I = mat4[8],  J = mat4[9],  K = mat4[10], L = mat4[11],
                M = mat4[12], N = mat4[13], O = mat4[14], P = mat4[15];
            this[0] = A * a + B * e + C * i + D * m;
            this[1] = A * b + B * f + C * j + D * n;
            this[2] = A * c + B * g + C * k + D * o;
            this[3] = A * d + B * h + C * l + D * p;
            this[4] = E * a + F * e + G * i + H * m;
            this[5] = E * b + F * f + G * j + H * n;
            this[6] = E * c + F * g + G * k + H * o;
            this[7] = E * d + F * h + G * l + H * p;
            this[8] = I * a + J * e + K * i + L * m;
            this[9] = I * b + J * f + K * j + L * n;
            this[10]= I * c + J * g + K * k + L * o;
            this[11]= I * d + J * h + K * l + L * p;
            this[12]= M * a + N * e + O * i + P * m;
            this[13]= M * b + N * f + O * j + P * n;
            this[14]= M * c + N * g + O * k + P * o;
            this[15]= M * d + N * h + O * l + P * p;
        }
        else if(typeof mat4==="number"){
            this[0] *= mat4,this[1] *= mat4,this[2] *= mat4,this[3] *= mat4,
            this[4] *= mat4,this[5] *= mat4,this[6] *= mat4,this[7] *= mat4,
            this[8] *= mat4,this[9] *= mat4,this[10]*= mat4,this[11]*= mat4,
            this[12]*= mat4,this[13]*= mat4,this[14]*= mat4,this[15]*= mat4
        }
        else throw "multiply: mat4不能与"+mat4+"相乘";
        return this;
    };
    Cmultiply(mat4){return this["*="];};
    Cmul(mat4){return this["*="];};
    multiply(mat4){
        if(mat4 instanceof Float32Array && mat4.length===16){
            var a = this[0],  b = this[1],  c = this[2],  d = this[3],
                e = this[4],  f = this[5],  g = this[6],  h = this[7],
                i = this[8],  j = this[9],  k = this[10], l = this[11],
                m = this[12], n = this[13], o = this[14], p = this[15],
                A = mat4[0],  B = mat4[1],  C = mat4[2],  D = mat4[3],
                E = mat4[4],  F = mat4[5],  G = mat4[6],  H = mat4[7],
                I = mat4[8],  J = mat4[9],  K = mat4[10], L = mat4[11],
                M = mat4[12], N = mat4[13], O = mat4[14], P = mat4[15];
            return new Mat4(
                A * a + B * e + C * i + D * m,
                A * b + B * f + C * j + D * n,
                A * c + B * g + C * k + D * o,
                A * d + B * h + C * l + D * p,
                E * a + F * e + G * i + H * m,
                E * b + F * f + G * j + H * n,
                E * c + F * g + G * k + H * o,
                E * d + F * h + G * l + H * p,
                I * a + J * e + K * i + L * m,
                I * b + J * f + K * j + L * n,
                I * c + J * g + K * k + L * o,
                I * d + J * h + K * l + L * p,
                M * a + N * e + O * i + P * m,
                M * b + N * f + O * j + P * n,
                M * c + N * g + O * k + P * o,
                M * d + N * h + O * l + P * p
            );
        }
        else if(typeof mat4==="number")
            return new Mat4(
                this[0] *mat4,this[1] *mat4,this[2] *mat4,this[3] *mat4,
                this[4] *mat4,this[5] *mat4,this[6] *mat4,this[7] *mat4,
                this[8] *mat4,this[9] *mat4,this[10]*mat4,this[11]*mat4,
                this[12]*mat4,this[13]*mat4,this[14]*mat4,this[15]*mat4
            );
        else throw "multiply: mat4不能与"+mat4+"相乘";
    };
    mul(mat4){return this.multiply(mat4);};
    ["*"](mat4){return this.multiply(mat4);};

    static identity(){
        return new Mat4(
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        );
    };
    static get identity(){return Mat4.identity();};
    identity(){
        this[0] =1; this[1] =0; this[2] =0; this[3] =0;
        this[4] =0; this[5] =1; this[6] =0; this[7] =0;
        this[8] =0; this[9] =0; this[10]=1; this[11]=0;
        this[12]=0; this[13]=0; this[14]=0; this[15]=1;
        return this;
    };
    get ["=e"](){return this.identity();};
    get ["=i"](){return this.identity();};

    get ["=o"](){
        for(var i=0;i<16;++i) this[i]=0;
        return this;
    };
    get ["=0"](){return this["=o"];};

    Cscale(vec3){};
    scale(vec3){
        var a=vec3[0],b=vec3[1],c=vec3[2];
        return new Mat4(
            this[0]*a,this[1]*a,this[2] *a,this[3] *a,
            this[4]*b,this[5]*b,this[6] *b,this[7] *b,
            this[8]*c,this[9]*c,this[10]*c,this[11]*c,
            this[12] ,this[13] ,this[14]  ,this[15]
        );
    };

    Ctranslate(vec3){
        var a=vec3[0],b=vec3[1],c=vec3[2];
        this[12]+=this[0]*a +this[4]*b + this[8] *c;
        this[13]+=this[1]*a +this[5]*b + this[9] *c;
        this[14]+=this[2]*a +this[6]*b + this[10]*c;
        this[15]+=this[3]*a +this[7]*b + this[11]*c;
        return this;
    };
    translate(vec3){
        var a=vec3[0],b=vec3[1],c=vec3[2];
        return new Mat4(
            this[0],this[1],this[2] ,this[3] ,
            this[4],this[5],this[6] ,this[7] ,
            this[8],this[9],this[10],this[11],
            this[0]*a +this[4]*b + this[8] *c +this[12],
            this[1]*a +this[5]*b + this[9] *c +this[13],
            this[2]*a +this[6]*b + this[10]*c +this[14],
            this[3]*a +this[7]*b + this[11]*c +this[15]
        );
    };

    Crotate(angle,axis){
        var sq = Math.sqrt(axis[0] * axis[0] + axis[1] * axis[1] + axis[2] * axis[2]);
        if(!sq) return this;
        var a = axis[0], b = axis[1], c = axis[2];
        if(sq != 1){sq = 1 / sq; a *= sq; b *= sq; c *= sq;}
        var d = Math.sin(angle), e = Math.cos(angle), f = 1 - e,
            g = this[0],  h = this[1], i = this[2],  j = this[3],
            k = this[4],  l = this[5], m = this[6],  n = this[7],
            o = this[8],  p = this[9], q = this[10], r = this[11],
            s = a * a * f + e,
            t = b * a * f + c * d,
            u = c * a * f - b * d,
            v = a * b * f - c * d,
            w = b * b * f + e,
            x = c * b * f + a * d,
            y = a * c * f + b * d,
            z = b * c * f - a * d,
            A = c * c * f + e;
        this[0] = g * s + k * t + o * u;
        this[1] = h * s + l * t + p * u;
        this[2] = i * s + m * t + q * u;
        this[3] = j * s + n * t + r * u;
        this[4] = g * v + k * w + o * x;
        this[5] = h * v + l * w + p * x;
        this[6] = i * v + m * w + q * x;
        this[7] = j * v + n * w + r * x;
        this[8] = g * y + k * z + o * A;
        this[9] = h * y + l * z + p * A;
        this[10]= i * y + m * z + q * A;
        this[11]= j * y + n * z + r * A;
        return this;
    };
    rotate(angle,axis){
        var sq = Math.sqrt(axis[0] * axis[0] + axis[1] * axis[1] + axis[2] * axis[2]);
        if(!sq) return null;
        var a = axis[0], b = axis[1], c = axis[2];
        if(sq != 1) { sq = 1 / sq; a *= sq; b *= sq; c *= sq; }
        var d = Math.sin(angle), e = Math.cos(angle), f = 1 - e,
            g = this[0],  h = this[1], i = this[2],  j = this[3],
            k = this[4],  l = this[5], m = this[6],  n = this[7],
            o = this[8],  p = this[9], q = this[10], r = this[11],
            s = a * a * f + e,
            t = b * a * f + c * d,
            u = c * a * f - b * d,
            v = a * b * f - c * d,
            w = b * b * f + e,
            x = c * b * f + a * d,
            y = a * c * f + b * d,
            z = b * c * f - a * d,
            A = c * c * f + e;
        return new Mat4(
            g * s + k * t + o * u,
            h * s + l * t + p * u,
            i * s + m * t + q * u,
            j * s + n * t + r * u,
            g * v + k * w + o * x,
            h * v + l * w + p * x,
            i * v + m * w + q * x,
            j * v + n * w + r * x,
            g * y + k * z + o * A,
            h * y + l * z + p * A,
            i * y + m * z + q * A,
            j * y + n * z + r * A,
            this[12],this[13],this[14],this[15]
        );
    };

    lookAt(eye, center, up){
        var eyeX = eye[0], eyeY = eye[1], eyeZ = eye[2],
            upX = up[0], upY = up[1], upZ = up[2],
            centerX = center[0], centerY = center[1], centerZ = center[2];
        if(eyeX == centerX && eyeY == centerY && eyeZ == centerZ)
            return Mat4.identity();
        var x0, x1, x2, y0, y1, y2, z0, z1, z2, l;
        z0 = eyeX - center[0]; z1 = eyeY - center[1]; z2 = eyeZ - center[2];
        l = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
        z0 *= l; z1 *= l; z2 *= l;
        x0 = upY * z2 - upZ * z1;
        x1 = upZ * z0 - upX * z2;
        x2 = upX * z1 - upY * z0;
        l = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
        if(!l) { x0 = 0; x1 = 0; x2 = 0; }
        else { l = 1 / l; x0 *= l; x1 *= l; x2 *= l; }
        y0 = z1 * x2 - z2 * x1; y1 = z2 * x0 - z0 * x2; y2 = z0 * x1 - z1 * x0;
        l = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
        if(!l) { y0 = 0; y1 = 0; y2 = 0; }
        else{ l = 1 / l; y0 *= l; y1 *= l; y2 *= l; }
        return new Mat4(
            x0, y0, z0, 0,
            x1, y1, z1, 0,
            x2, y2, z2, 0,
            -(x0 * eyeX + x1 * eyeY + x2 * eyeZ),
            -(y0 * eyeX + y1 * eyeY + y2 * eyeZ),
            -(z0 * eyeX + z1 * eyeY + z2 * eyeZ),
            1
        );
    };
    ClookAt(eye, center, up){
        var eyeX = eye[0], eyeY = eye[1], eyeZ = eye[2],
            upX = up[0], upY = up[1], upZ = up[2],
            centerX = center[0], centerY = center[1], centerZ = center[2];
        if(eyeX == centerX && eyeY == centerY && eyeZ == centerZ){
//                this.identity.call(this);
//                return;
            return this.identity();
        }
        var x0, x1, x2, y0, y1, y2, z0, z1, z2, l;
        z0 = eyeX - center[0]; z1 = eyeY - center[1]; z2 = eyeZ - center[2];
        l = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
        z0 *= l; z1 *= l; z2 *= l;
        x0 = upY * z2 - upZ * z1;
        x1 = upZ * z0 - upX * z2;
        x2 = upX * z1 - upY * z0;
        l = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
        if(!l) { x0 = 0; x1 = 0; x2 = 0; }
        else { l = 1 / l; x0 *= l; x1 *= l; x2 *= l; }
        y0 = z1 * x2 - z2 * x1; y1 = z2 * x0 - z0 * x2; y2 = z0 * x1 - z1 * x0;
        l = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
        if(!l) { y0 = 0; y1 = 0; y2 = 0; }
        else { l = 1 / l; y0 *= l; y1 *= l; y2 *= l; }
        this[0]=x0; this[1]=y0; this[2]=z0; this[3]=0;
        this[4]=x1; this[5]=y1; this[6]=z1; this[7]=0;
        this[8]=x2; this[9]=y2; this[10]=z2;this[11]=0;
        this[12]=-(x0 * eyeX + x1 * eyeY + x2 * eyeZ);
        this[13]=-(y0 * eyeX + y1 * eyeY + y2 * eyeZ);
        this[14]=-(z0 * eyeX + z1 * eyeY + z2 * eyeZ);
        this[15]=1;
        return this;
    };

    perspective(fovy, aspect, near, far){
        //这里既没有检测tan的返回值是否合法 也没有检测abc是否不为0
        var t = near * Math.tan(fovy * Math.PI / 360);
        var r = t * aspect;
        var a = r * 2, b = t * 2, c = far - near;
        return new Mat4(
            near*2/a,0       ,0              , 0,
            0       ,near*2/b,0              , 0,
            0       ,0       ,-(far+near)/c  ,-1,
            0       ,0       ,-(far*near*2)/c, 0
        );
    };
    Cperspective(fovy, aspect, near, far){
        //这里既没有检测tan的返回值是否合法 也没有检测abc是否不为0
        var t = near * Math.tan(fovy * Math.PI / 360);
        var r = t * aspect;
        var a = r * 2, b = t * 2, c = far - near;
        this[0]=near*2/a;this[1] =0      ;this[2] =0              ;this[3] = 0;
        this[4] =0      ;this[5]=near*2/b;this[6] =0              ;this[7] = 0;
        this[8] =0      ;this[9] =0      ;this[10]=-(far+near)/c  ;this[11]=-1;
        this[12]=0      ;this[13]=0      ;this[14]=-(far*near*2)/c;this[15]= 0;
        return this;
    };

    transpose(){
        return new Mat4(
            this[0],this[4],this[8] ,this[12],
            this[1],this[5],this[9] ,this[13],
            this[2],this[6],this[10],this[14],
            this[3],this[7],this[11],this[15]
        );
    };
    Ctranspose(){};

    inverse(){
        var a = this[0],  b = this[1],  c = this[2],  d = this[3],
            e = this[4],  f = this[5],  g = this[6],  h = this[7],
            i = this[8],  j = this[9],  k = this[10], l = this[11],
            m = this[12], n = this[13], o = this[14], p = this[15],
            q = a * f - b * e, r = a * g - c * e,
            s = a * h - d * e, t = b * g - c * f,
            u = b * h - d * f, v = c * h - d * g,
            w = i * n - j * m, x = i * o - k * m,
            y = i * p - l * m, z = j * o - k * n,
            A = j * p - l * n, B = k * p - l * o,
            ivd = q * B - r * A + s * z + t * y - u * x + v * w;
        if(!ivd) return null;
        ivd=1/ivd;
        return new Mat4(
            ( f * B - g * A + h * z) * ivd,
            (-b * B + c * A - d * z) * ivd,
            ( n * v - o * u + p * t) * ivd,
            (-j * v + k * u - l * t) * ivd,
            (-e * B + g * y - h * x) * ivd,
            ( a * B - c * y + d * x) * ivd,
            (-m * v + o * s - p * r) * ivd,
            ( i * v - k * s + l * r) * ivd,
            ( e * A - f * y + h * w) * ivd,
            (-a * A + b * y - d * w) * ivd,
            ( m * u - n * s + p * q) * ivd,
            (-i * u + j * s - l * q) * ivd,
            (-e * z + f * x - g * w) * ivd,
            ( a * z - b * x + c * w) * ivd,
            (-m * t + n * r - o * q) * ivd,
            ( i * t - j * r + k * q) * ivd
        );
    };
    Cinverse(){
        var a = this[0],  b = this[1],  c = this[2],  d = this[3],
            e = this[4],  f = this[5],  g = this[6],  h = this[7],
            i = this[8],  j = this[9],  k = this[10], l = this[11],
            m = this[12], n = this[13], o = this[14], p = this[15],
            q = a * f - b * e, r = a * g - c * e,
            s = a * h - d * e, t = b * g - c * f,
            u = b * h - d * f, v = c * h - d * g,
            w = i * n - j * m, x = i * o - k * m,
            y = i * p - l * m, z = j * o - k * n,
            A = j * p - l * n, B = k * p - l * o,
            ivd = q * B - r * A + s * z + t * y - u * x + v * w;
        if(!ivd) return null;
        ivd=1/ivd;
        this[0] =( f * B - g * A + h * z) * ivd;
        this[1] =(-b * B + c * A - d * z) * ivd;
        this[2] =( n * v - o * u + p * t) * ivd;
        this[3] =(-j * v + k * u - l * t) * ivd;
        this[4] =(-e * B + g * y - h * x) * ivd;
        this[5] =( a * B - c * y + d * x) * ivd;
        this[6] =(-m * v + o * s - p * r) * ivd;
        this[7] =( i * v - k * s + l * r) * ivd;
        this[8] =( e * A - f * y + h * w) * ivd;
        this[9] =(-a * A + b * y - d * w) * ivd;
        this[10]=( m * u - n * s + p * q) * ivd;
        this[11]=(-i * u + j * s - l * q) * ivd;
        this[12]=(-e * z + f * x - g * w) * ivd;
        this[13]=( a * z - b * x + c * w) * ivd;
        this[14]=(-m * t + n * r - o * q) * ivd;
        this[15]=( i * t - j * r + k * q) * ivd;
        return this;
    };

    lookat(playercoordinate,x_yaw,y_pitch,dump=0){
        var out=new Mat4(this);
        out.Ctranslate(playercoordinate)
           .Crotate(x_yaw,[0,1,0])
           .Crotate(y_pitch,[1,0,0]);
        if(dump) out
           .Crotate(dump*Math.PI/180,[Math.sin(x_yaw),0,-Math.cos(y_pitch)]);
        out.Cinverse();
        return out;
    };
}
