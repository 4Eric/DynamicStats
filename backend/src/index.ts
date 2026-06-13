import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { parseBoxScore } from './geminiService';
import { getGames, getPlayers, getBattingLines, getPitchingLines, saveGameData, savePlayerTx, deleteGame } from './store';
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
    
    const existingPlayers = await getPlayers();
    
    // Player resolution callback — runs inside the transaction
    const resolvePlayer = async (client: any, line: any, players: any[]) => {
      if (!line.playerId && line.name) {
        let p = players.find((player: any) => player.name.toLowerCase() === line.name.toLowerCase());
        
        if (!p) {
          const newP = { id: crypto.randomUUID(), name: line.name, number: line.number || 0 };
          await savePlayerTx(client, newP);
          players.push(newP);
          p = newP;
        } else if (line.number && p.number === 0) {
          p.number = line.number;
          await savePlayerTx(client, p);
        }
        
        line.playerId = p.id;
      }
    };

    await saveGameData({
      game,
      battingLines: battingLines?.length ? battingLines : undefined,
      pitchingLines: pitchingLines?.length ? pitchingLines : undefined,
      existingPlayers,
      resolvePlayer
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).json({ error: 'Failed to save game data' });
  }
});

app.delete('/api/games/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await deleteGame(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting game:', error);
    res.status(500).json({ error: 'Failed to delete game' });
  }
});

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
