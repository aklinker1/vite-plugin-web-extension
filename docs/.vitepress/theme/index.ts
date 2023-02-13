import Theme from "vitepress/theme";
import { h } from "vue";
import GetStarted from "./components/GetStarted.vue";
import "./styles/vars.css";

export default {
  ...Theme,
  Layout() {
    return h(Theme.Layout, null, {
      "home-features-after": () => h(GetStarted),
    });
  },
};
