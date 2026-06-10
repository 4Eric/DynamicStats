<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useAppStore } from '../store';
import { useRoute } from 'vue-router';
import { calculateBattingStats, calculatePitchingStats } from '../utils/statsEngine';
import TrendChart from '../components/TrendChart.vue';
import GameRangeSelector from '../components/GameRangeSelector.vue';
import Card from '../components/Card.vue';

const store = useAppStore();
const route = useRoute();

const playerId = computed(() => route.params.id as string);
const player = computed(() => store.players.find(p => p.id === playerId.value));

const gameRange = ref<[number, number]>([1, Math.max(1, store.games.length)]);

// Keep gameRange updated if games are loaded later
watch(() => store.games.length, (newLength) => {
  if (newLength > 0 && gameRange.value[1] === 1 && gameRange.value[0] === 1) {
    gameRange.value = [1, newLength];
  }
});

const selectedGames = computed(() => {
  return store.games.filter(g => g.gameNumber >= gameRange.value[0] && g.gameNumber <= gameRange.value[1]);
});

const selectedGameIds = computed(() => new Set(selectedGames.value.map(g => g.id)));

const filteredBattingLines = computed(() => {
  return store.battingLines.filter(l => l.playerId === playerId.value && selectedGameIds.value.has(l.gameId));
});

const filteredPitchingLines = computed(() => {
  return store.pitchingLines.filter(l => l.playerId === playerId.value && selectedGameIds.value.has(l.gameId));
});

const battingStats = computed(() => calculateBattingStats(filteredBattingLines.value));
const pitchingStats = computed(() => calculatePitchingStats(filteredPitchingLines.value));

// Real trend data for batting average
const trendLabels = computed(() => {
  // Sort games by date ascending for the chart
  const games = [...selectedGames.value].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return games.map(g => {
    const d = new Date(g.date);
    return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', timeZone: 'UTC' }) + ` vs ${g.opponent}`;
  });
});

const avgTrendData = computed(() => {
  // We need to calculate running AVG up to each game in the selected range
  const games = [...selectedGames.value].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let runningHits = 0;
  let runningAB = 0;
  
  return games.map(g => {
    const line = filteredBattingLines.value.find(l => l.gameId === g.id);
    if (line) {
      runningHits += line.H;
      runningAB += line.AB;
    }
    return runningAB > 0 ? Number((runningHits / runningAB).toFixed(3)) : 0;
  });
});

const datasets = computed(() => [
  {
    label: 'Running AVG',
    data: avgTrendData.value,
    borderColor: '#3b82f6',
    backgroundColor: '#3b82f6',
  }
]);

