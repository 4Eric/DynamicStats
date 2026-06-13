<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ChevronUp, ChevronDown } from 'lucide-vue-next';
import { useAppStore } from '../store';
import { calculateBattingStats, calculatePitchingStats, parseIP } from '../utils/statsEngine';
import TrendChart from '../components/TrendChart.vue';
import Card from '../components/Card.vue';
import GameRangeSelector from '../components/GameRangeSelector.vue';

const store = useAppStore();

const gameRange = ref([1, 10]);



const selectedGames = computed(() => {
  return store.games.filter(g => g.gameNumber >= gameRange.value[0] && g.gameNumber <= gameRange.value[1]);
});

const selectedGameIds = computed(() => new Set(selectedGames.value.map(g => g.id)));

const filteredBatting = computed(() => {
  return store.battingLines.filter(l => selectedGameIds.value.has(l.gameId));
});

const filteredPitching = computed(() => {
  return store.pitchingLines.filter(l => selectedGameIds.value.has(l.gameId));
});

const rawBattingLeaderboard = computed(() => {
  const byPlayer: Record<string, any[]> = {};
  filteredBatting.value.forEach(line => {
    if (!byPlayer[line.playerId]) byPlayer[line.playerId] = [];
    byPlayer[line.playerId].push(line);
  });

  return Object.keys(byPlayer).map(playerId => {
    const player = store.players.find(p => p.id === playerId);
    const stats = calculateBattingStats(byPlayer[playerId]);
    return {
      playerId,
      name: player ? player.name : 'Unknown',
      jersey: player ? player.number : '?',
      G: byPlayer[playerId].length,
      ...stats
    };
  });
});

const rawPitchingLeaderboard = computed(() => {
  const byPlayer: Record<string, any[]> = {};
  filteredPitching.value.forEach(line => {
    if (!byPlayer[line.playerId]) byPlayer[line.playerId] = [];
    byPlayer[line.playerId].push(line);
  });

  return Object.keys(byPlayer).map(playerId => {
    const player = store.players.find(p => p.id === playerId);
    const stats = calculatePitchingStats(byPlayer[playerId]);
    return {
      playerId,
      name: player ? player.name : 'Unknown',
      jersey: player ? player.number : '?',
      G: byPlayer[playerId].length,
      ...stats
    };
  });
});

const sortKeyBatting = ref('OPS');
const sortOrderBatting = ref<'asc'|'desc'>('desc');

const sortKeyPitching = ref('ERA');
const sortOrderPitching = ref<'asc'|'desc'>('asc');

function sortByBatting(key: string) {
  if (sortKeyBatting.value === key) {
    sortOrderBatting.value = sortOrderBatting.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKeyBatting.value = key;
    sortOrderBatting.value = 'desc';
  }
}

function sortByPitching(key: string) {
  if (sortKeyPitching.value === key) {
    sortOrderPitching.value = sortOrderPitching.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKeyPitching.value = key;
    sortOrderPitching.value = (key === 'ERA' || key === 'WHIP') ? 'asc' : 'desc';
  }
}

const battingLeaderboard = computed(() => {
  return rawBattingLeaderboard.value.slice().sort((a, b) => {
    if (sortKeyBatting.value === 'name') {
       return sortOrderBatting.value === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    }
    let valA = (a as any)[sortKeyBatting.value];
    let valB = (b as any)[sortKeyBatting.value];
    if (typeof valA === 'string') valA = parseFloat(valA) || 0;
    if (typeof valB === 'string') valB = parseFloat(valB) || 0;
    return sortOrderBatting.value === 'asc' ? valA - valB : valB - valA;
  });
});

