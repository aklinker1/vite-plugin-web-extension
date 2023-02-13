<template>
  <div class="GetStarted">
    <div class="container vp-doc">
      <IndexGetStarted />
    </div>
  </div>
</template>

<script setup>
import IndexGetStarted from "./GetStarted.md";

console.log(IndexGetStarted);
</script>

<style scoped>
.GetStarted {
  position: relative;
  padding: 0 24px;
}
@media (min-width: 640px) {
  .GetStarted {
    padding: 0 48px;
  }
}
@media (min-width: 960px) {
  .GetStarted {
    padding: 0 64px;
  }
}
.container {
  margin: 0 auto;
  max-width: 1152px;
}
</style>
