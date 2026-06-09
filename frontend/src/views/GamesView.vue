<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAppStore } from '../store';
import Card from '../components/Card.vue';

const store = useAppStore();

const expandedGameId = ref<string | null>(null);

// Mock games if empty for UI testing
const games = computed(() => {
  if (store.games.length > 0) return store.games;
  return [
    { id: '1', date: '2023-04-01', gameNumber: 1, opponent: 'Tigers', ourScore: 5, opponentScore: 3, result: 'W' },
    { id: '2', date: '2023-04-05', gameNumber: 2, opponent: 'Bears', ourScore: 2, opponentScore: 6, result: 'L' }
  ];
});

function toggleGameDetails(id: string) {
  if (expandedGameId.value === id) {
    expandedGameId.value = null;
    editingGameId.value = null;
  } else {
    expandedGameId.value = id;
    editingGameId.value = null;
  }
}

const editingGameId = ref<string | null>(null);
const editForm = ref({
  game: null as any,
  battingLines: [] as any[],
  pitchingLines: [] as any[]
});

function startEdit(game: any) {
  editingGameId.value = game.id;
  editForm.value.game = JSON.parse(JSON.stringify(game));
  editForm.value.battingLines = JSON.parse(JSON.stringify(getBattingLines(game.id)));
  editForm.value.pitchingLines = JSON.parse(JSON.stringify(getPitchingLines(game.id)));
}

function cancelEdit() {
  editingGameId.value = null;
}

async function saveEdit() {
  const payload = {
    game: editForm.value.game,
    battingLines: editForm.value.battingLines.map(l => { 
      const { playerId, jersey, ...rest } = l; 
      return rest; 
    }),
    pitchingLines: editForm.value.pitchingLines.map(l => { 
      const { playerId, jersey, ...rest } = l; 
      return rest; 
    })
  };
  try {
    const res = await fetch('/api/ingest/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      await store.fetchData();
      editingGameId.value = null;
    } else {
      alert('Failed to save changes');
    }
  } catch (e) {
    console.error(e);
    alert('Failed to save changes');
  }
}

function getBattingLines(gameId: string) {
  return store.battingLines.filter(l => l.gameId === gameId).map(line => {
    const player = store.players.find(p => p.id === line.playerId);
    return {
      ...line,
      name: player ? player.name : 'Unknown',
      jersey: player ? player.number : '?'
    };
  });
}

function getPitchingLines(gameId: string) {
  return store.pitchingLines.filter(l => l.gameId === gameId).map(line => {
    const player = store.players.find(p => p.id === line.playerId);
    return {
      ...line,
      name: player ? player.name : 'Unknown',
      jersey: player ? player.number : '?'
    };
  });
}
</script>

