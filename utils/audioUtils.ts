
function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  // Ensure we handle the underlying buffer correctly with offsets
  // PCM 16-bit is 2 bytes per sample
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Convert 16-bit PCM (-32768 to 32767) to Float32 (-1.0 to 1.0)
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

let audioContext: AudioContext | null = null;
let nextStartTime = 0;
const activeSources = new Set<AudioBufferSourceNode>();

/**
 * Plays raw PCM audio data (usually 24kHz Mono from Gemini TTS)
 */
export const playRawPcm = async (base64Audio: string, isFirstChunk: boolean = true): Promise<void> => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 24000,
    });
  }

  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  if (isFirstChunk) {
    stopPlayback();
    nextStartTime = audioContext.currentTime + 0.05;
  }

  try {
    const bytes = decodeBase64(base64Audio);
    const audioBuffer = await decodeAudioData(bytes, audioContext, 24000, 1);
    
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    
    const startTime = Math.max(nextStartTime, audioContext.currentTime);
    source.start(startTime);
    
    nextStartTime = startTime + audioBuffer.duration;
    activeSources.add(source);

    return new Promise((resolve) => {
      source.onended = () => {
        activeSources.delete(source);
        resolve();
      };
    });
  } catch (e) {
    console.error("Failed to decode or play PCM audio", e);
  }
};

export const stopPlayback = () => {
  // 1. Stop PCM/Neural Playback
  activeSources.forEach(source => {
    try { 
      source.onended = null;
      source.stop(); 
    } catch (e) {}
  });
  activeSources.clear();
  nextStartTime = 0;

  // 2. Stop Browser Speech Synthesis Fallback
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};
