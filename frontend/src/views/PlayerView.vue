<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useAppStore } from '../store';
import { useRoute } from 'vue-router';
import { calculateBattingStats, calculatePitchingStats, parseIP } from '../utils/statsEngine';
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

const selectedStat = ref('AVG');
const statOptions = [
  { label: 'Batting Average (AVG)', value: 'AVG' },
  { label: 'On-Base Pct (OBP)', value: 'OBP' },
  { label: 'Slugging Pct (SLG)', value: 'SLG' },
  { label: 'On-Base + Slugging (OPS)', value: 'OPS' },
  { label: 'Earned Run Average (ERA)', value: 'ERA' },
  { label: 'WHIP', value: 'WHIP' },
  { label: 'Strikeouts per 6 (K/6)', value: 'K6' }
];

// Real trend data
const trendLabels = computed(() => {
  // Sort games by date ascending for the chart
  const games = [...selectedGames.value].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return games.map(g => {
    const d = new Date(g.date);
    return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', timeZone: 'UTC' }) + ` vs ${g.opponent}`;
  });
});

const trendData = computed(() => {
  const games = [...selectedGames.value].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  let rAB = 0, rH = 0, rBB = 0, rHBP = 0, rTB = 0;
  let rIP = 0, rER = 0, rPitchH = 0, rPitchBB = 0, rSO = 0;

  return games.map(g => {
    const bLine = filteredBattingLines.value.find(l => l.gameId === g.id);
    if (bLine) {
      rAB += bLine.AB; rH += bLine.H; rBB += bLine.BB; rHBP += (bLine.HBP || 0); rTB += bLine.TB;
    }
    
    const pLine = filteredPitchingLines.value.find(l => l.gameId === g.id);
    if (pLine) {
      rIP += parseIP(pLine.IP); rER += pLine.ER; rPitchH += pLine.H; rPitchBB += pLine.BB; rSO += pLine.SO;
    }

    const stat = selectedStat.value;
    if (stat === 'AVG') return rAB > 0 ? Number((rH / rAB).toFixed(3)) : 0;
    if (stat === 'OBP') {
      const pa = rAB + rBB + rHBP;
      return pa > 0 ? Number(((rH + rBB + rHBP) / pa).toFixed(3)) : 0;
    }
    if (stat === 'SLG') return rAB > 0 ? Number((rTB / rAB).toFixed(3)) : 0;
    if (stat === 'OPS') {
      const pa = rAB + rBB + rHBP;
      const obp = pa > 0 ? (rH + rBB + rHBP) / pa : 0;
      const slg = rAB > 0 ? rTB / rAB : 0;
      return Number((obp + slg).toFixed(3));
    }
    if (stat === 'ERA') return rIP > 0 ? Number(((rER * 6) / rIP).toFixed(2)) : 0;
    if (stat === 'WHIP') return rIP > 0 ? Number(((rPitchBB + rPitchH) / rIP).toFixed(2)) : 0;
    if (stat === 'K6') return rIP > 0 ? Number(((rSO * 6) / rIP).toFixed(2)) : 0;
    
    return 0;
  });
});

const datasets = computed(() => {
  const isPitching = ['ERA', 'WHIP', 'K6'].includes(selectedStat.value);
  const color = isPitching ? '#10b981' : '#3b82f6';
  
  return [
    {
      label: `Running ${selectedStat.value}`,
      data: trendData.value,
      borderColor: color,
      backgroundColor: color,
    }
  ];
});

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

    <Card>
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-bold text-gray-200">Performance Trend</h3>
        <select v-model="selectedStat" class="bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500">
          <option v-for="opt in statOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
      <TrendChart :labels="trendLabels" :datasets="datasets" />
    </Card>

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
