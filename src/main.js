
//page
import spa from "./UI/spa.js";
spa.enrollPageByDefault();

spa.enrollPage("about", "");
spa.addEventListener("about", "load", function(id) {
    alert("Dev by qinshou2017.");
    spa.openPage(id);
});

import blocks from "./Blocks/blocks.js";

//load resources
import "./UI/processingPictures.js";

//转由页面驱动
import {preloaded} from "./loadResources.js";
preloaded.onloadend(async _ => {
    await blocks.initBlocksByDefault();
    console.log("loadend");
    spa.openPage("start_game_page");
//    spa.openPage("loading_terrain_page");
});
