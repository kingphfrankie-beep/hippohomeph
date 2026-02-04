
import { GoogleGenAI, Type } from "@google/genai";
import { PropertyListing, SearchFilters } from "../types";

export interface SearchResult {
  listings: PropertyListing[];
  aiAnalysis: string;
  sources: any[];
  suggestedPrompts: string[];
}

export const searchListings = async (filters: SearchFilters): Promise<SearchResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const priceContext = (filters.minPrice || filters.maxPrice) 
    ? `Target Budget Range: PHP ${filters.minPrice || 0} to ${filters.maxPrice || 'Any'}.`
    : "";

  const directSourceContext = filters.directSourceMode === 'verified' 
    ? `MODE: ELITE VERIFIED DIRECT OWNER ONLY.
       
       MANDATORY VERIFICATION PROTOCOLS:
       1. DESCRIPTION TONE ANALYSIS: 
          - Owners use personal, descriptive, or emotional language (e.g., "Our family home for 10 years", "Moving to US", "Well-loved unit"). 
          - Agents use repetitive templates, bullet-heavy corporate marketing, and "call-to-action" pressure.
       2. JARGON & ACRONYM SCAN:
          - IMMEDIATELY DISQUALIFY if description contains: "PRC License", "HLURB", "DHSUD", "REB", "REA", "RFO", "VAT Inclusive", "Reservation Fee", "Brokerage", "Exclusive Listing", "Commission".
       3. LISTING FREQUENCY CHECK:
          - Use Google Search to cross-reference the contact name/number or profile.
          - If the poster has more than 3 active listings across different areas, they are an AGENT.
          - Genuine Owners typically have only 1-2 listings.
       4. CONTACT ROLE LABELING:
          - If verified as owner based on tone and low frequency, label 'contactRole' as 'Owner'.
          - If metadata suggests a direct personal contact but is ambiguous, label 'Direct Contact'.
          - If any agent signs are found, label as 'Agent'.`
    : filters.directSourceMode === 'direct'
    ? "MODE: DIRECT OWNER PREFERRED. Look for individual sellers. Flag agents if found but prioritize owners."
    : "MODE: ALL SOURCES. Include institutional portals, brokers, and agents.";

  const prompt = `
    Perform a high-precision property scan for HippoHomesPH:
    - Target: "${filters.query}"
    - Sector: ${filters.location}
    - ${directSourceContext}
    ${priceContext}

    GEOGRAPHIC INTELLIGENCE:
    - Provide "lat" and "lng" coordinates for map visualization.

    DATA INTEGRITY & GROUNDING:
    - All URLs must be reachable.
    - Provide a "verificationNote" for each listing explaining why it's categorized as Owner, Agent, or Direct Contact. Mention specific triggers (e.g., "Used personal tone", "No broker jargon found", "Multiple listings detected").
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: `You are the HippoHomes Lead Intelligence & Verification Officer. 
        Your mandate is to detect and label agents vs. owners with extreme prejudice. 
        You use tone analysis and listing frequency checks. 
        If a user asks for 'verified' mode, you are strictly excluding brokers.`,
        thinkingConfig: { thinkingBudget: 24000 },
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            listings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  price: { type: Type.STRING },
                  location: { type: Type.STRING },
                  source: { type: Type.STRING },
                  sourceUrl: { type: Type.STRING },
                  description: { type: Type.STRING },
                  contactName: { type: Type.STRING },
                  contactNumber: { type: Type.STRING },
                  contactRole: { type: Type.STRING, enum: ['Owner', 'Agent', 'Direct Contact', 'Unknown'] },
                  isDirectOwner: { type: Type.BOOLEAN },
                  verificationNote: { type: Type.STRING },
                  lat: { type: Type.NUMBER },
                  lng: { type: Type.NUMBER }
                },
                required: ["id", "title", "sourceUrl", "price", "source", "contactRole", "isDirectOwner", "lat", "lng"]
              }
            },
            aiAnalysis: { type: Type.STRING },
            suggestedPrompts: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    const resultText = response.text || '{"listings": [], "aiAnalysis": "", "suggestedPrompts": []}';
    const parsed = JSON.parse(resultText);
    return {
      listings: parsed.listings || [],
      aiAnalysis: parsed.aiAnalysis || "",
      suggestedPrompts: parsed.suggestedPrompts || [],
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error: any) {
    console.error("HippoHomes Intel Node Failure:", error);
    throw error;
  }
};
