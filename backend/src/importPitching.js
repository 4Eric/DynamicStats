const fs = require('fs');
const crypto = require('crypto');

const tsv = fs.readFileSync('../../data/raw_pitching.tsv', 'utf-8').trim().split('\n').slice(1);
const games = JSON.parse(fs.readFileSync('../../data/games.json', 'utf8'));
const players = JSON.parse(fs.readFileSync('../../data/players.json', 'utf8'));

const pitchingLines = [];
let nextGameNumber = Math.max(...games.map(g => g.gameNumber)) + 1;

for (const line of tsv) {
  const [DateStr, Opponent, Result, Score, PitcherStr, IP, H, R, ER, BB, SO, PS, BF] = line.split('\t');
  
  // Date format: 'Tue, May 5'
  const monthMatch = DateStr.match(/([A-Z][a-z]+) (\d+)/);
  if (!monthMatch) continue;
  const monthNames = { 'May': '05', 'Jun': '06', 'Jul': '07' };
  const month = monthNames[monthMatch[1]];
  const day = monthMatch[2].padStart(2, '0');
  const d = `2026-${month}-${day}`;
  
  // Try to find a matching game
  let game = games.find(g => g.date === d && (
    g.opponent === Opponent || 
    g.opponent.startsWith(Opponent.split(' ')[0]) ||
    Opponent.startsWith(g.opponent.split(' ')[0])
  ));
  
  if (!game) {
    // try just opponent matching around that date, or anywhere if it's uniquely named
    game = games.find(g => g.opponent.includes(Opponent.split(' ')[0]));
  }
  
  if (!game) {
    // If absolutely no game, create it
    game = {
      id: crypto.randomUUID(),
      date: d,
      opponent: Opponent,
      ourScore: 0,
      opponentScore: 0,
      result: Result,
      gameNumber: nextGameNumber++
    };
    games.push(game);
  }
  
  if (game) {
    game.result = Result;
    if (Score) {
      const [ourS, oppS] = Score.split('-');
      game.ourScore = parseInt(ourS, 10);
      game.opponentScore = parseInt(oppS, 10);
    }
  }
  
  const pName = PitcherStr.split(' #')[0];
  let player = players.find(p => p.name === pName);
  if (!player) {
    player = { id: crypto.randomUUID(), name: pName, number: parseInt((PitcherStr.split('#')[1] || '').trim() || '0'), positions: [] };
    players.push(player);
  }
  
  const [pitches, strikes] = (PS || '0-0').split('-');
  
  pitchingLines.push({
    gameId: game.id,
    playerId: player.id,
    IP: parseFloat(IP || 0),
    H: parseInt(H || 0),
    R: parseInt(R || 0),
    ER: parseInt(ER || 0),
    BB: parseInt(BB || 0),
    SO: parseInt(SO || 0),
    HBP: 0,
    pitches: parseInt(pitches || 0),
    strikes: parseInt(strikes || 0),
    BF: parseInt(BF || 0),
    WP: 0
  });
}

// Re-sort games chronologically and reassign game numbers
games.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
games.forEach((g, idx) => g.gameNumber = idx + 1);

fs.writeFileSync('../../data/games.json', JSON.stringify(games, null, 2), 'utf8');
fs.writeFileSync('../../data/pitching.json', JSON.stringify(pitchingLines, null, 2), 'utf8');
fs.writeFileSync('../../data/players.json', JSON.stringify(players, null, 2), 'utf8');

console.log('Imported pitching lines:', pitchingLines.length);
