package com.anonymous.datalakeexpoapp

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments
import org.tensorflow.lite.Interpreter
import java.io.File
import java.nio.ByteBuffer
import java.nio.ByteOrder
import kotlin.math.sqrt

class BiometricModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "BiometricModule"
    }

    @ReactMethod
    fun analyzeFace(imageUri: String, modelPath: String, promise: Promise) {
        try {
            val uri = Uri.parse(imageUri)
            val path = uri.path ?: throw Exception("Invalid image path")
            val bmp = BitmapFactory.decodeFile(path) ?: throw Exception("Failed to decode Bitmap")

            // ── Load TFLite interpreter ────────────────────────────────────────────
            var interpreter: Interpreter? = null
            try {
                if (modelPath.isNotEmpty()) {
                    val mPath = if (modelPath.startsWith("file://"))
                        Uri.parse(modelPath).path ?: modelPath
                    else modelPath
                    val modelFile = File(mPath)
                    if (modelFile.exists()) {
                        val opts = Interpreter.Options().apply { setNumThreads(4) }
                        interpreter = Interpreter(modelFile, opts)
                    } else {
                        android.util.Log.w("BiometricModule", "Model file not found: $mPath")
                    }
                }
            } catch (e: Exception) {
                android.util.Log.e("BiometricModule", "Model load error: ${e.message}")
            }

            // ── Mean Luminance for Low-Light Detection ─────────────────────────────
            var meanBrightness = 128.0
            try {
                var lumSum = 0.0
                val stepX = maxOf(1, bmp.width / 32)
                val stepY = maxOf(1, bmp.height / 32)
                var count = 0
                for (px in 0 until bmp.width step stepX) {
                    for (py in 0 until bmp.height step stepY) {
                        val c = bmp.getPixel(px, py)
                        val r = (c shr 16) and 0xFF
                        val g = (c shr 8) and 0xFF
                        val b = c and 0xFF
                        lumSum += 0.299 * r + 0.587 * g + 0.114 * b
                        count++
                    }
                }
                meanBrightness = if (count > 0) lumSum / count else 128.0
            } catch (e: Exception) {
                // Ignore luminance errors
            }

            val image = InputImage.fromBitmap(bmp, 0)
            val options = FaceDetectorOptions.Builder()
                .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_ACCURATE)
                .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_ALL)
                .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_ALL)
                .build()

            val detector = FaceDetection.getClient(options)

            detector.process(image)
                .addOnSuccessListener { faces ->
                    val result = Arguments.createMap()
                    result.putDouble("meanBrightness", meanBrightness)

                    if (faces.isEmpty()) {
                        result.putBoolean("faceDetected", false)
                        result.putBoolean("maskLikely", false)
                        interpreter?.close()
                        bmp.recycle()
                        promise.resolve(result)
                    } else {
                        val face = faces[0]
                        result.putBoolean("faceDetected", true)

                        val smileProb = face.smilingProbability ?: -1.0f
                        result.putDouble("smileProbability", smileProb.toDouble())

                        val leftEyeOpenProb = face.leftEyeOpenProbability ?: -1.0f
                        val rightEyeOpenProb = face.rightEyeOpenProbability ?: -1.0f
                        result.putDouble("leftEyeOpenProbability", leftEyeOpenProb.toDouble())
                        result.putDouble("rightEyeOpenProbability", rightEyeOpenProb.toDouble())

                        result.putDouble("yaw", face.headEulerAngleY.toDouble())
                        result.putDouble("pitch", face.headEulerAngleX.toDouble())
                        result.putDouble("roll", face.headEulerAngleZ.toDouble())
                        result.putBoolean("maskLikely", smileProb < 0f)

                        val bounds = Arguments.createMap()
                        bounds.putInt("left", face.boundingBox.left)
                        bounds.putInt("top", face.boundingBox.top)
                        bounds.putInt("width", face.boundingBox.width())
                        bounds.putInt("height", face.boundingBox.height())
                        result.putMap("bounds", bounds)

                        // ── Crop + Scale face for MobileFaceNet ────────────────────────────
                        try {
                            val leftC   = maxOf(0, face.boundingBox.left)
                            val topC    = maxOf(0, face.boundingBox.top)
                            val widthC  = minOf(bmp.width - leftC,  face.boundingBox.width())
                            val heightC = minOf(bmp.height - topC, face.boundingBox.height())

                            if (widthC > 0 && heightC > 0) {
                                val croppedBmp = Bitmap.createBitmap(bmp, leftC, topC, widthC, heightC)
                                val resizedBmp = Bitmap.createScaledBitmap(croppedBmp, 112, 112, true)

                                val pixels = IntArray(112 * 112)
                                resizedBmp.getPixels(pixels, 0, 112, 0, 0, 112, 112)

                                // ── Export raw pixels to JS (NHWC: R,G,B per pixel) ───────────
                                val pixelsArray = Arguments.createArray()
                                for (i in 0 until 112 * 112) {
                                    val c = pixels[i]
                                    pixelsArray.pushInt((c shr 16) and 0xFF) // R
                                    pixelsArray.pushInt((c shr 8) and 0xFF)  // G
                                    pixelsArray.pushInt(c and 0xFF)          // B
                                }
                                result.putArray("facePixels", pixelsArray)

                                // ── Build TFLite input buffer (NHWC, float32) ──────────────────
                                // FIX: NHWC layout — interleave R,G,B per pixel as float32.
                                // Normalize uint8 [0,255] -> float32 [-1,1]: val = pixel/127.5 - 1.0
                                val inputBuffer = ByteBuffer.allocateDirect(112 * 112 * 3 * 4)
                                inputBuffer.order(ByteOrder.nativeOrder())
                                for (i in 0 until 112 * 112) {
                                    val c = pixels[i]
                                    val r = (c shr 16) and 0xFF
                                    val g = (c shr 8) and 0xFF
                                    val b = c and 0xFF
                                    inputBuffer.putFloat(r / 127.5f - 1.0f)
                                    inputBuffer.putFloat(g / 127.5f - 1.0f)
                                    inputBuffer.putFloat(b / 127.5f - 1.0f)
                                }
                                inputBuffer.rewind()

                                // ── Run TFLite inference ───────────────────────────────────────
                                if (interpreter != null) {
                                    try {
                                        // Get actual output tensor details
                                        val outTensor   = interpreter.getOutputTensor(0)
                                        val outShape    = outTensor.shape()
                                        val outElements = outShape.fold(1) { acc, d -> acc * d }

                                        android.util.Log.d("BiometricModule",
                                            "Output tensor: shape=${outShape.contentToString()}, elements=$outElements")

                                        // float32 output — 4 bytes per element, no dequantization needed
                                        val outputBuffer = ByteBuffer.allocateDirect(outElements * 4)
                                        outputBuffer.order(ByteOrder.nativeOrder())

                                        interpreter.run(inputBuffer, outputBuffer)
                                        outputBuffer.rewind()

                                        // Read float32 values directly
                                        val rawEmbedding = FloatArray(outElements)
                                        for (i in 0 until outElements) {
                                            rawEmbedding[i] = outputBuffer.getFloat()
                                        }

                                        // L2 normalize
                                        var sumSq = 0.0f
                                        for (v in rawEmbedding) sumSq += v * v
                                        val norm = sqrt(sumSq.toDouble()).toFloat()

                                        val embeddingArray = Arguments.createArray()
                                        for (i in 0 until outElements) {
                                            val nv = if (norm > 0f) rawEmbedding[i] / norm else 0f
                                            embeddingArray.pushDouble(nv.toDouble())
                                        }
                                        result.putArray("faceEmbedding", embeddingArray)

                                        android.util.Log.d("BiometricModule",
                                            "Embedding extracted: ${outElements} dims, pre-norm magnitude=$norm")

                                    } catch (e: Exception) {
                                        android.util.Log.e("BiometricModule", "TFLite run error: ${e.message}")
                                    } finally {
                                        interpreter.close()
                                    }
                                }

                                croppedBmp.recycle()
                                resizedBmp.recycle()
                            }
                        } catch (e: Exception) {
                            android.util.Log.e("BiometricModule", "Face crop/embed error: ${e.message}")
                        }

                        bmp.recycle()
                        promise.resolve(result)
                    }
                }
                .addOnFailureListener { e ->
                    interpreter?.close()
                    bmp.recycle()
                    promise.reject("FACE_DETECTION_ERROR", e.message, e)
                }
        } catch (e: Exception) {
            promise.reject("INVALID_IMAGE", e.message, e)
        }
    }
}
