
import asyncLoadResByUrl from "/src/loadResources.js";
var defaultBlockTextureImg = null;
asyncLoadResByUrl("res/texture/terrain-atlas.png").then(img => defaultBlockTextureImg = img);

const BlockRenderType = {
    NORMAL: Symbol("block render type: normal"),

};
var blocksCfg = null;
asyncLoadResByUrl("res/config/blocks.json").then(obj => {
    obj.index_renderType = [];
    var brty = obj.block_renderType_index;
    for (let type in brty) {
        obj.index_renderType[brty[type]] = BlockRenderType[type.toUpperCase()];
    }
    var bs = obj.blocks;
    for (let name in bs) {
        if ("renderType" in bs[name])
            bs[name].renderType = obj.index_renderType[bs[name].renderType];
    }
    var brtv = obj.block_renderType_vertex;
    obj.vertexs = {
        [BlockRenderType.NORMAL]:
            ("x+:2763,x-:0541,y+:0123,y-:4567,z+:1472,z-:3650")
            .split(",").map(s => s.split(":"))
            .map(([k, vs]) => {
//                return ({[k]: [...vs].map(i => brtv.normal[i]).flat()});
                return ({[k]: [...vs].map(i => brtv.normal[i]).reduce((ac, d) => {ac.push(...d); return ac;},[])});
            })
            .reduce((ac, o) => ({...ac, ...o}), {})
    };
    blocksCfg = obj;
});

function blockTextureCoord2uv(block) {
    for (let texture of block.texture.coordinate) {
        let [x, y] = texture;
        texture[0] = y-1; texture[1] = x-1;
    }
    var {texture, texture: {img: texImg, uv, coordinate}} = block,
        textureSize = [16*texImg.height/256, texImg.width, texImg.height],
        xsize = 1/(textureSize[1]/textureSize[0]),
        ysize = 1/(textureSize[2]/textureSize[0]),
        //x和y的偏移坐标 防止出现边缘黑条或白线
        dx = (_ => {
            var out = 1, i = xsize;
            for(; ~~i!=i; i*=10) out/=10;
            return out*10;
        })(),
        dy = (_ => {
            var out = 1, i = ysize;
            for(; ~~i!=i; i*=10) out/=10;
            return out;
        })();

    switch (block.renderType) {
        case BlockRenderType.NORMAL: {
            var cr2uv = ([x, y]) => [
                    x*xsize+dx,     y*ysize+dy,
                    x*xsize+dx,     (y+1)*ysize-dy,
                    (x+1)*xsize-dx, (y+1)*ysize-dy,
                    (x+1)*xsize-dx, y*ysize+dy
                ];
            if (coordinate.length === 1) {
                var uvw = cr2uv(coordinate[0]);
                "x+,x-,y+,y-,z+,z-".split(",").map(k => uv[k] = uvw);
            }
            else if (coordinate.length === 3) {
                uv["y+"] = cr2uv(coordinate[0]);
                uv["y-"] = cr2uv(coordinate[1]);
                var uvw = cr2uv(coordinate[2]);
                "x+,x-,z+,z-".split(",").forEach(k => uv[k] = uvw);
            }
            else if (coordinate.length === 6) {
                "x+,x-,y+,y-,z+,z-".split(",").forEach((k, i) => uv[k] = cr2uv(coordinate[i]));
            }
            else throw block.name + " texture translate error: array length";
            break;
        }
    }
}

export default class Block {
    constructor(blockName, {
        opacity = 16,
        luminance = 0,
        renderType = Block.renderType.NORMAL,
        textureImg = defaultBlockTextureImg,
        texture = [[16, 32]]
    }) {
        this.name = blockName;
        this.renderType = renderType;
        this.vertex = blocksCfg.vertexs[renderType];
        this.texture = {
            img: defaultBlockTextureImg,
            uv: {},
            coordinate: texture
        };
        blockTextureCoord2uv(this);
        this.opacity = opacity;
        this.luminance = luminance;
    };

    static get renderType() {
        return BlockRenderType;
    }
}
