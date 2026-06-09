import { GoogleGenAI, Type, Schema } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const battingSchema: Schema = {
  type: Type.ARRAY,
  description: "List of player batting statistics extracted from the box score.",
  items: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "Player's name exactly as it appears" },
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
};

const pitchingSchema: Schema = {
  type: Type.ARRAY,
  description: "List of player pitching statistics extracted from the box score.",
  items: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "Pitcher's name exactly as it appears" },
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
};

export async function parseBoxScore(base64Image: string, mimeType: string, type: 'batting' | 'pitching') {
  const schema = type === 'batting' ? battingSchema : pitchingSchema;
  
  const prompt = `
    Analyze the provided baseball box score screenshot.
    Extract the ${type} statistics for all players listed.
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
