const fs = require('fs/promises');
const path = require('path');

async function fixGameNumbers() {
  const gamesPath = path.join(__dirname, '../../data/games.json');
  const data = await fs.readFile(gamesPath, 'utf-8');
  let games = JSON.parse(data);

  // We want the array itself to be sorted ascending by game number (which correlates to date ascending)
  // because the user explicitly asked for them to be "sorted by date".
  games.sort((a, b) => a.gameNumber - b.gameNumber);

  await fs.writeFile(gamesPath, JSON.stringify(games, null, 2), 'utf-8');
  console.log('Fixed array order to be ascending by gameNumber!');
}

fixGameNumbers().catch(console.error);