// Game logs (sorted descending by game date)
const battingGameLogs = computed(() => {
  return [...filteredBattingLines.value].sort((a, b) => {
    const gameA = store.games.find(g => g.id === a.gameId);
    const gameB = store.games.find(g => g.id === b.gameId);
    if (!gameA || !gameB) return 0;
    return new Date(gameB.date).getTime() - new Date(gameA.date).getTime();
  }).map(line => {
    const game = store.games.find(g => g.id === line.gameId);
    return {
      date: game ? new Date(game.date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', timeZone: 'UTC' }) : '',
      opponent: game ? game.opponent : 'Unknown',
      ...line
    };
  });
});

const pitchingGameLogs = computed(() => {
  return [...filteredPitchingLines.value].sort((a, b) => {
    const gameA = store.games.find(g => g.id === a.gameId);
    const gameB = store.games.find(g => g.id === b.gameId);
    if (!gameA || !gameB) return 0;
    return new Date(gameB.date).getTime() - new Date(gameA.date).getTime();
  }).map(line => {
    const game = store.games.find(g => g.id === line.gameId);
    return {
      date: game ? new Date(game.date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', timeZone: 'UTC' }) : '',
      opponent: game ? game.opponent : 'Unknown',
      ...line
    };
  });
});
</script>

<template>
  <div v-if="player" class="space-y-6">
    <div class="bg-[#1a1a1a] border border-gray-800 rounded-xl p-8 flex items-center gap-6">
      <div v-if="player.number" class="w-20 h-20 bg-blue-900 text-blue-200 rounded-full flex items-center justify-center text-3xl font-bold">
        #{{ player.number }}
      </div>
      <div v-else class="w-20 h-20 bg-blue-900 text-blue-200 rounded-full flex items-center justify-center text-3xl font-bold">
        {{ player.name.charAt(0) }}
      </div>
      <div>
        <h2 class="text-3xl font-bold">
          {{ player.name }} 
          <span v-if="player.number" class="text-gray-500 font-normal">#{{ player.number }}</span>
        </h2>
        <div class="text-gray-400 mt-1 flex gap-2">
          <span v-for="pos in player.positions" :key="pos" class="bg-gray-800 px-2 py-1 rounded text-sm">{{ pos }}</span>
        </div>
      </div>
    </div>

    <GameRangeSelector v-model="gameRange" />

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <h3 class="text-lg font-bold mb-4 text-blue-400">Batting Stats</h3>
        <div class="grid grid-cols-4 gap-4 mb-6 font-mono-numbers">
          <div class="text-center">
            <div class="text-gray-400 text-xs">AVG</div>
            <div class="text-xl font-bold">{{ battingStats.AVG }}</div>
          </div>
          <div class="text-center">
            <div class="text-gray-400 text-xs">OPS</div>
            <div class="text-xl font-bold">{{ battingStats.OPS }}</div>
          </div>
          <div class="text-center">
            <div class="text-gray-400 text-xs">HR</div>
            <div class="text-xl font-bold">{{ battingStats.HR }}</div>
          </div>
          <div class="text-center">
            <div class="text-gray-400 text-xs">RBI</div>
            <div class="text-xl font-bold">{{ battingStats.RBI }}</div>
          </div>
        </div>
        <div class="border-t border-gray-800 pt-6">
          <h4 class="text-sm font-semibold mb-4 text-gray-400">Batting Average Trend</h4>
          <TrendChart :labels="trendLabels" :datasets="datasets" />
        </div>
      </Card>

      <Card>
        <h3 class="text-lg font-bold mb-4 text-emerald-400">Pitching Stats</h3>
        <div class="grid grid-cols-4 gap-4 mb-6 font-mono-numbers">
          <div class="text-center">
            <div class="text-gray-400 text-xs">ERA</div>
            <div class="text-xl font-bold">{{ pitchingStats.ERA }}</div>
          </div>
          <div class="text-center">
            <div class="text-gray-400 text-xs">WHIP</div>
            <div class="text-xl font-bold">{{ pitchingStats.WHIP }}</div>
          </div>
          <div class="text-center">
            <div class="text-gray-400 text-xs">K/9</div>
            <div class="text-xl font-bold">{{ pitchingStats.K9 }}</div>
          </div>
          <div class="text-center">
            <div class="text-gray-400 text-xs">IP</div>
            <div class="text-xl font-bold">{{ pitchingStats.IP_formatted }}</div>
          </div>
        </div>
      </Card>
    </div>

    <div class="space-y-6">
      <Card v-if="battingGameLogs.length > 0">
        <h3 class="text-lg font-bold mb-4 text-blue-400">Batting Game Log</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="text-xs text-gray-400 uppercase bg-gray-800/50">
              <tr>
                <th class="px-4 py-3">Date</th>
                <th class="px-4 py-3">Opponent</th>
                <th class="px-4 py-3">AB</th>
                <th class="px-4 py-3">R</th>
                <th class="px-4 py-3">H</th>
                <th class="px-4 py-3">RBI</th>
                <th class="px-4 py-3">BB</th>
                <th class="px-4 py-3">SO</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in battingGameLogs" :key="log.gameId" class="border-b border-gray-800 hover:bg-gray-800/30">
                <td class="px-4 py-3">{{ log.date }}</td>
                <td class="px-4 py-3">{{ log.opponent }}</td>
                <td class="px-4 py-3">{{ log.AB }}</td>
                <td class="px-4 py-3">{{ log.R }}</td>
                <td class="px-4 py-3">{{ log.H }}</td>
                <td class="px-4 py-3">{{ log.RBI }}</td>
                <td class="px-4 py-3">{{ log.BB }}</td>
                <td class="px-4 py-3">{{ log.SO }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Card v-if="pitchingGameLogs.length > 0">
        <h3 class="text-lg font-bold mb-4 text-emerald-400">Pitching Game Log</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="text-xs text-gray-400 uppercase bg-gray-800/50">
              <tr>
                <th class="px-4 py-3">Date</th>
                <th class="px-4 py-3">Opponent</th>
                <th class="px-4 py-3">IP</th>
                <th class="px-4 py-3">H</th>
                <th class="px-4 py-3">R</th>
                <th class="px-4 py-3">ER</th>
                <th class="px-4 py-3">BB</th>
                <th class="px-4 py-3">SO</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in pitchingGameLogs" :key="log.gameId" class="border-b border-gray-800 hover:bg-gray-800/30">
                <td class="px-4 py-3">{{ log.date }}</td>
                <td class="px-4 py-3">{{ log.opponent }}</td>
                <td class="px-4 py-3">{{ log.IP }}</td>
                <td class="px-4 py-3">{{ log.H }}</td>
                <td class="px-4 py-3">{{ log.R }}</td>
                <td class="px-4 py-3">{{ log.ER }}</td>
                <td class="px-4 py-3">{{ log.BB }}</td>
                <td class="px-4 py-3">{{ log.SO }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  </div>
  <div v-else class="text-center py-12 text-gray-400">
    Player not found.
  </div>
</template>
