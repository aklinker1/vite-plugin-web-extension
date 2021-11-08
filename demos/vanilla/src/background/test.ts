import debounce from "lodash.debounce";

function test2() {
  console.log("Test 2");
}

export const test = debounce(test2);
