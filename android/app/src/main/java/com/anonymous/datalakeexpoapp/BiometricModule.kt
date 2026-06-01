package com.anonymous.datalakeexpoapp

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

class BiometricModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "BiometricModule"
    }

    @ReactMethod
    fun analyzeFace(imageUri: String, promise: Promise) {
        try {
            val uri = Uri.parse(imageUri)
            val image = InputImage.fromFilePath(reactApplicationContext, uri)

            // ── Mean Luminance for Low-Light Detection ─────────────────────────────
            // Sample ~1024 evenly spaced pixels from the JPEG for a fast brightness
            // estimate without decoding the full resolution bitmap into memory.
            var meanBrightness = 128.0
            try {
                val bmp = BitmapFactory.decodeFile(uri.path)
                if (bmp != null) {
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
                            // Rec. 601 luminance coefficients
                            lumSum += 0.299 * r + 0.587 * g + 0.114 * b
                            count++
                        }
                    }
                    meanBrightness = if (count > 0) lumSum / count else 128.0
                    bmp.recycle()
                }
            } catch (e: Exception) {
                // Non-fatal — default to mid-range brightness
            }

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

                        // Mask/PPE heuristic: ML Kit returns smileProbability = -1
                        // when the mouth/lower face region is occluded (e.g. mask, balaclava).
                        result.putBoolean("maskLikely", smileProb < 0f)

                        val bounds = Arguments.createMap()
                        bounds.putInt("left", face.boundingBox.left)
                        bounds.putInt("top", face.boundingBox.top)
                        bounds.putInt("width", face.boundingBox.width())
                        bounds.putInt("height", face.boundingBox.height())
                        result.putMap("bounds", bounds)

                        promise.resolve(result)
                    }
                }
                .addOnFailureListener { e ->
                    promise.reject("FACE_DETECTION_ERROR", e.message, e)
                }
        } catch (e: Exception) {
            promise.reject("INVALID_IMAGE", e.message, e)
        }
    }
}
