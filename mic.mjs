import sdl from '@kmamal/sdl';
import fs from 'fs';

// Получение списка всех доступных аудиоустройств
const devices = sdl.audio.devices.filter(device => device.type === 'recording');

if (devices.length === 0) {
  console.error('Нет доступных аудиовходов.');
  process.exit(1);
}

console.log('Доступные аудиовходы:');
devices.forEach((device, index) => {
  console.log(`${index}: ${device.name}`);
});

// Выбор устройства (либо из конфигурации, либо первого доступного)
const selectedDeviceIndex = 1; // Здесь можно указать индекс из конфигурации
const selectedDevice = devices[selectedDeviceIndex];

console.log(`Используемое устройство: ${selectedDevice.name}`);

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
  buffer.writeUInt16LE(3, 20); // AudioFormat (3 for IEEE Float)
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

// Параметры записи
const channels = 1;
const sampleRate = 48000;
const bitsPerSample = 32;
const format = 'f32';

// Открываем аудиоустройство для записи
const recordingInstance = sdl.audio.openDevice({
  ...selectedDevice,
  channels,
  frequency: sampleRate,
  format,
  buffered: 4096,
});

// Открываем файл для записи
const outputStream = fs.createWriteStream('recording.wav');

// Пишем заголовок WAV в файл (данные длиной 0, обновим позже)
const wavHeader = createWavHeader(sampleRate, bitsPerSample, channels, 0);
outputStream.write(wavHeader);

// Начинаем запись
recordingInstance.play();

let totalBytesWritten = 0;

// Функция для чтения аудиоданных из буфера и записи в файл
function readAudioData() {
  const buffer = Buffer.alloc(recordingInstance.buffered * recordingInstance.bytesPerSample);
  const bytesRead = recordingInstance.dequeue(buffer);
  if (bytesRead > 0) {
    totalBytesWritten += bytesRead;
    outputStream.write(buffer.slice(0, bytesRead));
  }
}

// Запускаем цикл чтения данных
const interval = setInterval(readAudioData, 100);

// Останавливаем запись через 10 секунд
setTimeout(() => {
  clearInterval(interval);
  recordingInstance.pause();
  outputStream.end(() => {
    // Обновляем заголовок WAV с правильной длиной данных
    const fileSize = 44 + totalBytesWritten;
    const updatedWavHeader = createWavHeader(sampleRate, bitsPerSample, channels, totalBytesWritten);
    const fd = fs.openSync('recording.wav', 'r+');
    fs.writeSync(fd, updatedWavHeader, 0, 44, 0);
    fs.closeSync(fd);
    recordingInstance.close();
  });
}, 10000);
