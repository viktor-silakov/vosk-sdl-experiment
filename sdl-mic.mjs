import sdl from '@kmamal/sdl';
import { EventEmitter } from 'events';
import fs from 'fs';

// Функция для создания заголовка WAV
function createWavHeader(sampleRate, bitsPerSample, numChannels, dataLength) {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const buffer = Buffer.alloc(44);

  // RIFF chunk descriptor
  buffer.write('RIFF', 0); // ChunkID
  buffer.writeUInt32LE(36 + dataLength, 4); // ChunkSize
  buffer.write('WAVE', 8); // Format

  // fmt sub-chunk
  buffer.write('fmt ', 12); // Subchunk1ID
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(numChannels, 22); // NumChannels
  buffer.writeUInt32LE(sampleRate, 24); // SampleRate
  buffer.writeUInt32LE(byteRate, 28); // ByteRate
  buffer.writeUInt16LE(blockAlign, 32); // BlockAlign
  buffer.writeUInt16LE(bitsPerSample, 34); // BitsPerSample

  // data sub-chunk
  buffer.write('data', 36); // Subchunk2ID
  buffer.writeUInt32LE(dataLength, 40); // Subchunk2Size

  return buffer;
}

class SdlMic extends EventEmitter {
  constructor(options = {}) {
    super();
    const devices = sdl.audio.devices.filter(device => device.type === 'recording');

    if (devices.length === 0) {
      throw new Error('No available audio input devices.');
    }

    console.log('Available audio input devices:');
    devices.forEach((device, index) => {
      console.log(`${index}: ${device.name}`);
    });

    this.device = devices[options.deviceIndex || 0];
    this.sampleRate = options.sampleRate || 16000;
    this.channels = options.channels || 1;
    this.format = options.format || 's16'; 
    this.buffered = options.buffered || 4096;
    this.outputFile = options.outputFile || null;
    this.totalBytesWritten = 0;

    if (this.outputFile) {
      this.outputStream = fs.createWriteStream(this.outputFile);
      const wavHeader = createWavHeader(this.sampleRate, 16, this.channels, 0);
      this.outputStream.write(wavHeader);
    }
  }

  start() {
    console.log('☢️', this)
    this.recordingInstance = sdl.audio.openDevice(
      this.device, 
      {
      // ...this.device,
      channels: this.channels,
      frequency: this.sampleRate,
      format: this.format,
      buffered: this.buffered,
    });

    this.recordingInstance.play();
    this.interval = setInterval(() => this.readAudioData(), 100);
  }

  readAudioData() {
    const buffer = Buffer.alloc(this.recordingInstance.buffered * this.recordingInstance.bytesPerSample);
    const bytesRead = this.recordingInstance.dequeue(buffer);
    if (bytesRead > 0) {
      this.emit('data', buffer); // Данные уже в формате s16

      if (this.outputFile) {
        this.totalBytesWritten += buffer.length;
        this.outputStream.write(buffer);
      }
    }
  }

  stop() {
    if (this.recordingInstance) {
      clearInterval(this.interval);
      this.recordingInstance.pause();
      this.recordingInstance.close();
      this.emit('audioProcessExitComplete');

      if (this.outputFile) {
        this.outputStream.end(() => {
          const fileSize = 44 + this.totalBytesWritten;
          const updatedWavHeader = createWavHeader(this.sampleRate, 16, this.channels, this.totalBytesWritten);
          const fd = fs.openSync(this.outputFile, 'r+');
          fs.writeSync(fd, updatedWavHeader, 0, 44, 0);
          fs.closeSync(fd);
        });
      }
    }
  }
}

export default SdlMic;
