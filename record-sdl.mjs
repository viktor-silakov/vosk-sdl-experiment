import vosk from 'vosk';
import fs from 'fs';
import SdlMic from './sdl-mic.mjs';
import { format } from 'path';

const MODEL_PATH = 'models/ru_small';
const SAMPLE_RATE = 16000;
const BUFFER_SIZE = 8192;

if (!fs.existsSync(MODEL_PATH)) {
  console.log('Please download the model from https://alphacephei.com/vosk/models and unpack as ' + MODEL_PATH + ' in the current folder.');
  process.exit();
}

vosk.setLogLevel(0);
const model = new vosk.Model(MODEL_PATH);
const rec = new vosk.Recognizer({ model: model, sampleRate: SAMPLE_RATE });

const micInstance = new SdlMic({
  sampleRate: SAMPLE_RATE,
  channels: 1,
  deviceIndex: 1, // Укажите нужный индекс устройства или оставьте по умолчанию
  outputFile: 'recording.wav', // Укажите путь к файлу, если нужна запись в файл
  format: 's16'
});

micInstance.on('data', data => {

  if (rec.acceptWaveform(data)) {
    console.log(rec.result());
  } else {
    console.log(rec.partialResult());
  }
});

process.on('SIGINT', () => {
  console.log('\nStopping');
  micInstance.stop();
});

micInstance.start();
