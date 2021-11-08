import debounce from "lodash.debounce";

function test2() {
  console.log("Test");
}

export const test = debounce(test2);