const pitchingLeaderboard = computed(() => {
  return rawPitchingLeaderboard.value.slice().sort((a, b) => {
    if (sortKeyPitching.value === 'name') {
       return sortOrderPitching.value === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    }
    let valA = sortKeyPitching.value === 'IP_formatted' ? a.IP_num : (a as any)[sortKeyPitching.value];
    let valB = sortKeyPitching.value === 'IP_formatted' ? b.IP_num : (b as any)[sortKeyPitching.value];
    if (typeof valA === 'string') valA = parseFloat(valA) || 0;
    if (typeof valB === 'string') valB = parseFloat(valB) || 0;
    return sortOrderPitching.value === 'asc' ? valA - valB : valB - valA;
  });
});

const activeTab = ref<'batting' | 'pitching'>('batting');

const trendMode = ref<'batting' | 'pitching'>('batting');
const trendStat = ref('AVG'); 
const trendType = ref('cumulative');

const selectedTrendPlayers = ref<string[]>([]);


watch([trendMode, () => store.battingLines.length, () => store.pitchingLines.length], () => {
  if (trendMode.value === 'batting') {
    selectedTrendPlayers.value = rawBattingLeaderboard.value.filter(p => p.PA > 0).map(p => p.playerId);
    if (!['AVG','OBP','SLG','OPS','CT_pct','H','HR','RBI','R','BB','SO','AB'].includes(trendStat.value)) {
      trendStat.value = 'OPS';
    }
  } else {
    selectedTrendPlayers.value = rawPitchingLeaderboard.value.filter(p => p.IP_num > 0).map(p => p.playerId);
    if (!['ERA','WHIP','K6','IP','H','R','ER','BB','SO'].includes(trendStat.value)) {
      trendStat.value = 'ERA';
    }
  }
}, { immediate: true });

const availableTrendPlayers = computed(() => {
  if (trendMode.value === 'batting') {
    return rawBattingLeaderboard.value.filter(p => p.PA > 0).sort((a, b) => parseFloat(b.OPS) - parseFloat(a.OPS));
  } else {
    return rawPitchingLeaderboard.value.filter(p => p.IP_num > 0).sort((a, b) => parseFloat(a.ERA) - parseFloat(b.ERA));
  }
});

const trendColors = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

