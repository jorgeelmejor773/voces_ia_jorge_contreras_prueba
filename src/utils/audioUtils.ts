// Utility functions for audio manipulation, export and calculations

export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Concatenate multiple standard WAV buffers (same sample rate, channels, bit depth) into a single WAV
export function concatenateWavBuffers(wavBase64List: string[], pauseDurationSeconds = 0.5): string {
  if (wavBase64List.length === 0) return '';
  if (wavBase64List.length === 1) return wavBase64List[0];

  const pcmChunks: Uint8Array[] = [];
  let sampleRate = 24000;
  let numChannels = 1;
  let bitsPerSample = 16;

  const pauseSampleCount = Math.floor(sampleRate * pauseDurationSeconds);
  const pauseBytes = new Uint8Array(pauseSampleCount * (bitsPerSample / 8) * numChannels);

  for (let i = 0; i < wavBase64List.length; i++) {
    const wavBytes = base64ToUint8Array(wavBase64List[i]);
    if (wavBytes.length < 44) continue;

    // Check header
    if (i === 0) {
      const view = new DataView(wavBytes.buffer, wavBytes.byteOffset, wavBytes.byteLength);
      numChannels = view.getUint16(22, true);
      sampleRate = view.getUint32(24, true);
      bitsPerSample = view.getUint16(34, true);
    }

    // Extract raw PCM (skip 44-byte WAV header)
    const pcmPart = wavBytes.slice(44);
    pcmChunks.push(pcmPart);

    // Insert pause between chunks if not the last
    if (i < wavBase64List.length - 1 && pauseDurationSeconds > 0) {
      pcmChunks.push(pauseBytes);
    }
  }

  // Calculate total PCM length
  let totalPcmLength = 0;
  for (const chunk of pcmChunks) {
    totalPcmLength += chunk.length;
  }

  // Build new WAV buffer
  const totalLength = 44 + totalPcmLength;
  const mergedWav = new Uint8Array(totalLength);
  const view = new DataView(mergedWav.buffer);

  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;

  // RIFF header
  mergedWav.set([0x52, 0x49, 0x46, 0x46], 0); // "RIFF"
  view.setUint32(4, 36 + totalPcmLength, true);
  mergedWav.set([0x57, 0x41, 0x56, 0x45], 8); // "WAVE"
  mergedWav.set([0x66, 0x6d, 0x74, 0x20], 12); // "fmt "
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  mergedWav.set([0x64, 0x61, 0x74, 0x61], 36); // "data"
  view.setUint32(40, totalPcmLength, true);

  // Copy PCM chunks
  let offset = 44;
  for (const chunk of pcmChunks) {
    mergedWav.set(chunk, offset);
    offset += chunk.length;
  }

  return uint8ArrayToBase64(mergedWav);
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function downloadBase64Wav(base64: string, fileName: string) {
  const bytes = base64ToUint8Array(base64);
  const blob = new Blob([bytes], { type: 'audio/wav' });
  downloadBlob(blob, fileName.endsWith('.wav') ? fileName : `${fileName}.wav`);
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function estimateSpeechDuration(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  // Average Spanish reading speed ~135 words/min = 2.25 words/sec
  return Math.max(1, Math.round((words / 135) * 60));
}

export function generateSrtContent(
  segments: Array<{ text: string; speakerName?: string; duration?: number }>
): string {
  let srt = '';
  let currentTime = 0;

  segments.forEach((seg, index) => {
    const dur = seg.duration || estimateSpeechDuration(seg.text);
    const startTime = formatSrtTimestamp(currentTime);
    const endTime = formatSrtTimestamp(currentTime + dur);

    srt += `${index + 1}\n`;
    srt += `${startTime} --> ${endTime}\n`;
    if (seg.speakerName) {
      srt += `[${seg.speakerName}]: ${seg.text.trim()}\n\n`;
    } else {
      srt += `${seg.text.trim()}\n\n`;
    }

    currentTime += dur + 0.5; // slight break
  });

  return srt;
}

export function generateVttContent(
  segments: Array<{ text: string; speakerName?: string; duration?: number }>
): string {
  let vtt = 'WEBVTT - Generado por VozStudio Español\n\n';
  let currentTime = 0;

  segments.forEach((seg, index) => {
    const dur = seg.duration || estimateSpeechDuration(seg.text);
    const startTime = formatVttTimestamp(currentTime);
    const endTime = formatVttTimestamp(currentTime + dur);

    vtt += `${index + 1}\n`;
    vtt += `${startTime} --> ${endTime}\n`;
    if (seg.speakerName) {
      vtt += `<v ${seg.speakerName}>${seg.text.trim()}\n\n`;
    } else {
      vtt += `${seg.text.trim()}\n\n`;
    }

    currentTime += dur + 0.5;
  });

  return vtt;
}

function formatSrtTimestamp(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const ms = Math.floor((totalSeconds % 1) * 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

function formatVttTimestamp(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const ms = Math.floor((totalSeconds % 1) * 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}
