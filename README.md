# Vosk + Node SDL Experiment

This experimental project demonstrates real-time speech recognition using [Vosk](https://github.com/alphacep/vosk-api) with [SDL](https://github.com/kmamal/node-sdl) for more flexible microphone handling compared to other Node.js libraries, allowing at least the selection of a different recording device for macOS.

## Overview

This repository includes:
- The original `vosk-record.js` file from the Vosk repository. This script is a near-original copy from the [Vosk](https://github.com/alphacep/vosk-api) repository. It uses the `mic` library to capture audio from the microphone and performs real-time speech recognition.
- A modified `record-sdl.mjs` file to use [`@kmamal/sdl`](https://github.com/kmamal/node-sdl) for microphone input, providing more flexibility. It also includes functionality to record audio to a file.
- An auxiliary module `sdl-mic.mjs` to facilitate microphone handling via SDL. This module supports recording to a file and emits audio data events.
