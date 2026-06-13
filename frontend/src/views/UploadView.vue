<script setup lang="ts">
import { ref } from 'vue';
import { useAppStore } from '../store';

const store = useAppStore();
const imageSrc = ref<string | null>(null);
const file = ref<File | null>(null);
const isUploading = ref(false);
const result = ref<any>(null);
const selectedType = ref<'batting' | 'pitching'>('batting');

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    file.value = target.files[0];
    imageSrc.value = URL.createObjectURL(target.files[0]);
  }
}

async function upload() {
  if (!file.value) return;
  isUploading.value = true;
  const API_BASE = import.meta.env.VITE_API_URL || '';
  
  const formData = new FormData();
  formData.append('screenshot', file.value);
  formData.append('type', selectedType.value);

  try {
    const res = await fetch(`${API_BASE}/api/ingest/screenshot`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    
    if (data.data.game) {
      gameDetails.value.opponent = data.data.game.opponent || '';
      if (data.data.game.date) gameDetails.value.date = data.data.game.date;
      if (data.data.game.ourScore !== undefined) gameDetails.value.ourScore = data.data.game.ourScore;
      if (data.data.game.opponentScore !== undefined) gameDetails.value.opponentScore = data.data.game.opponentScore;
      if (data.data.game.result) gameDetails.value.result = data.data.game.result;
    }
    
    result.value = data.data.lines || data.data;
  } catch (e) {
    console.error(e);
  } finally {
    isUploading.value = false;
  }
}

const gameDetails = ref({
  id: '',
  date: new Date().toISOString().split('T')[0],
  gameNumber: store.games.length + 1,
  opponent: '',
  ourScore: 0,
  opponentScore: 0,
  result: 'W' as 'W' | 'L' | 'T'
});

const selectedExistingGameId = ref('new');

function onExistingGameChange() {
  if (selectedExistingGameId.value === 'new') {
    gameDetails.value.id = '';
    gameDetails.value.gameNumber = store.games.length + 1;
    gameDetails.value.opponent = '';
    gameDetails.value.ourScore = 0;
    gameDetails.value.opponentScore = 0;
  } else {
    const existing = store.games.find(g => g.id === selectedExistingGameId.value);
    if (existing) {
      gameDetails.value = { ...existing };
    }
  }
}

async function confirmAndSave() {
  if (!result.value) return;
  
  // Generate a random ID for the game only if creating a new one
  if (!gameDetails.value.id) {
    gameDetails.value.id = crypto.randomUUID();
  }

  const payload = {
    game: gameDetails.value,
    battingLines: selectedType.value === 'batting' ? result.value : undefined,
    pitchingLines: selectedType.value === 'pitching' ? result.value : undefined,
  };

  try {
    const API_BASE = import.meta.env.VITE_API_URL || '';
    const res = await fetch(`${API_BASE}/api/ingest/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (res.ok) {
      alert('Saved successfully!');
      store.fetchData(); // reload data
      result.value = null; // clear result
      imageSrc.value = null;
      file.value = null;
    } else {
      alert('Failed to save data.');
    }
  } catch (e) {
    console.error(e);
    alert('Failed to save data.');
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
      <h2 class="text-xl font-bold mb-4">Upload Box Score</h2>

      <div class="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
        <h3 class="text-sm font-bold text-blue-400 mb-1 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          Instructions
        </h3>
        <ul class="text-sm text-blue-200/80 list-disc list-inside space-y-1 ml-1 mt-2">
          <li>Take a screenshot of the GameChanger (GC) Box Score.</li>
          <li>Please upload batting and pitching screenshots <strong>separately</strong>.</li>
          <li>Select the correct category below before choosing your file.</li>
        </ul>
      </div>
      
      <div class="flex gap-4 mb-4">
        <label class="flex items-center gap-2">
          <input type="radio" v-model="selectedType" value="batting" class="text-blue-500 bg-gray-900 border-gray-700">
          <span>Batting Stats</span>
        </label>
        <label class="flex items-center gap-2">
          <input type="radio" v-model="selectedType" value="pitching" class="text-blue-500 bg-gray-900 border-gray-700">
          <span>Pitching Stats</span>
        </label>
      </div>

      <div class="mb-4">
        <input type="file" id="box-score-upload" accept="image/*" @change="onFileChange" class="hidden" />
        <label for="box-score-upload" class="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-900 text-blue-200 hover:bg-blue-800 rounded-full text-sm font-semibold transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
          Choose File
        </label>
        <span v-if="file" class="ml-3 text-sm text-gray-400">{{ file.name }}</span>
        <span v-else class="ml-3 text-sm text-gray-500">No file chosen</span>
      </div>
      
      <div v-if="imageSrc" class="mt-4">
        <img :src="imageSrc" class="max-w-md rounded-lg border border-gray-700" />
      </div>

      <button @click="upload" :disabled="!file || isUploading" class="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg font-medium transition-all duration-200">
        {{ isUploading ? 'Processing with AI...' : 'Parse Screenshot' }}
      </button>
    </div>

    <div v-if="result" class="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 overflow-x-auto">
      <h3 class="text-lg font-bold mb-4">Parsed Data</h3>
      <pre class="text-sm text-gray-300 bg-gray-900 p-4 rounded">{{ JSON.stringify(result, null, 2) }}</pre>
      
      <h3 class="text-lg font-bold mt-6 mb-4">Game Details</h3>
      
      <div class="mb-6">
        <label class="block text-sm text-gray-400 mb-1">Target Game</label>
        <select v-model="selectedExistingGameId" @change="onExistingGameChange" class="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-white">
          <option value="new">-- Create New Game --</option>
          <option v-for="g in store.games" :key="g.id" :value="g.id">
            Game {{ g.gameNumber }} vs {{ g.opponent }} ({{ g.date }})
          </option>
        </select>
        <p class="text-xs text-gray-500 mt-1">If uploading batting and pitching separately, select the game you just created to attach these stats to it.</p>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label class="block text-sm text-gray-400 mb-1">Date</label>
          <input type="date" lang="en-CA" v-model="gameDetails.date" class="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-white">
        </div>
        <div>
          <label class="block text-sm text-gray-400 mb-1">Game #</label>
          <input type="number" v-model="gameDetails.gameNumber" class="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-white">
        </div>
        <div>
          <label class="block text-sm text-gray-400 mb-1">Opponent</label>
          <input type="text" v-model="gameDetails.opponent" class="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-white">
        </div>
        <div>
          <label class="block text-sm text-gray-400 mb-1">Result</label>
          <select v-model="gameDetails.result" class="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-white">
            <option value="W">Win</option>
            <option value="L">Loss</option>
            <option value="T">Tie</option>
          </select>
        </div>
      </div>

      <button @click="confirmAndSave" class="mt-4 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition-all duration-200">
        Confirm & Save
      </button>
    </div>
  </div>
</template>
