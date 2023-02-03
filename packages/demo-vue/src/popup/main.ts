/* JS files and framework components are HMR-ed */

import { createApp } from "vue";
import Popup from "./Popup.vue";

console.log("Loaded popup/main.ts");

createApp(Popup).mount("#app");
