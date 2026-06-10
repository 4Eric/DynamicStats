import { GoogleGenAI, Type, Schema } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const gameSchemaProperties = {
  opponent: { type: Type.STRING, description: "Name of the opposing team, e.g. Burlington Bulls" },
  date: { type: Type.STRING, description: "Date of the game (YYYY-MM-DD)" },
  ourScore: { type: Type.INTEGER, description: "Runs scored by our team" },
  opponentScore: { type: Type.INTEGER, description: "Runs scored by the opposing team" },
  result: { type: Type.STRING, description: "W, L, or T" }
};

const battingSchema: Schema = {
  type: Type.OBJECT,
  description: "Extracted game data and player batting statistics.",
  properties: {
    game: {
      type: Type.OBJECT,
      properties: gameSchemaProperties
    },
    lines: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Player's name exactly as it appears in the row (e.g. 'N Shah #14 (LF)')" },
          number: { type: Type.INTEGER, description: "Player's uniform number extracted from the name field" },
          AB: { type: Type.INTEGER },
          R: { type: Type.INTEGER },
          H: { type: Type.INTEGER },
          RBI: { type: Type.INTEGER },
          BB: { type: Type.INTEGER },
          SO: { type: Type.INTEGER },
          doubles: { type: Type.INTEGER, description: "2B" },
          triples: { type: Type.INTEGER, description: "3B" },
          HR: { type: Type.INTEGER },
          TB: { type: Type.INTEGER },
          SB: { type: Type.INTEGER },
          CS: { type: Type.INTEGER },
          HBP: { type: Type.INTEGER },
          E: { type: Type.INTEGER, description: "Errors" }
        },
        required: ["name", "AB", "R", "H", "RBI", "BB", "SO"]
      }
    }
  }
};

const pitchingSchema: Schema = {
  type: Type.OBJECT,
  description: "Extracted game data and player pitching statistics.",
  properties: {
    game: {
      type: Type.OBJECT,
      properties: gameSchemaProperties
    },
    lines: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Pitcher's name exactly as it appears" },
          number: { type: Type.INTEGER, description: "Player's uniform number extracted from the name field" },
          IP: { type: Type.NUMBER, description: "Innings Pitched, stored as decimal e.g. 1.2" },
          H: { type: Type.INTEGER },
          R: { type: Type.INTEGER },
          ER: { type: Type.INTEGER },
          BB: { type: Type.INTEGER },
          SO: { type: Type.INTEGER },
          HBP: { type: Type.INTEGER },
          pitches: { type: Type.INTEGER },
          strikes: { type: Type.INTEGER },
          BF: { type: Type.INTEGER },
          WP: { type: Type.INTEGER }
        },
        required: ["name", "IP", "H", "R", "ER", "BB", "SO"]
      }
    }
  }
};

export async function parseBoxScore(base64Image: string, mimeType: string, type: 'batting' | 'pitching') {
  const schema = type === 'batting' ? battingSchema : pitchingSchema;
  
  const prompt = `
    Analyze the provided baseball box score screenshot.
    Extract the ${type} statistics for all players listed.
    Also extract the overall game metadata (opponent, date, scores) from the header if visible.
    Ensure that IP (Innings Pitched) is extracted as a decimal (e.g. 1.2 means 1 and 2/3 innings).
    Provide the output in the structured JSON format requested.
  `;

  const response = await genAI.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType
        }
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.1
    }
  });

  if (response.text) {
    try {
      return JSON.parse(response.text);
    } catch (e) {
      console.error("Failed to parse Gemini response as JSON", e);
      throw new Error("Invalid response format from Gemini");
    }
  }
  
  throw new Error("No response from Gemini");
}
