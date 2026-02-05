
import { GoogleGenAI, Modality } from "@google/genai";
import { getApiKey, withRetry } from "../utils/apiUtils";
import { playRawPcm, stopPlayback } from "../utils/audioUtils";

/**
 * Uses Gemini 2.5 Neural TTS for human-like natural speech.
 * Falls back to browser Web Speech API if offline or quota exceeded.
 */
export const speakWithFallback = async (text: string, lang: string): Promise<void> => {
  if (!text) return;
  
  // 1. Stop any existing playback (Both PCM and Browser)
  stopPlayback();

  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    // Model selection for high-quality TTS
    const model = 'gemini-2.5-flash-preview-tts';
    
    // Style instructions help the AI sound more human and less robotic
    const styleInstruction = lang === 'ta' 
      ? "இயற்கையான, கனிவான மற்றும் உதவியாக இருக்கும் ஒரு தமிழ் விவசாய நிபுணரின் குரலில் இதைப் படிக்கவும்: " 
      : "Read this in a warm, professional, and helpful natural human voice of an Indian agricultural expert: ";

    const response = await withRetry(async () => {
      return await ai.models.generateContent({
        model: model,
        contents: [{ parts: [{ text: styleInstruction + text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              // 'Kore' is a balanced, high-quality voice profile
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });
    }, 1); // Low retry count to maintain UX speed

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (base64Audio) {
      // Play the high-quality neural audio
      await playRawPcm(base64Audio, true);
      return;
    }
  } catch (err) {
    console.warn("Gemini Neural TTS failed, using robotic fallback", err);
  }

  // 2. Fallback to browser's native (and robotic) speech if AI fails
  return speakWithBrowserTTS(text, lang);
};

/**
 * Robotic fallback using local OS voices
 */
const speakWithBrowserTTS = (text: string, lang: string): Promise<void> => {
  return new Promise((resolve) => {
    const cleanText = text.replace(/[*#_\[\]\\]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    
    if (lang === 'ta') {
      utterance.lang = 'ta-IN';
      const tamilVoice = voices.find(v => v.lang.includes('ta'));
      if (tamilVoice) utterance.voice = tamilVoice;
    } else {
      utterance.lang = 'en-IN';
      const indianVoice = voices.find(v => v.lang === 'en-IN' || v.name.includes('India'));
      if (indianVoice) utterance.voice = indianVoice;
    }

    utterance.rate = 0.95; 
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    window.speechSynthesis.speak(utterance);
  });
};

// Pre-fetch voices for fallback
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
}
