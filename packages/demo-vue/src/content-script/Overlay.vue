<template>
  <div class="overlay">
    <message />
  </div>
</template>

<script lang="ts" setup>
import Message from "./Message.vue";
</script>

<style>
.overlay {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
}
</style>
