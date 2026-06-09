<script setup lang="ts">
defineProps<{
  padding?: string;
}>();
</script>

<template>
  <div class="bg-gray-900 border border-gray-800 rounded-xl" :class="padding || 'p-6'">
    <slot></slot>
  </div>
</template>
