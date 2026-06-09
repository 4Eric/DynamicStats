<script setup lang="ts">
import { computed } from 'vue';
import Slider from '@vueform/slider';
import { useAppStore } from '../store';
import Card from './Card.vue';

const props = defineProps<{
  modelValue: number[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: number[]): void;
}>();

const store = useAppStore();

const maxGames = computed(() => Math.max(1, store.games.length));

const localRange = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

function setRange(start: number, end: number) {
  localRange.value = [start, end];
}

function getGameDate(gameNumber: number) {
  const game = store.games.find(g => g.gameNumber === gameNumber);
  if (!game || !game.date) return '';
  return new Date(game.date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}
</script>

<template>
  <Card class="sticky top-4 z-10 shadow-xl border border-gray-800/80 bg-gray-900/95 backdrop-blur-sm px-2 py-4">
    <div class="flex flex-col md:flex-row items-center gap-6">
      
      <div class="flex-shrink-0 text-center md:text-left min-w-[140px]">
        <h2 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Game Range</h2>
        <div class="text-lg font-bold">
          Games <span class="text-blue-400">{{ localRange[0] }}</span> - <span class="text-blue-400">{{ localRange[1] }}</span>
        </div>
        <div class="text-xs text-gray-400 font-medium">
          {{ getGameDate(localRange[0]) }}<span v-if="getGameDate(localRange[0]) && getGameDate(localRange[1])"> &rarr; </span>{{ getGameDate(localRange[1]) }}
        </div>
      </div>
      
      <div class="flex-grow w-full px-4 relative flex flex-col justify-center pt-2">
         <Slider v-model="localRange" :min="1" :max="maxGames" :step="1" class="slider-blue mb-2" />
         <div class="flex justify-between px-1.5 opacity-50 mt-1 pointer-events-none">
           <span v-for="tick in maxGames" :key="'tick-'+tick" class="w-[2px] h-[4px] bg-gray-500 rounded-full"></span>
         </div>
      </div>

      <div class="flex flex-shrink-0 gap-2">
        <button @click="setRange(Math.max(1, maxGames - 4), maxGames)" class="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg transition-all duration-200 font-medium">Last 5</button>
        <button @click="setRange(Math.max(1, maxGames - 9), maxGames)" class="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg transition-all duration-200 font-medium">Last 10</button>
        <button @click="setRange(1, maxGames)" class="text-xs bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 px-3 py-2 rounded-lg transition-all duration-200 font-medium">All Games</button>
      </div>

    </div>
  </Card>
</template>