const trendChartData = computed(() => {
  const games = [...selectedGames.value].sort((a, b) => a.gameNumber - b.gameNumber);
  const labels = games.map(g => `Game ${g.gameNumber}`);
  
  const activePlayers = availableTrendPlayers.value.filter(p => selectedTrendPlayers.value.includes(p.playerId));
  
  const datasets = activePlayers.map((player, index) => {
    let runningAB = 0, runningH = 0, runningTB = 0, runningBB = 0, runningHBP = 0;
    let runningR = 0, runningRBI = 0, runningHR = 0, runningSO = 0;
    
    let runningIP = 0, runningER = 0;
    
    const data = games.map(g => {
      if (trendMode.value === 'batting') {
        const line = store.battingLines.find(l => l.gameId === g.id && l.playerId === player.playerId);
        
        if (trendType.value === 'per-game') {
          if (!line) return null;
          if (trendStat.value === 'H') return line.H;
          if (trendStat.value === 'HR') return line.HR;
          if (trendStat.value === 'RBI') return line.RBI;
          if (trendStat.value === 'R') return line.R;
          if (trendStat.value === 'SO') return line.SO;
          if (trendStat.value === 'BB') return line.BB;
          if (trendStat.value === 'AB') return line.AB;
          if (trendStat.value === 'AVG') return line.AB > 0 ? parseFloat((line.H / line.AB).toFixed(3)) : null;
          if (trendStat.value === 'OBP') {
             const PA = line.AB + line.BB + line.HBP;
             return PA > 0 ? parseFloat(((line.H + line.BB + line.HBP) / PA).toFixed(3)) : null;
          }
          if (trendStat.value === 'SLG') {
             return line.AB > 0 ? parseFloat((line.TB / line.AB).toFixed(3)) : null;
          }
          if (trendStat.value === 'OPS') {
             const PA = line.AB + line.BB + line.HBP;
             const OBP = PA > 0 ? (line.H + line.BB + line.HBP) / PA : 0;
             const SLG = line.AB > 0 ? line.TB / line.AB : 0;
             return line.AB > 0 || PA > 0 ? parseFloat((OBP + SLG).toFixed(3)) : null;
          }
          if (trendStat.value === 'CT_pct') return line.AB > 0 ? parseFloat((((line.AB - line.SO) / line.AB) * 100).toFixed(1)) : null;
          return 0;
        } else {
          if (line) {
            runningAB += line.AB;
            runningH += line.H;
            runningTB += line.TB;
            runningBB += line.BB;
            runningHBP += line.HBP;
            runningR += line.R;
            runningRBI += line.RBI;
            runningHR += line.HR;
            runningSO += line.SO;
          }
          
          if (trendStat.value === 'H') return runningH;
          if (trendStat.value === 'HR') return runningHR;
          if (trendStat.value === 'RBI') return runningRBI;
          if (trendStat.value === 'R') return runningR;
          if (trendStat.value === 'SO') return runningSO;
          if (trendStat.value === 'BB') return runningBB;
          if (trendStat.value === 'AB') return runningAB;
          
          if (trendStat.value === 'AVG') return runningAB > 0 ? parseFloat((runningH / runningAB).toFixed(3)) : null;
          if (trendStat.value === 'OBP') {
             const PA = runningAB + runningBB + runningHBP;
             return PA > 0 ? parseFloat(((runningH + runningBB + runningHBP) / PA).toFixed(3)) : null;
          }
          if (trendStat.value === 'SLG') {
             return runningAB > 0 ? parseFloat((runningTB / runningAB).toFixed(3)) : null;
          }
          if (trendStat.value === 'OPS') {
             const PA = runningAB + runningBB + runningHBP;
             const OBP = PA > 0 ? (runningH + runningBB + runningHBP) / PA : 0;
             const SLG = runningAB > 0 ? runningTB / runningAB : 0;
             return runningAB > 0 || PA > 0 ? parseFloat((OBP + SLG).toFixed(3)) : null;
          }
          if (trendStat.value === 'CT_pct') return runningAB > 0 ? parseFloat((((runningAB - runningSO) / runningAB) * 100).toFixed(1)) : null;
          return 0;
        }
      } else {
        const line = store.pitchingLines.find(l => l.gameId === g.id && l.playerId === player.playerId);
        if (trendType.value === 'per-game') {
          if (!line) return null;
          if (trendStat.value === 'IP') return parseIP(line.IP);
          if (trendStat.value === 'H') return line.H;
          if (trendStat.value === 'R') return line.R;
          if (trendStat.value === 'ER') return line.ER;
          if (trendStat.value === 'BB') return line.BB;
          if (trendStat.value === 'SO') return line.SO;
          if (trendStat.value === 'ERA') return line.IP > 0 ? parseFloat(((line.ER * 6) / parseIP(line.IP)).toFixed(2)) : null;
          if (trendStat.value === 'WHIP') return line.IP > 0 ? parseFloat(((line.BB + line.H) / parseIP(line.IP)).toFixed(2)) : null;
          if (trendStat.value === 'K6') return line.IP > 0 ? parseFloat(((line.SO * 6) / parseIP(line.IP)).toFixed(2)) : null;
          return 0;
        } else {
          if (line) {
            runningIP += parseIP(line.IP);
            runningH += line.H;
            runningR += line.R;
            runningER += line.ER;
            runningBB += line.BB;
            runningSO += line.SO;
          }
          
          if (trendStat.value === 'IP') return runningIP;
          if (trendStat.value === 'H') return runningH;
          if (trendStat.value === 'R') return runningR;
          if (trendStat.value === 'ER') return runningER;
          if (trendStat.value === 'BB') return runningBB;
          if (trendStat.value === 'SO') return runningSO;
          if (trendStat.value === 'ERA') return runningIP > 0 ? parseFloat(((runningER * 6) / runningIP).toFixed(2)) : null;
          if (trendStat.value === 'WHIP') return runningIP > 0 ? parseFloat(((runningBB + runningH) / runningIP).toFixed(2)) : null;
          if (trendStat.value === 'K6') return runningIP > 0 ? parseFloat(((runningSO * 6) / runningIP).toFixed(2)) : null;
          return 0;
        }
      }
    });

    return {
      label: player.name,
      data,
      borderColor: trendColors[index % trendColors.length],
      backgroundColor: trendColors[index % trendColors.length]
    };
  });
  
  return { labels, datasets };
});

