import { GoogleGenAI, Type } from "@google/genai";
import { Match, Team } from '../types';

export const simulateRoundWithGemini = async (
  matches: Match[],
  teams: Team[]
): Promise<{ matches: Match[]; news: { headline: string; content: string } } | null> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.warn("No API Key found. Falling back to simple math simulation.");
      return null;
    }

    const ai = new GoogleGenAI({ apiKey });
    // Determine if it is a knockout round (no draws allowed) based on stage
    const isCupRound = matches.some(m => m.stage !== 'LEAGUE' && m.stage !== 'GROUP_STAGE');

    // Prepare context for the AI
    const matchDescriptions = matches.map(m => {
      const home = teams.find(t => t.id === m.homeTeamId);
      const away = teams.find(t => t.id === m.awayTeamId);
      return {
        id: m.id,
        matchup: `${home?.name} vs ${away?.name}`,
        homeStrength: home?.strength,
        awayStrength: away?.strength
      };
    });

    const prompt = `
      Simulate the following football matches for the "LigaSim 2000" tournament.
      Consider team strengths (higher is better). 
      
      ${isCupRound ? 'IMPORTANT: These are KNOCKOUT CUP matches. THERE MUST BE A WINNER. NO DRAWS ALLOWED. If scores are level, simulate extra time/penalties score (e.g., 2-2 but assign a winner).' : 'Scores should be realistic (e.g., 0-0, 1-0, 2-1, 3-2, occasionally 4-0). Draws are allowed.'}
      
      Also provide a short news headline and a brief summary of the round's most exciting event.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt + JSON.stringify(matchDescriptions),
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            results: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  homeScore: { type: Type.INTEGER },
                  awayScore: { type: Type.INTEGER },
                  commentary: { type: Type.STRING, description: "Very short comment on the match result" }
                }
              }
            },
            news: {
              type: Type.OBJECT,
              properties: {
                headline: { type: Type.STRING },
                content: { type: Type.STRING }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      
      const updatedMatches = matches.map(match => {
        const result = data.results.find((r: any) => r.id === match.id);
        if (result) {
          // Force winner if cup match and AI returned draw (fallback safety)
          let hScore = result.homeScore;
          let aScore = result.awayScore;
          if (isCupRound && hScore === aScore) {
            hScore += 1; // Arbitrary simple fix for UI consistency
            result.commentary += " (Won in ET)";
          }

          return {
            ...match,
            homeScore: hScore,
            awayScore: aScore,
            played: true,
            commentary: result.commentary
          };
        }
        return match;
      });

      return {
        matches: updatedMatches,
        news: data.news
      };
    }

    return null;
  } catch (error) {
    console.error("Gemini Simulation Error:", error);
    return null;
  }
};