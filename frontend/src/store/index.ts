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
      try {
        const [gamesRes, playersRes, battingRes, pitchingRes] = await Promise.all([
          fetch('/api/games'),
          fetch('/api/players'),
          fetch('/api/batting'),
          fetch('/api/pitching')
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
