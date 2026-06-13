<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAppStore } from '../store';
import { calculateBattingStats } from '../utils/statsEngine';

const store = useAppStore();

const selectedPlayerIds = ref<number[]>([]);
const generatedLineup = ref<any[]>([]);

// Filter unique players, sorted alphabetically
const availablePlayers = computed(() => {
  return [...store.players].sort((a, b) => {
    // If names have numbers, just sort alphabetically anyway
    return a.name.localeCompare(b.name);
  });
});

function togglePlayer(playerId: number) {
  const index = selectedPlayerIds.value.indexOf(playerId);
  if (index === -1) {
    selectedPlayerIds.value.push(playerId);
  } else {
    selectedPlayerIds.value.splice(index, 1);
  }
}

function selectAll() {
  selectedPlayerIds.value = availablePlayers.value.map(p => p.id);
}

function clearSelection() {
  selectedPlayerIds.value = [];
  generatedLineup.value = [];
}

function getPlayerStats(playerId: number) {
  const lines = store.battingLines.filter(line => line.playerId === playerId);
  return calculateBattingStats(lines);
}

function generateLineup() {
  if (selectedPlayerIds.value.length < 9) {
    alert("Please select at least 9 players to generate a standard lineup.");
    return;
  }

  const statsList = selectedPlayerIds.value.map(id => {
    const player = store.players.find(p => p.id === id);
    const stats = getPlayerStats(id);
    return {
      player,
      stats,
      opsNum: parseFloat(stats.OPS) || 0,
      obpNum: parseFloat(stats.OBP) || 0,
      slgNum: parseFloat(stats.SLG) || 0,
      avgSlgNum: (parseFloat(stats.AVG) || 0) + (parseFloat(stats.SLG) || 0)
    };
  });

  let pool = [...statsList];
  const finalLineup = [];

  // #1: Leadoff (Highest OBP)
  pool.sort((a, b) => b.obpNum - a.obpNum);
  const leadoff = pool.shift();
  finalLineup.push({ ...leadoff, role: 'Leadoff', reason: `Highest OBP: ${leadoff!.stats.OBP}` });

  // #2: Best Overall Hitter (Highest OPS remaining)
  pool.sort((a, b) => b.opsNum - a.opsNum);
  const second = pool.shift();
  finalLineup.push({ ...second, role: '#2 Hitter', reason: `Highest OPS: ${second!.stats.OPS}` });

  // #3: Reliable Hitter (Highest AVG+SLG remaining)
  pool.sort((a, b) => b.avgSlgNum - a.avgSlgNum);
  const third = pool.shift();
  finalLineup.push({ ...third, role: '#3 Hitter', reason: `High AVG+SLG: ${(third!.avgSlgNum).toFixed(3).replace(/^0/, '')}` });

  // #4: Cleanup (Highest SLG remaining)
  pool.sort((a, b) => b.slgNum - a.slgNum);
  const cleanup = pool.shift();
  finalLineup.push({ ...cleanup, role: 'Cleanup', reason: `Highest SLG: ${cleanup!.stats.SLG}` });

  // #5: Protection (Highest OPS remaining)
  pool.sort((a, b) => b.opsNum - a.opsNum);
  const fifth = pool.shift();
  finalLineup.push({ ...fifth, role: '#5 Hitter', reason: `Protection OPS: ${fifth!.stats.OPS}` });

  // #6 to N-1: Descending OPS
  pool.sort((a, b) => b.opsNum - a.opsNum);
  while (pool.length > 1) {
    const next = pool.shift();
    finalLineup.push({ ...next, role: `Middle/Bottom`, reason: `OPS: ${next!.stats.OPS}` });
  }

  // Last: Secondary Leadoff (Highest OBP of remaining, which is just the 1 left)
  if (pool.length === 1) {
    const last = pool.shift();
    finalLineup.push({ ...last, role: 'Secondary Leadoff', reason: `OBP: ${last!.stats.OBP}` });
  }

  generatedLineup.value = finalLineup;
}
</script>