</script>

<template>
  <div class="space-y-8">
    <GameRangeSelector v-model="gameRange" />

    <!-- Trend Chart -->
    <Card>
      <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h3 class="text-lg font-bold flex items-center gap-2">
          <span class="text-blue-400">📈</span> Player Stat Trends
        </h3>
        <div class="flex flex-wrap gap-4">
          <select v-model="trendMode" aria-label="Select Trend Mode" class="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white">
            <option value="batting">Batting</option>
            <option value="pitching">Pitching</option>
          </select>
          <select v-model="trendStat" aria-label="Select Statistic" class="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white">
            <template v-if="trendMode === 'batting'">
              <option value="AVG">AVG</option>
              <option value="OBP">OBP</option>
              <option value="SLG">SLG</option>
              <option value="OPS">OPS</option>
              <option value="CT_pct">Contact %</option>
              <option value="H">Hits (H)</option>
              <option value="HR">Home Runs (HR)</option>
              <option value="RBI">RBI</option>
              <option value="R">Runs (R)</option>
              <option value="BB">Walks (BB)</option>
              <option value="SO">Strikeouts (SO)</option>
            </template>
            <template v-else>
              <option value="ERA">ERA</option>
              <option value="WHIP">WHIP</option>
              <option value="K6">K/6</option>
              <option value="IP">Innings Pitched (IP)</option>
              <option value="H">Hits Allowed (H)</option>
              <option value="R">Runs Allowed (R)</option>
              <option value="ER">Earned Runs (ER)</option>
              <option value="BB">Walks (BB)</option>
              <option value="SO">Strikeouts (SO)</option>
            </template>
          </select>
          <select v-model="trendType" aria-label="Select Trend Type" class="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white">
            <option value="cumulative">Cumulative</option>
            <option value="per-game">Per Game</option>
          </select>
        </div>
      </div>
      
      <!-- Player Selection -->
      <div class="mb-6">
        <div class="flex items-center gap-4 mb-3">
          <span class="text-sm text-gray-400 font-medium">Select Players:</span>
          <button @click="selectedTrendPlayers = availableTrendPlayers.map(p => p.playerId)" class="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded transition-all duration-200 text-white">Select All</button>
          <button @click="selectedTrendPlayers = []" class="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded transition-all duration-200 text-white">Deselect All</button>
        </div>
        <div class="flex flex-wrap gap-2">
          <label v-for="player in availableTrendPlayers" :key="player.playerId" 
                 class="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-gray-700 bg-gray-900 cursor-pointer hover:bg-gray-800 transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500" 
                 :class="{'border-blue-500 bg-blue-500/10': selectedTrendPlayers.includes(player.playerId)}">
            <input type="checkbox" :value="player.playerId" v-model="selectedTrendPlayers" class="sr-only" />
            <span class="text-sm font-medium" :class="selectedTrendPlayers.includes(player.playerId) ? 'text-blue-400' : 'text-gray-300'">{{ player.name }}</span>
          </label>
        </div>
      </div>
      <div class="h-80 w-full" v-if="trendChartData.datasets.length > 0">
        <TrendChart :labels="trendChartData.labels" :datasets="trendChartData.datasets" />
      </div>
      <div v-else class="text-center text-gray-400 py-10">
        Select players to display trend chart.
      </div>
    </Card>
    <!-- Leaderboards -->
    <Card>
      <div class="flex gap-4 mb-6 border-b border-gray-800">
        <button 
          @click="activeTab = 'batting'"
          class="pb-3 px-2 font-medium transition-all duration-200"
          :class="activeTab === 'batting' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'"
        >
          Batting Leaderboard
        </button>
        <button 
          @click="activeTab = 'pitching'"
          class="pb-3 px-2 font-medium transition-all duration-200"
          :class="activeTab === 'pitching' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'"
        >
          Pitching Leaderboard
        </button>
      </div>

      <div v-if="activeTab === 'batting'" class="overflow-x-auto">
        <table class="w-full text-left border-collapse whitespace-nowrap font-mono-numbers">
          <thead>
            <tr class="border-b border-gray-800 text-gray-400 text-sm select-none font-sans">
              <th @click="sortByBatting('name')" class="py-3 px-4 font-medium cursor-pointer hover:text-white transition-colors duration-200">Player <ChevronUp v-if="sortKeyBatting === 'name' && sortOrderBatting === 'asc'" class="inline w-4 h-4" /><ChevronDown v-if="sortKeyBatting === 'name' && sortOrderBatting === 'desc'" class="inline w-4 h-4" /></th>
              <th @click="sortByBatting('G')" class="py-3 px-4 font-medium text-right cursor-pointer hover:text-white transition-colors duration-200">G <ChevronUp v-if="sortKeyBatting === 'G' && sortOrderBatting === 'asc'" class="inline w-4 h-4" /><ChevronDown v-if="sortKeyBatting === 'G' && sortOrderBatting === 'desc'" class="inline w-4 h-4" /></th>
              <th @click="sortByBatting('PA')" class="py-3 px-4 font-medium text-right cursor-pointer hover:text-white transition-colors duration-200">PA <ChevronUp v-if="sortKeyBatting === 'PA' && sortOrderBatting === 'asc'" class="inline w-4 h-4" /><ChevronDown v-if="sortKeyBatting === 'PA' && sortOrderBatting === 'desc'" class="inline w-4 h-4" /></th>
              <th @click="sortByBatting('AB')" class="py-3 px-4 font-medium text-right cursor-pointer hover:text-white transition-colors duration-200">AB <ChevronUp v-if="sortKeyBatting === 'AB' && sortOrderBatting === 'asc'" class="inline w-4 h-4" /><ChevronDown v-if="sortKeyBatting === 'AB' && sortOrderBatting === 'desc'" class="inline w-4 h-4" /></th>
              <th @click="sortByBatting('R')" class="py-3 px-4 font-medium text-right cursor-pointer hover:text-white transition-colors duration-200">R <ChevronUp v-if="sortKeyBatting === 'R' && sortOrderBatting === 'asc'" class="inline w-4 h-4" /><ChevronDown v-if="sortKeyBatting === 'R' && sortOrderBatting === 'desc'" class="inline w-4 h-4" /></th>
              <th @click="sortByBatting('H')" class="py-3 px-4 font-medium text-right cursor-pointer hover:text-white transition-colors duration-200">H <ChevronUp v-if="sortKeyBatting === 'H' && sortOrderBatting === 'asc'" class="inline w-4 h-4" /><ChevronDown v-if="sortKeyBatting === 'H' && sortOrderBatting === 'desc'" class="inline w-4 h-4" /></th>
              <th @click="sortByBatting('RBI')" class="py-3 px-4 font-medium text-right cursor-pointer hover:text-white transition-colors duration-200">RBI <ChevronUp v-if="sortKeyBatting === 'RBI' && sortOrderBatting === 'asc'" class="inline w-4 h-4" /><ChevronDown v-if="sortKeyBatting === 'RBI' && sortOrderBatting === 'desc'" class="inline w-4 h-4" /></th>
              <th @click="sortByBatting('BB')" class="py-3 px-4 font-medium text-right cursor-pointer hover:text-white transition-colors duration-200">BB <ChevronUp v-if="sortKeyBatting === 'BB' && sortOrderBatting === 'asc'" class="inline w-4 h-4" /><ChevronDown v-if="sortKeyBatting === 'BB' && sortOrderBatting === 'desc'" class="inline w-4 h-4" /></th>
              <th @click="sortByBatting('SO')" class="py-3 px-4 font-medium text-right cursor-pointer hover:text-white transition-colors duration-200">SO <ChevronUp v-if="sortKeyBatting === 'SO' && sortOrderBatting === 'asc'" class="inline w-4 h-4" /><ChevronDown v-if="sortKeyBatting === 'SO' && sortOrderBatting === 'desc'" class="inline w-4 h-4" /></th>
              <th @click="sortByBatting('CT_pct')" class="py-3 px-4 font-medium text-right cursor-pointer hover:text-white transition-colors duration-200">CT% <ChevronUp v-if="sortKeyBatting === 'CT_pct' && sortOrderBatting === 'asc'" class="inline w-4 h-4" /><ChevronDown v-if="sortKeyBatting === 'CT_pct' && sortOrderBatting === 'desc'" class="inline w-4 h-4" /></th>
              <th @click="sortByBatting('AVG')" class="py-3 px-4 font-medium text-right cursor-pointer hover:text-white transition-colors duration-200">AVG <ChevronUp v-if="sortKeyBatting === 'AVG' && sortOrderBatting === 'asc'" class="inline w-4 h-4" /><ChevronDown v-if="sortKeyBatting === 'AVG' && sortOrderBatting === 'desc'" class="inline w-4 h-4" /></th>
              <th @click="sortByBatting('OBP')" class="py-3 px-4 font-medium text-right cursor-pointer hover:text-white transition-colors duration-200">OBP <ChevronUp v-if="sortKeyBatting === 'OBP' && sortOrderBatting === 'asc'" class="inline w-4 h-4" /><ChevronDown v-if="sortKeyBatting === 'OBP' && sortOrderBatting === 'desc'" class="inline w-4 h-4" /></th>
              <th @click="sortByBatting('SLG')" class="py-3 px-4 font-medium text-right cursor-pointer hover:text-white transition-colors duration-200">SLG <ChevronUp v-if="sortKeyBatting === 'SLG' && sortOrderBatting === 'asc'" class="inline w-4 h-4" /><ChevronDown v-if="sortKeyBatting === 'SLG' && sortOrderBatting === 'desc'" class="inline w-4 h-4" /></th>
              <th @click="sortByBatting('OPS')" class="py-3 px-4 font-medium text-right cursor-pointer hover:text-white transition-colors duration-200" :class="{'text-blue-400': sortKeyBatting === 'OPS'}">OPS <ChevronUp v-if="sortKeyBatting === 'OPS' && sortOrderBatting === 'asc'" class="inline w-4 h-4" /><ChevronDown v-if="sortKeyBatting === 'OPS' && sortOrderBatting === 'desc'" class="inline w-4 h-4" /></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="player in battingLeaderboard" :key="player.playerId" class="border-b border-gray-800/50 hover:bg-gray-800/20 transition-all duration-200">
              <td class="py-3 px-4">
                <router-link :to="'/player/' + player.playerId" class="font-medium text-blue-400 hover:underline">
                  {{ player.name }}
                </router-link>
              </td>
              <td class="py-3 px-4 text-right text-gray-300">{{ player.G }}</td>
              <td class="py-3 px-4 text-right text-gray-300">{{ player.PA }}</td>
              <td class="py-3 px-4 text-right text-gray-300">{{ player.AB }}</td>
              <td class="py-3 px-4 text-right text-gray-300">{{ player.R }}</td>
              <td class="py-3 px-4 text-right text-gray-300">{{ player.H }}</td>
              <td class="py-3 px-4 text-right text-gray-300">{{ player.RBI }}</td>
              <td class="py-3 px-4 text-right text-gray-300">{{ player.BB }}</td>
              <td class="py-3 px-4 text-right text-gray-300">{{ player.SO }}</td>
              <td class="py-3 px-4 text-right text-emerald-400 font-medium">{{ player.CT_pct }}</td>
              <td class="py-3 px-4 text-right font-medium">{{ player.AVG }}</td>
              <td class="py-3 px-4 text-right font-medium">{{ player.OBP }}</td>
              <td class="py-3 px-4 text-right font-medium">{{ player.SLG }}</td>
              <td class="py-3 px-4 text-right font-bold text-emerald-400">{{ player.OPS }}</td>
            </tr>
            <tr v-if="battingLeaderboard.length === 0">
              <td colspan="14" class="py-8 text-center text-gray-400">No batting data for selected range.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="activeTab === 'pitching'" class="overflow-x-auto">
        <table class="w-full text-left border-collapse whitespace-nowrap font-mono-numbers">
          <thead>
            <tr class="border-b border-gray-800 text-gray-400 text-sm select-none font-sans">
              <th @click="sortByPitching('name')" class="py-3 px-4 font-medium cursor-pointer hover:text-white transition-colors duration-200">Player <ChevronUp v-if="sortKeyPitching === 'name' && sortOrderPitching === 'asc'" class="inline w-4 h-4" /><ChevronDown v-if="sortKeyPitching === 'name' && sortOrderPitching === 'desc'" class="inline w-4 h-4" /></th>
              <th @click="sortByPitching('G')" class="py-3 px-4 font-medium text-right cursor-pointer hover:text-white transition-colors duration-200">G <ChevronUp v-if="sortKeyPitching === 'G' && sortOrderPitching === 'asc'" class="inline w-4 h-4" /><ChevronDown v-if="sortKeyPitching === 'G' && sortOrderPitching === 'desc'" class="inline w-4 h-4" /></th>
              <th @click="sortByPitching('IP_formatted')" class="py-3 px-4 font-medium text-right cursor-pointer hover:text-white transition-colors duration-200">IP <ChevronUp v-if="sortKeyPitching === 'IP_formatted' && sortOrderPitching === 'asc'" class="inline w-4 h-4" /><ChevronDown v-if="sortKeyPitching === 'IP_formatted' && sortOrderPitching === 'desc'" class="inline w-4 h-4" /></th>
              <th @click="sortByPitching('H')" class="py-3 px-4 font-medium text-right cursor-pointer hover:text-white transition-colors duration-200">H <ChevronUp v-if="sortKeyPitching === 'H' && sortOrderPitching === 'asc'" class="inline w-4 h-4" /><ChevronDown v-if="sortKeyPitching === 'H' && sortOrderPitching === 'desc'" class="inline w-4 h-4" /></th>
              <th @click="sortByPitching('R')" class="py-3 px-4 font-medium text-right cursor-pointer hover:text-white transition-colors duration-200">R <ChevronUp v-if="sortKeyPitching === 'R' && sortOrderPitching === 'asc'" class="inline w-4 h-4" /><ChevronDown v-if="sortKeyPitching === 'R' && sortOrderPitching === 'desc'" class="inline w-4 h-4" /></th>
              <th @click="sortByPitching('ER')" class="py-3 px-4 font-medium text-right cursor-pointer hover:text-white transition-colors duration-200">ER <ChevronUp v-if="sortKeyPitching === 'ER' && sortOrderPitching === 'asc'" class="inline w-4 h-4" /><ChevronDown v-if="sortKeyPitching === 'ER' && sortOrderPitching === 'desc'" class="inline w-4 h-4" /></th>
              <th @click="sortByPitching('BB')" class="py-3 px-4 font-medium text-right cursor-pointer hover:text-white transition-colors duration-200">BB <ChevronUp v-if="sortKeyPitching === 'BB' && sortOrderPitching === 'asc'" class="inline w-4 h-4" /><ChevronDown v-if="sortKeyPitching === 'BB' && sortOrderPitching === 'desc'" class="inline w-4 h-4" /></th>
              <th @click="sortByPitching('SO')" class="py-3 px-4 font-medium text-right cursor-pointer hover:text-white transition-colors duration-200">SO <ChevronUp v-if="sortKeyPitching === 'SO' && sortOrderPitching === 'asc'" class="inline w-4 h-4" /><ChevronDown v-if="sortKeyPitching === 'SO' && sortOrderPitching === 'desc'" class="inline w-4 h-4" /></th>
              <th @click="sortByPitching('K6')" class="py-3 px-4 font-medium text-right cursor-pointer hover:text-white transition-colors duration-200">K/6 <ChevronUp v-if="sortKeyPitching === 'K6' && sortOrderPitching === 'asc'" class="inline w-4 h-4" /><ChevronDown v-if="sortKeyPitching === 'K6' && sortOrderPitching === 'desc'" class="inline w-4 h-4" /></th>
              <th @click="sortByPitching('WHIP')" class="py-3 px-4 font-medium text-right cursor-pointer hover:text-white transition-colors duration-200">WHIP <ChevronUp v-if="sortKeyPitching === 'WHIP' && sortOrderPitching === 'asc'" class="inline w-4 h-4" /><ChevronDown v-if="sortKeyPitching === 'WHIP' && sortOrderPitching === 'desc'" class="inline w-4 h-4" /></th>
              <th @click="sortByPitching('ERA')" class="py-3 px-4 font-medium text-right cursor-pointer hover:text-white transition-colors duration-200" :class="{'text-blue-400': sortKeyPitching === 'ERA'}">ERA <ChevronUp v-if="sortKeyPitching === 'ERA' && sortOrderPitching === 'asc'" class="inline w-4 h-4" /><ChevronDown v-if="sortKeyPitching === 'ERA' && sortOrderPitching === 'desc'" class="inline w-4 h-4" /></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="player in pitchingLeaderboard" :key="player.playerId" class="border-b border-gray-800/50 hover:bg-gray-800/20 transition-all duration-200">
              <td class="py-3 px-4">
                <router-link :to="'/player/' + player.playerId" class="font-medium text-blue-400 hover:underline">
                  {{ player.name }}
                </router-link>
              </td>
              <td class="py-3 px-4 text-right text-gray-300">{{ player.G }}</td>
              <td class="py-3 px-4 text-right text-gray-300">{{ player.IP_formatted }}</td>
              <td class="py-3 px-4 text-right text-gray-300">{{ player.H }}</td>
              <td class="py-3 px-4 text-right text-gray-300">{{ player.R }}</td>
              <td class="py-3 px-4 text-right text-gray-300">{{ player.ER }}</td>
              <td class="py-3 px-4 text-right text-gray-300">{{ player.BB }}</td>
              <td class="py-3 px-4 text-right text-gray-300">{{ player.SO }}</td>
              <td class="py-3 px-4 text-right font-medium">{{ player.K6 }}</td>
              <td class="py-3 px-4 text-right font-medium">{{ player.WHIP }}</td>
              <td class="py-3 px-4 text-right font-bold text-emerald-400">{{ player.ERA }}</td>
            </tr>
            <tr v-if="pitchingLeaderboard.length === 0">
              <td colspan="11" class="py-8 text-center text-gray-400">No pitching data for selected range.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  </div>
</template>

<style>
.slider-blue {
  --slider-bg: #374151;
  --slider-connect-bg: #3b82f6;
  --slider-connect-bg-hover: #2563eb;
  --slider-handle-bg: #ffffff;
  --slider-handle-ring-color: #3b82f630;
}
</style>