<template>
  <div class="space-y-6">
    <Card>
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold">Games / Raw Data</h2>
        <router-link to="/upload" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-all duration-200">
          Upload New Game
        </router-link>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-gray-800 text-gray-400 text-sm">
              <th class="py-3 px-4 font-medium">Game #</th>
              <th class="py-3 px-4 font-medium">Date</th>
              <th class="py-3 px-4 font-medium">Opponent</th>
              <th class="py-3 px-4 font-medium">Result</th>
              <th class="py-3 px-4 font-medium">Our Score</th>
              <th class="py-3 px-4 font-medium">Opp Score</th>
              <th class="py-3 px-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="game in games" :key="game.id">
              <tr class="border-b border-gray-800/50 hover:bg-gray-800/20 transition-all duration-200">
                <template v-if="editingGameId === game.id">
                  <td class="py-3 px-4"><input type="number" v-model="editForm.game.gameNumber" class="w-16 bg-gray-900 border border-gray-700 rounded p-1 text-white"></td>
                  <td class="py-3 px-4"><input type="date" v-model="editForm.game.date" class="w-full bg-gray-900 border border-gray-700 rounded p-1 text-white"></td>
                  <td class="py-3 px-4"><input type="text" v-model="editForm.game.opponent" class="w-full bg-gray-900 border border-gray-700 rounded p-1 text-white"></td>
                  <td class="py-3 px-4">
                    <select v-model="editForm.game.result" class="bg-gray-900 border border-gray-700 rounded p-1 text-white w-16">
                      <option value="W">W</option>
                      <option value="L">L</option>
                      <option value="T">T</option>
                    </select>
                  </td>
                  <td class="py-3 px-4">
                    <input type="number" v-model="editForm.game.ourScore" class="w-16 bg-gray-900 border border-gray-700 rounded p-1 text-white">
                  </td>
                  <td class="py-3 px-4">
                    <input type="number" v-model="editForm.game.opponentScore" class="w-16 bg-gray-900 border border-gray-700 rounded p-1 text-white">
                  </td>
                </template>
                <template v-else>
                  <td class="py-3 px-4 text-gray-300">Game {{ game.gameNumber }}</td>
                  <td class="py-3 px-4 text-gray-300">{{ game.date }}</td>
                  <td class="py-3 px-4 font-medium">{{ game.opponent }}</td>
                  <td class="py-3 px-4 font-bold" :class="{
                      'text-emerald-400': game.result === 'W',
                      'text-red-400': game.result === 'L',
                      'text-yellow-400': game.result === 'T'
                    }">{{ game.result }}</td>
                  <td class="py-3 px-4">{{ game.ourScore }}</td>
                  <td class="py-3 px-4">{{ game.opponentScore }}</td>
                </template>
                <td class="py-3 px-4 text-right space-x-3">
                  <button v-if="expandedGameId === game.id && editingGameId !== game.id" @click="startEdit(game)" class="text-emerald-400 hover:text-emerald-300 text-sm font-medium">Edit</button>
                  <button v-if="editingGameId === game.id" @click="saveEdit" class="text-emerald-400 hover:text-emerald-300 text-sm font-medium">Save</button>
                  <button v-if="editingGameId === game.id" @click="cancelEdit" class="text-gray-400 hover:text-gray-300 text-sm font-medium">Cancel</button>
                  <button @click="toggleGameDetails(game.id!)" class="text-blue-400 hover:text-blue-300 text-sm font-medium">
                    {{ expandedGameId === game.id ? 'Hide Data' : 'View Data' }}
                  </button>
                </td>
              </tr>
              
              <!-- Expanded View for Raw Data -->
              <tr v-if="expandedGameId === game.id">
                <td colspan="5" class="p-0 border-b border-gray-800">
                  <div class="bg-[#2a2a2a] p-6 space-y-6 border-l-4 border-blue-500">
                    
                    <div>
                      <h4 class="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Batting Lines</h4>
                      <div v-if="getBattingLines(game.id!).length > 0" class="overflow-x-auto bg-gray-900 rounded-lg border border-gray-800">
                        <table class="w-full text-left text-sm whitespace-nowrap">
                          <thead class="bg-gray-800/50 text-gray-400">
                            <tr>
                              <th class="py-2 px-3">Player</th>
                              <th class="py-2 px-3 text-right">AB</th>
                              <th class="py-2 px-3 text-right">R</th>
                              <th class="py-2 px-3 text-right">H</th>
                              <th class="py-2 px-3 text-right">RBI</th>
                              <th class="py-2 px-3 text-right">BB</th>
                              <th class="py-2 px-3 text-right">SO</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="(line, idx) in (editingGameId === game.id ? editForm.battingLines : getBattingLines(game.id!))" :key="editingGameId === game.id ? idx : line.playerId" class="border-t border-gray-800/50">
                              <template v-if="editingGameId === game.id">
                                <td class="py-2 px-3"><input type="text" v-model="line.name" class="w-32 bg-gray-900 border border-gray-700 rounded p-1 text-white"></td>
                                <td class="py-2 px-3 text-right"><input type="number" v-model="line.AB" class="w-12 bg-gray-900 border border-gray-700 rounded p-1 text-white text-right"></td>
                                <td class="py-2 px-3 text-right"><input type="number" v-model="line.R" class="w-12 bg-gray-900 border border-gray-700 rounded p-1 text-white text-right"></td>
                                <td class="py-2 px-3 text-right"><input type="number" v-model="line.H" class="w-12 bg-gray-900 border border-gray-700 rounded p-1 text-white text-right"></td>
                                <td class="py-2 px-3 text-right"><input type="number" v-model="line.RBI" class="w-12 bg-gray-900 border border-gray-700 rounded p-1 text-white text-right"></td>
                                <td class="py-2 px-3 text-right"><input type="number" v-model="line.BB" class="w-12 bg-gray-900 border border-gray-700 rounded p-1 text-white text-right"></td>
                                <td class="py-2 px-3 text-right"><input type="number" v-model="line.SO" class="w-12 bg-gray-900 border border-gray-700 rounded p-1 text-white text-right"></td>
                              </template>
                              <template v-else>
                                <td class="py-2 px-3 font-medium">{{ line.name }}</td>
                                <td class="py-2 px-3 text-right">{{ line.AB }}</td>
                                <td class="py-2 px-3 text-right">{{ line.R }}</td>
                                <td class="py-2 px-3 text-right">{{ line.H }}</td>
                                <td class="py-2 px-3 text-right">{{ line.RBI }}</td>
                                <td class="py-2 px-3 text-right">{{ line.BB }}</td>
                                <td class="py-2 px-3 text-right">{{ line.SO }}</td>
                              </template>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div v-else class="text-gray-500 text-sm italic">No batting data for this game.</div>
                    </div>

                    <div>
                      <h4 class="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Pitching Lines</h4>
                      <div v-if="getPitchingLines(game.id!).length > 0" class="overflow-x-auto bg-gray-900 rounded-lg border border-gray-800">
                        <table class="w-full text-left text-sm whitespace-nowrap">
                          <thead class="bg-gray-800/50 text-gray-400">
                            <tr>
                              <th class="py-2 px-3">Pitcher</th>
                              <th class="py-2 px-3 text-right">IP</th>
                              <th class="py-2 px-3 text-right">H</th>
                              <th class="py-2 px-3 text-right">R</th>
                              <th class="py-2 px-3 text-right">ER</th>
                              <th class="py-2 px-3 text-right">BB</th>
                              <th class="py-2 px-3 text-right">SO</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="(line, idx) in (editingGameId === game.id ? editForm.pitchingLines : getPitchingLines(game.id!))" :key="editingGameId === game.id ? idx : line.playerId" class="border-t border-gray-800/50">
                              <template v-if="editingGameId === game.id">
                                <td class="py-2 px-3"><input type="text" v-model="line.name" class="w-32 bg-gray-900 border border-gray-700 rounded p-1 text-white"></td>
                                <td class="py-2 px-3 text-right"><input type="number" step="0.1" v-model="line.IP" class="w-12 bg-gray-900 border border-gray-700 rounded p-1 text-white text-right"></td>
                                <td class="py-2 px-3 text-right"><input type="number" v-model="line.H" class="w-12 bg-gray-900 border border-gray-700 rounded p-1 text-white text-right"></td>
                                <td class="py-2 px-3 text-right"><input type="number" v-model="line.R" class="w-12 bg-gray-900 border border-gray-700 rounded p-1 text-white text-right"></td>
                                <td class="py-2 px-3 text-right"><input type="number" v-model="line.ER" class="w-12 bg-gray-900 border border-gray-700 rounded p-1 text-white text-right"></td>
                                <td class="py-2 px-3 text-right"><input type="number" v-model="line.BB" class="w-12 bg-gray-900 border border-gray-700 rounded p-1 text-white text-right"></td>
                                <td class="py-2 px-3 text-right"><input type="number" v-model="line.SO" class="w-12 bg-gray-900 border border-gray-700 rounded p-1 text-white text-right"></td>
                              </template>
                              <template v-else>
                                <td class="py-2 px-3 font-medium">{{ line.name }}</td>
                                <td class="py-2 px-3 text-right">{{ line.IP }}</td>
                                <td class="py-2 px-3 text-right">{{ line.H }}</td>
                                <td class="py-2 px-3 text-right">{{ line.R }}</td>
                                <td class="py-2 px-3 text-right">{{ line.ER }}</td>
                                <td class="py-2 px-3 text-right">{{ line.BB }}</td>
                                <td class="py-2 px-3 text-right">{{ line.SO }}</td>
                              </template>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div v-else class="text-gray-500 text-sm italic">No pitching data for this game.</div>
                    </div>

                  </div>
                </td>
              </tr>
            </template>
            <tr v-if="games.length === 0">
              <td colspan="7" class="py-8 text-center text-gray-500">
                No games recorded yet. Upload a box score to get started.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  </div>
</template>
