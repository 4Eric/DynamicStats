<script setup lang="ts">

import { onMounted } from 'vue';
import { useAppStore } from './store';

const store = useAppStore();
onMounted(() => {
  store.fetchData();
});
</script>

<template>
  <div class="min-h-screen bg-[#242424] text-white">
    <header class="border-b border-gray-800 bg-[#1a1a1a] px-6 py-4">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <h1 class="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          DynamicStats
        </h1>
        <nav class="flex gap-4">
          <router-link to="/" class="text-gray-400 hover:text-white transition-colors" active-class="text-white font-medium">Dashboard</router-link>
          <router-link to="/games" class="text-gray-400 hover:text-white transition-colors" active-class="text-white font-medium">Games</router-link>
          <router-link to="/upload" class="text-gray-400 hover:text-white transition-colors" active-class="text-white font-medium">Upload Box Score</router-link>
        </nav>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 py-8">
      <router-view></router-view>
    </main>
  </div>
</template>
