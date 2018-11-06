
import Block from "./Block.js";

const BLOCKS = {};

const blocks = {
    initBlocksByDefault() {
        import("/src/loadResources.js")
        .then(({asyncLoadResByUrl}) => asyncLoadResByUrl("res/config/blocks.json"))
        .then(cfg => {
            Object.entries(cfg.blocks).forEach(([k, v]) => {
                this.enrollBlock(new Block(k, v));
            });
        });
    },
    enrollBlock(block) {
        BLOCKS[block.name] = block;
    },
    getBlockByBlockName(blockName) {
        return BLOCKS[blockName];
    }
};

export {
    blocks as default,
    blocks
};
