
//page
import spa from "./UI/spa.js";
spa.enrollPageByDefault();

import blocks from "/src/Blocks/blocks.js";

//load resources
import "/src/UI/processingPictures.js";

//转由页面驱动
import {preloaded} from "./loadResources.js";
preloaded.onloadend(_ => {
    blocks.initBlocksByDefault();
    console.log("loadend");
    spa.openPage("start_game_page");
});