<template>
  <div class="space-y-6 max-w-5xl mx-auto">
    <div class="flex justify-between items-end">
      <div>
        <h2 class="text-3xl font-bold mb-2">AI Lineup Optimizer</h2>
        <p class="text-gray-400">Select the players attending today's game to generate a sabermetrically optimized batting order.</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      <!-- Left Column: Player Selection -->
      <div class="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold text-gray-200">Available Players</h3>
          <div class="space-x-2">
            <button @click="selectAll" class="text-sm px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded transition-colors text-gray-300">Select All</button>
            <button @click="clearSelection" class="text-sm px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded transition-colors text-gray-300">Clear</button>
          </div>
        </div>

        <div class="text-sm text-gray-400 mb-4">
          Selected: <span class="font-bold text-white">{{ selectedPlayerIds.length }}</span>
        </div>

        <div class="max-h-[500px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          <label 
            v-for="player in availablePlayers" 
            :key="player.id"
            class="flex items-center p-3 rounded-lg border cursor-pointer transition-colors"
            :class="selectedPlayerIds.includes(player.id) ? 'bg-blue-900/20 border-blue-500/50' : 'bg-[#242424] border-gray-800 hover:border-gray-700'"
          >
            <input 
              type="checkbox" 
              class="hidden"
              :checked="selectedPlayerIds.includes(player.id)"
              @change="togglePlayer(player.id)"
            />
            <div class="w-5 h-5 rounded border mr-3 flex items-center justify-center transition-colors"
                 :class="selectedPlayerIds.includes(player.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-600'">
              <svg v-if="selectedPlayerIds.includes(player.id)" class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div class="font-medium text-gray-200">{{ player.name }}</div>
          </label>
        </div>

        <button 
          @click="generateLineup"
          class="w-full mt-6 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg shadow-blue-500/20 flex justify-center items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          Generate Optimized Lineup
        </button>
      </div>

      <!-- Right Column: Generated Lineup -->
      <div class="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 flex flex-col">
        <h3 class="text-xl font-bold text-gray-200 mb-6">Optimized Order</h3>

        <div v-if="generatedLineup.length === 0" class="flex-1 flex flex-col items-center justify-center text-gray-500">
          <svg class="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
          <p>Select players and generate a lineup to see results here.</p>
        </div>

        <div v-else class="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div 
            v-for="(item, index) in generatedLineup" 
            :key="item.player.id"
            class="flex items-center bg-[#242424] border border-gray-800 rounded-lg p-3 relative overflow-hidden group"
          >
            <!-- Position Number -->
            <div class="flex-shrink-0 w-8 h-8 rounded-full bg-gray-800 text-gray-300 font-bold flex items-center justify-center mr-4">
              {{ index + 1 }}
            </div>

            <!-- Player Info -->
            <div class="flex-1">
              <div class="font-bold text-white text-lg">{{ item.player.name }}</div>
              <div class="text-xs font-semibold uppercase tracking-wider"
                   :class="{
                     'text-emerald-400': item.role === 'Leadoff',
                     'text-blue-400': item.role === '#2 Hitter',
                     'text-purple-400': item.role === 'Cleanup',
                     'text-amber-400': item.role === '#3 Hitter',
                     'text-orange-400': item.role === '#5 Hitter',
                     'text-gray-500': item.role === 'Middle/Bottom',
                     'text-indigo-400': item.role === 'Secondary Leadoff'
                   }">
                {{ item.role }}
              </div>
            </div>

            <!-- Reason/Stat -->
            <div class="text-right ml-4">
              <div class="text-sm font-mono text-gray-400 bg-gray-800/50 px-2 py-1 rounded">
                {{ item.reason }}
              </div>
            </div>
            
            <!-- Subtle accent border left based on role -->
            <div class="absolute left-0 top-0 bottom-0 w-1 opacity-50"
                 :class="{
                   'bg-emerald-500': item.role === 'Leadoff',
                   'bg-blue-500': item.role === '#2 Hitter',
                   'bg-purple-500': item.role === 'Cleanup',
                   'bg-amber-500': item.role === '#3 Hitter',
                   'bg-orange-500': item.role === '#5 Hitter',
                   'bg-transparent': item.role === 'Middle/Bottom',
                   'bg-indigo-500': item.role === 'Secondary Leadoff'
                 }"></div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
