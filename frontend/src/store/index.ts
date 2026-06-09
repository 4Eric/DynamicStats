import { defineStore } from 'pinia';
import { Game, Player, BattingLine, PitchingLine } from '../types';

export const useAppStore = defineStore('app', {
  state: () => ({
    games: [] as Game[],
    players: [] as Player[],
    battingLines: [] as BattingLine[],
    pitchingLines: [] as PitchingLine[],
  }),
  actions: {
    async fetchData() {
      // Fetch games and players from backend
      const API_BASE = import.meta.env.VITE_API_URL || '';
      try {
        const [gamesRes, playersRes, battingRes, pitchingRes] = await Promise.all([
          fetch(`${API_BASE}/api/games`),
          fetch(`${API_BASE}/api/players`),
          fetch(`${API_BASE}/api/batting`),
          fetch(`${API_BASE}/api/pitching`)
        ]);
        if (gamesRes.ok) this.games = await gamesRes.json();
        if (playersRes.ok) this.players = await playersRes.json();
        if (battingRes.ok) this.battingLines = await battingRes.json();
        if (pitchingRes.ok) this.pitchingLines = await pitchingRes.json();
      } catch (e) {
        console.error('Failed to fetch data', e);
      }
    }
  }
});
