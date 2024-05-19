const audioRecorder = require('node-audiorecorder');
const fs = require('fs');

const options = {
  program: 'sox',
  device: null,
  bits: 16,
  channels: 1,
  encoding: 'signed-integer',
  format: 'S16_LE',
  rate: 16000,
  type: 'wav',
  silence: 2,
  thresholdStart: 0.5,
  thresholdStop: 0.5,
  keepSilence: true,
  echoCancel: true,
};

const outputFilePath = 'recording.wav';

console.log('Recording started. Press Ctrl+C to stop.');

const recording = new audioRecorder(options, console);
const fileStream = fs.createWriteStream(outputFilePath);

recording.start().stream().pipe(fileStream);

fileStream.on('finish', () => {
  console.log(`Recording saved to ${outputFilePath}`);
});

process.on('SIGINT', () => {
  console.log('Recording stopped.');
  recording.stop();
  fileStream.end();
});
