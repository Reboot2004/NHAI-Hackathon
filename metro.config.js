const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Allow Metro to bundle binary model files as static assets
// .tflite  — legacy TFLite model (kept for reference)
// .pt      — PyTorch serialised state-dict (fine-tuned INT8 MobileFaceNet)
config.resolver.assetExts.push('tflite', 'pt');

module.exports = config;
