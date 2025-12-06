
import { GoogleGenAI, Type } from "@google/genai";
import { DisasterEvent, RiskAnalysisResult } from "../types";

// Initialize Gemini client
// Note: In a production app, ensure error handling if API_KEY is missing.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const geminiService = {
  /**
   * Analyzes a disaster event to provide risk assessment and predictions.
   */
  async analyzeDisasterRisk(event: DisasterEvent): Promise<RiskAnalysisResult> {
    if (!process.env.API_KEY) {
      return {
        riskScore: 0,
        summary: "API Key missing. Unable to generate analysis.",
        predictedImpact: "N/A",
        recommendedActions: []
      };
    }

    try {
      const prompt = `
        Analyze the following disaster event in Southeast Asia, acting as a disaster risk specialist.
        Critically evaluate the risk by cross-referencing with historical disaster data and geographical vulnerability for this specific region.

        Event Details:
        - Title: ${event.title}
        - Type: ${event.type}
        - Country: ${event.country}
        - Coordinates: ${event.location.lat}, ${event.location.lng}
        - Severity Level: ${event.severity}
        - Description: ${event.description}

        Analysis Requirements:
        1. Contextualize this event against historical data for ${event.country} (e.g., is this a rare high-impact event or a common seasonal occurrence?).
        2. Assess vulnerability based on the specific coordinates (population density, terrain, proximity to coast/fault lines).
        3. Predict the spread/impact based on how similar historical events evolved in this area.

        Provide a JSON response with the following structure:
        {
          "riskScore": (number 1-100, weighted by historical vulnerability),
          "summary": (string, concise situation report including a reference to historical patterns),
          "predictedImpact": (string, forecast of consequences over the next 24-48 hours),
          "recommendedActions": (array of strings, top 3 specific actions for local authorities)
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              riskScore: { type: Type.NUMBER },
              summary: { type: Type.STRING },
              predictedImpact: { type: Type.STRING },
              recommendedActions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            }
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from Gemini");
      
      return JSON.parse(text) as RiskAnalysisResult;
    } catch (error) {
      console.error("Gemini analysis failed:", error);
      return {
        riskScore: 50,
        summary: "Automated analysis temporarily unavailable.",
        predictedImpact: "Unable to calculate spread prediction.",
        recommendedActions: ["Monitor local news", "Follow official evacuation orders"]
      };
    }
  },

  /**
   * Generates a "Simulated" news report or additional context for a specific region.
   */
  async generateRegionalSummary(country: string): Promise<string> {
    if (!process.env.API_KEY) return "AI service unavailable.";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a brief, realistic 1-paragraph summary of current environmental and disaster risks in ${country} based on typical seasonal patterns (Monsoon, Typhoon season, etc.) for the current month. Do not mention specific dates, just general current risk profile.`
        });
        return response.text || "No summary available.";
    } catch (e) {
        return "Could not load regional summary.";
    }
  }
};
