import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { parseBoxScore } from './geminiService';
import { getGames, getPlayers, saveGame, saveBattingLines, savePitchingLines, getBattingLines, getPitchingLines, savePlayer } from './store';
import crypto from 'crypto';


const app = express();
const port = process.env.PORT || 3001;
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/games', async (req, res) => {
  res.json(await getGames());
});

app.get('/api/players', async (req, res) => {
  res.json(await getPlayers());
});

app.get('/api/batting', async (req, res) => {
  res.json(await getBattingLines());
});

app.get('/api/pitching', async (req, res) => {
  res.json(await getPitchingLines());
});

app.post('/api/ingest/screenshot', upload.single('screenshot'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }
    
    // Convert buffer to base64
    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;
    const type = req.body.type as 'batting' | 'pitching';
    
    if (!type) {
      return res.status(400).json({ error: 'Type (batting or pitching) must be provided' });
    }

    const parsedData = await parseBoxScore(base64Image, mimeType, type);
    res.json({ data: parsedData });
  } catch (error) {
    console.error('Error parsing screenshot:', error);
    res.status(500).json({ error: 'Failed to parse screenshot' });
  }
});

app.post('/api/ingest/confirm', async (req, res) => {
  try {
    const { game, battingLines, pitchingLines } = req.body;
    
    // Basic validation
    if (!game || !game.id) return res.status(400).json({ error: 'Game data required' });
    
    const players = await getPlayers();
    
    const resolvePlayers = async (lines: any[]) => {
      if (!lines) return [];
      for (const line of lines) {
        line.gameId = game.id;
        if (!line.playerId && line.name) {
          let p = players.find(player => player.name.toLowerCase() === line.name.toLowerCase());
          if (!p) {
            const newP = { id: crypto.randomUUID(), name: line.name, number: 0, positions: [] };
            await savePlayer(newP);
            players.push(newP);
            p = newP;
          }
          line.playerId = p.id;
        }
      }
      return lines;
    };

    await saveGame(game);

    if (battingLines?.length) {
      await saveBattingLines(await resolvePlayers(battingLines));
    }
    if (pitchingLines?.length) {
      await savePitchingLines(await resolvePlayers(pitchingLines));
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).json({ error: 'Failed to save game data' });
  }
});

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
