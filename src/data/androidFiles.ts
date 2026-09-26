import { AndroidProjectFile } from '../types';

export const ANDROID_PROJECT_FILES: AndroidProjectFile[] = [
  {
    path: 'app/src/main/AndroidManifest.xml',
    name: 'AndroidManifest.xml',
    category: 'Manifest',
    language: 'xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <!-- Audio Hardware & Recording Permissions -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <!-- Android 13+ (API 33) Notification Permission -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <!-- Android 14 (API 34) Foreground Service Requirements -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />

    <!-- Real Cellular Call Detection & Management -->
    <uses-permission android:name="android.permission.READ_PHONE_STATE" />
    <uses-permission android:name="android.permission.READ_CALL_LOG" />
    <uses-permission android:name="android.permission.ANSWER_PHONE_CALLS" />
    <uses-permission android:name="android.permission.MANAGE_OWN_CALLS" />

    <!-- Floating Live Subtitles Overlay over Active Phone Calls -->
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />

    <!-- Bluetooth Headset / SCO Audio Routing -->
    <uses-permission android:name="android.permission.BLUETOOTH" android:maxSdkVersion="30" />
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />

    <application
        android:allowBackup="true"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="@xml/backup_rules"
        android:icon="@mipmap/ic_launcher"
        android:label="Real-Time Call Translator"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.Material3.DayNight.NoActionBar">

        <!-- Main Compose Activity -->
        <activity
            android:name=".ui.MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:configChanges="orientation|screenSize|screenLayout|keyboardHidden"
            android:theme="@style/Theme.Material3.DayNight.NoActionBar">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Real Phone Call State BroadcastReceiver -->
        <receiver
            android:name=".telephony.RealCallStateReceiver"
            android:enabled="true"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.PHONE_STATE" />
            </intent-filter>
        </receiver>

        <!-- Android Telecom InCallService Companion for Real Call Management -->
        <service
            android:name=".telecom.InCallServiceImpl"
            android:permission="android.permission.BIND_INCALL_SERVICE"
            android:exported="true">
            <intent-filter>
                <action android:name="android.telecom.InCallService" />
            </intent-filter>
        </service>

        <!-- Android 14 Foreground Service with Microphone + Media Playback -->
        <service
            android:name=".service.CallTranslationService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="microphone|mediaPlayback" />

        <!-- Floating Live Subtitles Heads-Up Overlay Service -->
        <service
            android:name=".overlay.FloatingCallOverlayService"
            android:enabled="true"
            android:exported="false" />

    </application>
</manifest>`
  },
  {
    path: 'app/build.gradle.kts',
    name: 'build.gradle.kts (app)',
    category: 'Gradle',
    language: 'kotlin',
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.compose.compiler)
}

android {
    namespace = "com.voicecall.translation"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.voicecall.translation"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildFeatures {
        compose = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
        freeCompilerArgs += listOf(
            "-opt-in=kotlinx.coroutines.ExperimentalCoroutinesApi",
            "-opt-in=androidx.compose.material3.ExperimentalMaterial3Api"
        )
    }
}

dependencies {
    val ktorVersion = "2.3.12"
    val coroutinesVersion = "1.8.1"
    val lifecycleVersion = "2.8.4"

    // AndroidX & Architecture
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:$lifecycleVersion")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:$lifecycleVersion")
    implementation("androidx.activity:activity-compose:1.9.1")

    // Jetpack Compose (BOM)
    val composeBom = platform("androidx.compose:compose-bom:2024.06.00")
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")

    // Kotlin Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:$coroutinesVersion")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:$coroutinesVersion")

    // Ktor CIO Client for Low-Latency WebSockets & Audio Streaming
    implementation("io.ktor:ktor-client-core:$ktorVersion")
    implementation("io.ktor:ktor-client-cio:$ktorVersion")
    implementation("io.ktor:ktor-client-websockets:$ktorVersion")
    implementation("io.ktor:ktor-client-logging:$ktorVersion")

    // KotlinX Serialization JSON
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.1")
}`
  },
  {
    path: 'app/src/main/java/com/voicecall/translation/telephony/RealCallStateReceiver.kt',
    name: 'RealCallStateReceiver.kt',
    category: 'Kotlin',
    language: 'kotlin',
    content: `package com.voicecall.translation.telephony

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.telephony.TelephonyManager
import android.util.Log
import com.voicecall.translation.overlay.FloatingCallOverlayService
import com.voicecall.translation.service.CallTranslationService

/**
 * RealCallStateReceiver:
 * BroadcastReceiver triggered by Android OS upon real cellular call events.
 * 
 * Flow:
 * - EXTRA_STATE_RINGING: Incoming call detected.
 * - EXTRA_STATE_OFFHOOK: Call answered / active! Automatically boots CallTranslationService
 *   and FloatingCallOverlayService to display live translated subtitles over the dialer.
 * - EXTRA_STATE_IDLE: Call ended! Automatically terminates foreground services.
 */
class RealCallStateReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "RealCallStateReceiver"
        private var lastState = TelephonyManager.CALL_STATE_IDLE
        private var isCallActive = false
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != TelephonyManager.ACTION_PHONE_STATE_CHANGED) return

        val stateStr = intent.getStringExtra(TelephonyManager.EXTRA_STATE) ?: return
        val incomingNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER) ?: "Unknown"

        Log.i(TAG, "Telephony State Changed: \$stateStr for number: \$incomingNumber")

        when (stateStr) {
            TelephonyManager.EXTRA_STATE_RINGING -> {
                Log.d(TAG, "Real call is ringing: \$incomingNumber")
            }

            TelephonyManager.EXTRA_STATE_OFFHOOK -> {
                // Call answered or outgoing call established!
                if (!isCallActive) {
                    isCallActive = true
                    Log.i(TAG, "Real call ACTIVE! Starting CallTranslationService & Floating Overlay.")
                    startTranslationForActiveCall(context, incomingNumber)
                }
            }

            TelephonyManager.EXTRA_STATE_IDLE -> {
                // Call disconnected
                if (isCallActive) {
                    isCallActive = false
                    Log.i(TAG, "Real call ENDED. Stopping translation services.")
                    stopTranslationServices(context)
                }
            }
        }
    }

    private fun startTranslationForActiveCall(context: Context, phoneNumber: String) {
        // 1. Start Android 14 Foreground Audio Service
        val serviceIntent = Intent(context, CallTranslationService::class.java).apply {
            action = CallTranslationService.ACTION_START_CALL
            putExtra(CallTranslationService.EXTRA_PHONE_NUMBER, phoneNumber)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent)
        } else {
            context.startService(serviceIntent)
        }

        // 2. Start Floating Subtitles Overlay over the Phone Dialer
        val overlayIntent = Intent(context, FloatingCallOverlayService::class.java).apply {
            action = FloatingCallOverlayService.ACTION_SHOW_OVERLAY
            putExtra(FloatingCallOverlayService.EXTRA_CALL_NUMBER, phoneNumber)
        }
        context.startService(overlayIntent)
    }

    private fun stopTranslationServices(context: Context) {
        val serviceIntent = Intent(context, CallTranslationService::class.java).apply {
            action = CallTranslationService.ACTION_STOP_CALL
        }
        context.startService(serviceIntent)

        val overlayIntent = Intent(context, FloatingCallOverlayService::class.java).apply {
            action = FloatingCallOverlayService.ACTION_HIDE_OVERLAY
        }
        context.startService(overlayIntent)
    }
}`
  },
  {
    path: 'app/src/main/java/com/voicecall/translation/telephony/CallTelephonyManager.kt',
    name: 'CallTelephonyManager.kt',
    category: 'Kotlin',
    language: 'kotlin',
    content: `package com.voicecall.translation.telephony

import android.content.Context
import android.media.AudioManager
import android.os.Build
import android.telephony.PhoneStateListener
import android.telephony.TelephonyCallback
import android.telephony.TelephonyManager
import android.util.Log
import androidx.annotation.RequiresApi
import java.util.concurrent.Executor

/**
 * CallTelephonyManager:
 * Modern Android 12+ (API 31+) TelephonyCallback and legacy PhoneStateListener wrapper.
 * Manages telephony state queries and Audio routing (MODE_IN_COMMUNICATION).
 */
class CallTelephonyManager(
    private val context: Context,
    private val onCallStateChanged: (isActive: Boolean, stateName: String) -> Unit
) {
    companion object {
        private const val TAG = "CallTelephonyManager"
    }

    private val telephonyManager = context.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
    private val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager

    private var telephonyCallback: Any? = null
    private var legacyListener: PhoneStateListener? = null

    fun registerListener(executor: Executor) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            registerModernCallback(executor)
        } else {
            registerLegacyListener()
        }
    }

    @RequiresApi(Build.VERSION_CODES.S)
    private fun registerModernCallback(executor: Executor) {
        val callback = object : TelephonyCallback(), TelephonyCallback.CallStateListener {
            override fun onCallStateChanged(state: Int) {
                handleState(state)
            }
        }
        telephonyManager.registerTelephonyCallback(executor, callback)
        telephonyCallback = callback
        Log.i(TAG, "Registered modern TelephonyCallback (API 31+)")
    }

    @Suppress("DEPRECATION")
    private fun registerLegacyListener() {
        val listener = object : PhoneStateListener() {
            override fun onCallStateChanged(state: Int, phoneNumber: String?) {
                handleState(state)
            }
        }
        telephonyManager.listen(listener, PhoneStateListener.LISTEN_CALL_STATE)
        legacyListener = listener
        Log.i(TAG, "Registered legacy PhoneStateListener")
    }

    private fun handleState(state: Int) {
        when (state) {
            TelephonyManager.CALL_STATE_IDLE -> {
                Log.d(TAG, "Telephony State: IDLE")
                onCallStateChanged(false, "IDLE")
            }
            TelephonyManager.CALL_STATE_RINGING -> {
                Log.d(TAG, "Telephony State: RINGING")
                onCallStateChanged(false, "RINGING")
            }
            TelephonyManager.CALL_STATE_OFFHOOK -> {
                Log.i(TAG, "Telephony State: OFFHOOK (ACTIVE CALL)")
                // Configure audio mode for two-way VoIP / communication
                audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
                onCallStateChanged(true, "ACTIVE_CALL")
            }
        }
    }

    fun unregisterListener() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            (telephonyCallback as? TelephonyCallback)?.let {
                telephonyManager.unregisterTelephonyCallback(it)
            }
            telephonyCallback = null
        } else {
            @Suppress("DEPRECATION")
            legacyListener?.let {
                telephonyManager.listen(it, PhoneStateListener.LISTEN_NONE)
            }
            legacyListener = null
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/voicecall/translation/telecom/InCallServiceImpl.kt',
    name: 'InCallServiceImpl.kt',
    category: 'Kotlin',
    language: 'kotlin',
    content: `package com.voicecall.translation.telecom

import android.content.Intent
import android.telecom.Call
import android.telecom.CallAudioState
import android.telecom.InCallService
import android.util.Log
import com.voicecall.translation.overlay.FloatingCallOverlayService
import com.voicecall.translation.service.CallTranslationService

/**
 * InCallServiceImpl:
 * Production Android Telecom InCallService.
 * When designated as Default Phone or Companion Calling App, this service receives official Call
 * objects and provides low-level control over call audio routing (Speaker, Bluetooth, Earpiece).
 */
class InCallServiceImpl : InCallService() {

    companion object {
        private const val TAG = "InCallServiceImpl"
        var activeCall: Call? = null
            private set
    }

    private val callCallback = object : Call.Callback() {
        override fun onStateChanged(call: Call, state: Int) {
            super.onStateChanged(call, state)
            Log.d(TAG, "Call State Changed: \$state")

            when (state) {
                Call.STATE_ACTIVE -> {
                    Log.i(TAG, "Telecom Call is now ACTIVE! Switching to speakerphone for acoustic translation.")
                    // Ensure speakerphone is active so both parties can be captured & translated
                    setAudioRoute(CallAudioState.ROUTE_SPEAKER)
                    startForegroundTranslation()
                }
                Call.STATE_DISCONNECTED -> {
                    Log.i(TAG, "Telecom Call disconnected.")
                    stopForegroundTranslation()
                }
            }
        }
    }

    override fun onCallAdded(call: Call) {
        super.onCallAdded(call)
        Log.i(TAG, "onCallAdded: New phone call detected by Telecom framework.")
        activeCall = call
        call.registerCallback(callCallback)

        if (call.state == Call.STATE_ACTIVE) {
            setAudioRoute(CallAudioState.ROUTE_SPEAKER)
            startForegroundTranslation()
        }
    }

    override fun onCallRemoved(call: Call) {
        super.onCallRemoved(call)
        Log.i(TAG, "onCallRemoved: Call ended.")
        call.unregisterCallback(callCallback)
        if (activeCall == call) {
            activeCall = null
        }
        stopForegroundTranslation()
    }

    private fun startForegroundTranslation() {
        val serviceIntent = Intent(this, CallTranslationService::class.java).apply {
            action = CallTranslationService.ACTION_START_CALL
        }
        startForegroundService(serviceIntent)

        val overlayIntent = Intent(this, FloatingCallOverlayService::class.java).apply {
            action = FloatingCallOverlayService.ACTION_SHOW_OVERLAY
        }
        startService(overlayIntent)
    }

    private fun stopForegroundTranslation() {
        val serviceIntent = Intent(this, CallTranslationService::class.java).apply {
            action = CallTranslationService.ACTION_STOP_CALL
        }
        startService(serviceIntent)

        val overlayIntent = Intent(this, FloatingCallOverlayService::class.java).apply {
            action = FloatingCallOverlayService.ACTION_HIDE_OVERLAY
        }
        startService(overlayIntent)
    }
}`
  },
  {
    path: 'app/src/main/java/com/voicecall/translation/overlay/FloatingCallOverlayService.kt',
    name: 'FloatingCallOverlayService.kt',
    category: 'Kotlin',
    language: 'kotlin',
    content: `package com.voicecall.translation.overlay

import android.annotation.SuppressLint
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.TextView
import com.voicecall.translation.service.CallTranslationService

/**
 * FloatingCallOverlayService:
 * Creates a floating heads-up display (SYSTEM_ALERT_WINDOW) that appears on top of
 * the real phone dialer during active cellular calls.
 * Displays:
 * - Live translated subtitles of the current conversation in real-time.
 * - Quick action buttons: Mute, Swap Language, Quick Spoken Response.
 * - Drag-and-drop movable overlay pill.
 */
class FloatingCallOverlayService : Service() {

    companion object {
        const val ACTION_SHOW_OVERLAY = "com.voicecall.translation.SHOW_OVERLAY"
        const val ACTION_HIDE_OVERLAY = "com.voicecall.translation.HIDE_OVERLAY"
        const val ACTION_UPDATE_SUBTITLE = "com.voicecall.translation.UPDATE_SUBTITLE"

        const val EXTRA_CALL_NUMBER = "extra_call_number"
        const val EXTRA_ORIGINAL_TEXT = "extra_original_text"
        const val EXTRA_TRANSLATED_TEXT = "extra_translated_text"
        const val EXTRA_SPEAKER_LABEL = "extra_speaker_label"
    }

    private var windowManager: WindowManager? = null
    private var overlayView: View? = null
    private var params: WindowManager.LayoutParams? = null

    private var tvSubtitle: TextView? = null
    private var tvSpeaker: TextView? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_SHOW_OVERLAY -> {
                val callNum = intent.getStringExtra(EXTRA_CALL_NUMBER) ?: "Live Call"
                showOverlay(callNum)
            }
            ACTION_HIDE_OVERLAY -> {
                hideOverlay()
                stopSelf()
            }
            ACTION_UPDATE_SUBTITLE -> {
                val speaker = intent.getStringExtra(EXTRA_SPEAKER_LABEL) ?: "Remote Party"
                val original = intent.getStringExtra(EXTRA_ORIGINAL_TEXT) ?: ""
                val translated = intent.getStringExtra(EXTRA_TRANSLATED_TEXT) ?: ""
                updateSubtitles(speaker, original, translated)
            }
        }
        return START_NOT_STICKY
    }

    @SuppressLint("ClickableViewAccessibility")
    private fun showOverlay(callNumber: String) {
        if (overlayView != null) return

        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager

        val layoutFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            layoutFlag,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                    WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 40
            y = 180
        }

        // Programmatically build overlay pill container
        val root = FrameLayout(this).apply {
            setBackgroundColor(0xE6121212.toInt())
            setPadding(28, 20, 28, 20)
        }

        val container = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
        }

        val headerRow = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }

        val statusDot = View(this).apply {
            setBackgroundColor(0xFF22C55E.toInt()) // Green
            layoutParams = android.widget.LinearLayout.LayoutParams(16, 16).apply {
                rightMargin = 12
            }
        }

        val title = TextView(this).apply {
            text = "Live Call Translator • \$callNumber"
            setTextColor(0xFFE5E5E5.toInt())
            textSize = 12f
            typeface = android.graphics.Typeface.DEFAULT_BOLD
        }

        headerRow.addView(statusDot)
        headerRow.addView(title)
        container.addView(headerRow)

        tvSpeaker = TextView(this).apply {
            text = "Listening for speech..."
            setTextColor(0xFF9CA3AF.toInt())
            textSize = 11f
            setPadding(0, 8, 0, 4)
        }
        container.addView(tvSpeaker)

        tvSubtitle = TextView(this).apply {
            text = "Translated subtitles will appear here in real-time."
            setTextColor(0xFFFFFFFF.toInt())
            textSize = 14f
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            maxWidth = 650
        }
        container.addView(tvSubtitle)

        root.addView(container)
        overlayView = root

        // Enable dragging of overlay window
        var initialX = 0
        var initialY = 0
        var initialTouchX = 0f
        var initialTouchY = 0f

        root.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = params?.x ?: 0
                    initialY = params?.y ?: 0
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    params?.x = initialX + (event.rawX - initialTouchX).toInt()
                    params?.y = initialY + (event.rawY - initialTouchY).toInt()
                    windowManager?.updateViewLayout(overlayView, params)
                    true
                }
                else -> false
            }
        }

        try {
            windowManager?.addView(overlayView, params)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun updateSubtitles(speaker: String, original: String, translated: String) {
        tvSpeaker?.text = speaker
        tvSubtitle?.text = translated.ifEmpty { original }
    }

    private fun hideOverlay() {
        if (overlayView != null) {
            windowManager?.removeView(overlayView)
            overlayView = null
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        hideOverlay()
    }
}`
  },
  {
    path: 'app/src/main/java/com/voicecall/translation/audio/AudioHardwareEngine.kt',
    name: 'AudioHardwareEngine.kt',
    category: 'Kotlin',
    language: 'kotlin',
    content: `package com.voicecall.translation.audio

import android.annotation.SuppressLint
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.AudioTrack
import android.media.MediaRecorder
import android.media.audiofx.AcousticEchoCanceler
import android.media.audiofx.AutomaticGainControl
import android.media.audiofx.NoiseSuppressor
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.nio.ByteBuffer
import java.nio.ByteOrder
import kotlin.math.log10
import kotlin.math.max
import kotlin.math.sqrt

/**
 * Production-ready low-latency audio capture and playback engine for Android 14+.
 * 
 * Android Cellular Architecture Note:
 * Standard 3rd-party Android apps cannot tap raw cellular baseband audio streams due to
 * Android SELinux security boundaries (CAPTURE_AUDIO_OUTPUT requires OEM system signatures).
 * 
 * Production Solution:
 * 1. AudioRecord: Uses VOICE_COMMUNICATION (or cascade to VOICE_RECOGNITION / MIC) with
 *    hardware AcousticEchoCanceler (AEC), NoiseSuppressor, and AGC.
 * 2. Operating with device speakerphone or Bluetooth headset allows simultaneous capture of
 *    both local user speech and acoustic phone audio without feedback.
 * 3. AudioTrack: Streams translated TTS audio directly back through the communication channel.
 */
class AudioHardwareEngine(
    private val scope: CoroutineScope,
    private val onVadStateChanged: (isVoiceActive: Boolean, decibels: Double) -> Unit
) {
    companion object {
        private const val TAG = "AudioHardwareEngine"
        const val SAMPLE_RATE = 16000 // 16kHz voice standard
        const val CHANNEL_IN = AudioFormat.CHANNEL_IN_MONO
        const val CHANNEL_OUT = AudioFormat.CHANNEL_OUT_MONO
        const val ENCODING = AudioFormat.ENCODING_PCM_16BIT

        // 16000 samples/sec * 2 bytes/sample * 0.1s (100ms) = 3200 bytes per frame
        const val FRAME_SIZE_BYTES = 3200
        const val FRAME_SIZE_SHORTS = FRAME_SIZE_BYTES / 2

        // Voice Activity Detection Threshold (~30 dB relative floor)
        const val VAD_THRESHOLD_DB = 30.0
    }

    private var audioRecord: AudioRecord? = null
    private var audioTrack: AudioTrack? = null

    // Hardware Audio Effects
    private var echoCanceler: AcousticEchoCanceler? = null
    private var noiseSuppressor: NoiseSuppressor? = null
    private var gainControl: AutomaticGainControl? = null

    private var recordingJob: Job? = null
    private var playbackJob: Job? = null

    // Channel for incoming downstream TTS audio ready to play into call
    val downstreamPlaybackChannel = Channel<ByteArray>(capacity = Channel.UNLIMITED)

    // Channel for upstream microphone audio chunks (gated by VAD)
    val upstreamAudioChannel = Channel<ByteArray>(capacity = Channel.BUFFERED)

    @SuppressLint("MissingPermission")
    fun startCaptureAndPlayback() {
        stop()

        val minRecordBufSize = AudioRecord.getMinBufferSize(SAMPLE_RATE, CHANNEL_IN, ENCODING)
        val recordBufferSize = max(minRecordBufSize, FRAME_SIZE_BYTES * 4)

        // Audio Source Cascade: VOICE_COMMUNICATION -> VOICE_RECOGNITION -> MIC
        val sourcesToTry = listOf(
            MediaRecorder.AudioSource.VOICE_COMMUNICATION,
            MediaRecorder.AudioSource.VOICE_RECOGNITION,
            MediaRecorder.AudioSource.MIC
        )

        for (source in sourcesToTry) {
            try {
                val record = AudioRecord(
                    source,
                    SAMPLE_RATE,
                    CHANNEL_IN,
                    ENCODING,
                    recordBufferSize
                )

                if (record.state == AudioRecord.STATE_INITIALIZED) {
                    audioRecord = record
                    Log.i(TAG, "AudioRecord successfully initialized with source: \$source")
                    break
                } else {
                    record.release()
                }
            } catch (e: Exception) {
                Log.w(TAG, "AudioRecord init failed for source \$source: \${e.message}")
            }
        }

        val recordInstance = audioRecord ?: run {
            Log.e(TAG, "All AudioRecord sources failed initialization!")
            return
        }

        // Initialize Hardware Echo Cancellation and Noise Suppression
        val sessionId = recordInstance.audioSessionId
        if (AcousticEchoCanceler.isAvailable()) {
            echoCanceler = AcousticEchoCanceler.create(sessionId)?.apply {
                enabled = true
                Log.i(TAG, "Hardware AcousticEchoCanceler enabled on session: \$sessionId")
            }
        }
        if (NoiseSuppressor.isAvailable()) {
            noiseSuppressor = NoiseSuppressor.create(sessionId)?.apply {
                enabled = true
                Log.i(TAG, "Hardware NoiseSuppressor enabled on session: \$sessionId")
            }
        }
        if (AutomaticGainControl.isAvailable()) {
            gainControl = AutomaticGainControl.create(sessionId)?.apply {
                enabled = true
                Log.i(TAG, "Hardware AutomaticGainControl enabled on session: \$sessionId")
            }
        }

        recordInstance.startRecording()

        // Initialize AudioTrack for low-latency Speech Playback
        val minTrackBufSize = AudioTrack.getMinBufferSize(SAMPLE_RATE, CHANNEL_OUT, ENCODING)
        val trackBufferSize = max(minTrackBufSize, FRAME_SIZE_BYTES * 4)

        val audioAttributes = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
            .build()

        val audioFormat = AudioFormat.Builder()
            .setSampleRate(SAMPLE_RATE)
            .setEncoding(ENCODING)
            .setChannelMask(CHANNEL_OUT)
            .build()

        audioTrack = AudioTrack(
            audioAttributes,
            audioFormat,
            trackBufferSize,
            AudioTrack.MODE_STREAM,
            android.media.AudioManager.AUDIO_SESSION_ID_GENERATE
        ).apply {
            if (state == AudioTrack.STATE_INITIALIZED) {
                play()
            }
        }

        // Recording Loop on Dispatchers.Default
        recordingJob = scope.launch(Dispatchers.Default) {
            val byteBuffer = ByteArray(FRAME_SIZE_BYTES)
            val shortArray = ShortArray(FRAME_SIZE_SHORTS)

            while (isActive && audioRecord?.recordingState == AudioRecord.RECORDSTATE_RECORDING) {
                val bytesRead = audioRecord?.read(byteBuffer, 0, FRAME_SIZE_BYTES) ?: -1

                if (bytesRead == FRAME_SIZE_BYTES) {
                    ByteBuffer.wrap(byteBuffer)
                        .order(ByteOrder.LITTLE_ENDIAN)
                        .asShortBuffer()
                        .get(shortArray)

                    val decibels = calculateDecibels(shortArray)
                    val isVoiceActive = decibels >= VAD_THRESHOLD_DB

                    onVadStateChanged(isVoiceActive, decibels)

                    if (isVoiceActive) {
                        upstreamAudioChannel.send(byteBuffer.copyOf())
                    }
                }
            }
        }

        // Playback Loop to pipe incoming TTS bytes directly to AudioTrack
        playbackJob = scope.launch(Dispatchers.Default) {
            for (chunk in downstreamPlaybackChannel) {
                if (!isActive || audioTrack == null) break
                var offset = 0
                while (offset < chunk.size) {
                    val written = audioTrack?.write(chunk, offset, chunk.size - offset) ?: -1
                    if (written > 0) {
                        offset += written
                    } else {
                        break
                    }
                }
            }
        }

        Log.i(TAG, "Audio Hardware Engine fully started.")
    }

    private fun calculateDecibels(samples: ShortArray): Double {
        var sumSquares = 0.0
        for (sample in samples) {
            val normalized = sample.toDouble()
            sumSquares += normalized * normalized
        }
        val rms = sqrt(sumSquares / samples.size)
        return if (rms > 0.0) {
            20 * log10(rms.coerceAtLeast(1.0) / Short.MAX_VALUE) + 90.0
        } else {
            0.0
        }
    }

    fun stop() {
        recordingJob?.cancel()
        recordingJob = null

        playbackJob?.cancel()
        playbackJob = null

        try {
            echoCanceler?.release()
            echoCanceler = null
            noiseSuppressor?.release()
            noiseSuppressor = null
            gainControl?.release()
            gainControl = null

            audioRecord?.apply {
                if (recordingState == AudioRecord.RECORDSTATE_RECORDING) stop()
                release()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping AudioRecord", e)
        } finally {
            audioRecord = null
        }

        try {
            audioTrack?.apply {
                if (playState == AudioTrack.PLAYSTATE_PLAYING) stop()
                flush()
                release()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping AudioTrack", e)
        } finally {
            audioTrack = null
        }

        Log.i(TAG, "Audio Hardware Engine stopped.")
    }
}`
  },
  {
    path: 'app/src/main/java/com/voicecall/translation/service/CallTranslationService.kt',
    name: 'CallTranslationService.kt',
    category: 'Kotlin',
    language: 'kotlin',
    content: `package com.voicecall.translation.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Binder
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.voicecall.translation.audio.AudioHardwareEngine
import com.voicecall.translation.model.CallServiceState
import com.voicecall.translation.model.SpeakerRole
import com.voicecall.translation.model.TranscriptMessage
import com.voicecall.translation.network.TranslationWebSocketClient
import com.voicecall.translation.overlay.FloatingCallOverlayService
import com.voicecall.translation.ui.MainActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * Android 14 Production Foreground Service for Voice & Call Translation.
 * Handles:
 * - FOREGROUND_SERVICE_TYPE_MICROPHONE
 * - FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
 * - Dynamic notification channel with persistent status & actions.
 * - Broadcasts transcript updates to the FloatingCallOverlayService.
 */
class CallTranslationService : Service() {

    companion object {
        private const val TAG = "CallTranslationService"
        const val CHANNEL_ID = "call_translation_channel"
        const val NOTIFICATION_ID = 2026

        const val ACTION_START_CALL = "com.voicecall.translation.START_CALL"
        const val ACTION_STOP_CALL = "com.voicecall.translation.STOP_CALL"
        const val ACTION_MUTE_MIC = "com.voicecall.translation.MUTE_MIC"
        const val ACTION_SWAP_LANG = "com.voicecall.translation.SWAP_LANG"

        const val EXTRA_SOURCE_LANG = "extra_source_lang"
        const val EXTRA_TARGET_LANG = "extra_target_lang"
        const val EXTRA_PHONE_NUMBER = "extra_phone_number"
    }

    inner class LocalBinder : Binder() {
        fun getService(): CallTranslationService = this@CallTranslationService
    }

    private val binder = LocalBinder()
    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    private var audioHardwareEngine: AudioHardwareEngine? = null
    private var webSocketClient: TranslationWebSocketClient? = null

    private val _serviceState = MutableStateFlow<CallServiceState>(CallServiceState.Idle)
    val serviceState = _serviceState.asStateFlow()

    private val _transcriptsFlow = MutableSharedFlow<TranscriptMessage>(replay = 50)
    val transcriptsFlow = _transcriptsFlow.asSharedFlow()

    private val _vadDecibelsFlow = MutableStateFlow(0.0)
    val vadDecibelsFlow = _vadDecibelsFlow.asStateFlow()

    private val _isVoiceActiveFlow = MutableStateFlow(false)
    val isVoiceActiveFlow = _isVoiceActiveFlow.asStateFlow()

    private var currentSourceLang = "en-US"
    private var currentTargetLang = "es-ES"
    private var isMuted = false

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onBind(intent: Intent?): IBinder = binder

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START_CALL -> {
                val source = intent.getStringExtra(EXTRA_SOURCE_LANG) ?: currentSourceLang
                val target = intent.getStringExtra(EXTRA_TARGET_LANG) ?: currentTargetLang
                startTranslationPipeline(source, target)
            }
            ACTION_STOP_CALL -> {
                stopTranslationPipeline()
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            }
            ACTION_MUTE_MIC -> {
                isMuted = !isMuted
                updateNotification("Active Call (Muted: \$isMuted)")
            }
            ACTION_SWAP_LANG -> {
                val temp = currentSourceLang
                currentSourceLang = currentTargetLang
                currentTargetLang = temp
                updateNotification("Translating \$currentSourceLang ↔ \$currentTargetLang")
            }
        }
        return START_NOT_STICKY
    }

    private fun startTranslationPipeline(sourceLang: String, targetLang: String) {
        currentSourceLang = sourceLang
        currentTargetLang = targetLang

        // 1. Promote to Foreground Service with Android 14 dual types
        val notification = buildNotification("Translating live phone call: \$sourceLang ↔ \$targetLang")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val fgsTypes = ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE or
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
            startForeground(NOTIFICATION_ID, notification, fgsTypes)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }

        _serviceState.value = CallServiceState.Connecting

        // 2. Initialize AudioHardwareEngine
        audioHardwareEngine = AudioHardwareEngine(
            scope = serviceScope,
            onVadStateChanged = { isVoiceActive, decibels ->
                if (!isMuted) {
                    _isVoiceActiveFlow.value = isVoiceActive
                    _vadDecibelsFlow.value = decibels
                }
            }
        )

        // 3. Initialize WebSocket Network Client
        webSocketClient = TranslationWebSocketClient(
            scope = serviceScope,
            onTranscriptReceived = { transcript ->
                serviceScope.launch {
                    _transcriptsFlow.emit(transcript)

                    // Dispatch to Floating Overlay
                    val overlayIntent = Intent(this@CallTranslationService, FloatingCallOverlayService::class.java).apply {
                        action = FloatingCallOverlayService.ACTION_UPDATE_SUBTITLE
                        putExtra(FloatingCallOverlayService.EXTRA_SPEAKER_LABEL,
                            if (transcript.speaker == SpeakerRole.LOCAL_USER) "You" else "Remote Party")
                        putExtra(FloatingCallOverlayService.EXTRA_ORIGINAL_TEXT, transcript.originalText)
                        putExtra(FloatingCallOverlayService.EXTRA_TRANSLATED_TEXT, transcript.translatedText)
                    }
                    startService(overlayIntent)
                }
            },
            onIncomingAudioChunk = { pcmChunk ->
                audioHardwareEngine?.downstreamPlaybackChannel?.send(pcmChunk)
            },
            onConnectionStatusChanged = { connected ->
                _serviceState.value = if (connected) {
                    CallServiceState.Active(currentSourceLang, currentTargetLang)
                } else {
                    CallServiceState.Connecting
                }
            }
        )

        // 4. Start Hardware & Network Loop
        audioHardwareEngine?.startCaptureAndPlayback()
        webSocketClient?.connect(
            sourceLanguage = currentSourceLang,
            targetLanguage = currentTargetLang,
            audioChannel = audioHardwareEngine?.upstreamAudioChannel
        )

        Log.i(TAG, "Call translation pipeline fully initiated.")
    }

    private fun stopTranslationPipeline() {
        audioHardwareEngine?.stop()
        audioHardwareEngine = null

        webSocketClient?.disconnect()
        webSocketClient = null

        _serviceState.value = CallServiceState.Idle
        _isVoiceActiveFlow.value = false
        _vadDecibelsFlow.value = 0.0
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Real-Time Call Translation",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Live audio capture & speech translation during active phone calls"
                setSound(null, null)
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(contentText: String): Notification {
        val launchIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingLaunch = PendingIntent.getActivity(
            this, 0, launchIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val stopIntent = Intent(this, CallTranslationService::class.java).apply {
            action = ACTION_STOP_CALL
        }
        val pendingStop = PendingIntent.getService(
            this, 1, stopIntent,
            PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Call Translation Active")
            .setContentText(contentText)
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setOngoing(true)
            .setContentIntent(pendingLaunch)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "End Translation", pendingStop)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun updateNotification(text: String) {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(NOTIFICATION_ID, buildNotification(text))
    }

    override fun onDestroy() {
        super.onDestroy()
        stopTranslationPipeline()
        serviceScope.cancel()
    }
}`
  },
  {
    path: 'app/src/main/java/com/voicecall/translation/network/TranslationWebSocketClient.kt',
    name: 'TranslationWebSocketClient.kt',
    category: 'Kotlin',
    language: 'kotlin',
    content: `package com.voicecall.translation.network

import android.util.Log
import com.voicecall.translation.model.HandshakeConfig
import com.voicecall.translation.model.TranscriptMessage
import io.ktor.client.HttpClient
import io.ktor.client.engine.cio.CIO
import io.ktor.client.plugins.websocket.WebSockets
import io.ktor.client.plugins.websocket.pingInterval
import io.ktor.client.plugins.websocket.webSocket
import io.ktor.http.HttpMethod
import io.ktor.websocket.Frame
import io.ktor.websocket.readBytes
import io.ktor.websocket.readText
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.channels.ClosedReceiveChannelException
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import kotlin.math.min
import kotlin.math.pow
import kotlin.time.Duration.Companion.seconds

/**
 * Resilient Ktor CIO WebSocket client.
 * - Streams 3200-byte binary audio chunks upstream.
 * - Pipes downstream binary TTS frames directly to AudioTrack.
 * - Deserializes JSON transcript events and delivers them to the service.
 * - Automatically reconnects with exponential backoff on network dropouts.
 */
class TranslationWebSocketClient(
    private val scope: CoroutineScope,
    private val serverHost: String = "wss://api.voicecall-translator.com/v1/stream",
    private val onTranscriptReceived: (TranscriptMessage) -> Unit,
    private val onIncomingAudioChunk: suspend (ByteArray) -> Unit,
    private val onConnectionStatusChanged: (Boolean) -> Unit
) {
    companion object {
        private const val TAG = "TranslationWSClient"
        private const val BASE_BACKOFF_MS = 1000L
        private const val MAX_BACKOFF_MS = 16000L
    }

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
    }

    private val client = HttpClient(CIO) {
        install(WebSockets) {
            pingInterval = 15.seconds
        }
    }

    private var connectionJob: Job? = null
    private var isExplicitlyStopped = false

    fun connect(
        sourceLanguage: String,
        targetLanguage: String,
        audioChannel: Channel<ByteArray>?
    ) {
        isExplicitlyStopped = false
        connectionJob?.cancel()

        connectionJob = scope.launch(Dispatchers.IO) {
            var attempt = 0

            while (isActive && !isExplicitlyStopped) {
                try {
                    Log.i(TAG, "Attempting WebSocket connection to \$serverHost (Attempt: \$attempt)")
                    onConnectionStatusChanged(false)

                    client.webSocket(
                        method = HttpMethod.Get,
                        host = "api.voicecall-translator.com",
                        port = 443,
                        path = "/v1/stream"
                    ) {
                        Log.i(TAG, "WebSocket connection established!")
                        attempt = 0
                        onConnectionStatusChanged(true)

                        // 1. Send Handshake Configuration
                        val configPayload = json.encodeToString(
                            HandshakeConfig.serializer(),
                            HandshakeConfig(
                                sourceLanguage = sourceLanguage,
                                targetLanguage = targetLanguage
                            )
                        )
                        send(Frame.Text(configPayload))

                        // 2. Launch Upstream Audio Sender Coroutine
                        val upstreamJob = launch {
                            if (audioChannel != null) {
                                for (frame in audioChannel) {
                                    if (!isActive) break
                                    send(Frame.Binary(fin = true, data = frame))
                                }
                            }
                        }

                        // 3. Read Incoming Downstream Messages
                        try {
                            for (frame in incoming) {
                                when (frame) {
                                    is Frame.Text -> {
                                        val text = frame.readText()
                                        try {
                                            val transcript = json.decodeFromString<TranscriptMessage>(text)
                                            onTranscriptReceived(transcript)
                                        } catch (e: Exception) {
                                            Log.w(TAG, "Failed to parse transcript: \$text", e)
                                        }
                                    }
                                    is Frame.Binary -> {
                                        val audioBytes = frame.readBytes()
                                        onIncomingAudioChunk(audioBytes)
                                    }
                                    else -> Unit
                                }
                            }
                        } finally {
                            upstreamJob.cancel()
                        }
                    }
                } catch (e: CancellationException) {
                    throw e
                } catch (e: ClosedReceiveChannelException) {
                    Log.w(TAG, "WebSocket channel closed gracefully")
                } catch (e: Exception) {
                    Log.e(TAG, "WebSocket exception: \${e.message}")
                }

                onConnectionStatusChanged(false)

                if (!isExplicitlyStopped && isActive) {
                    attempt++
                    val backoff = min(BASE_BACKOFF_MS * 2.0.pow(attempt.toDouble()).toLong(), MAX_BACKOFF_MS)
                    Log.d(TAG, "Retrying WebSocket in \${backoff}ms...")
                    delay(backoff)
                }
            }
        }
    }

    fun disconnect() {
        isExplicitlyStopped = true
        connectionJob?.cancel()
        connectionJob = null
        onConnectionStatusChanged(false)
    }
}`
  },
  {
    path: 'app/src/main/java/com/voicecall/translation/model/TranslationModels.kt',
    name: 'TranslationModels.kt',
    category: 'Kotlin',
    language: 'kotlin',
    content: `package com.voicecall.translation.model

import kotlinx.serialization.Serializable

@Serializable
enum class SpeakerRole {
    LOCAL_USER,
    REMOTE_PARTY,
    SYSTEM
}

@Serializable
data class TranscriptMessage(
    val id: String = java.util.UUID.randomUUID().toString(),
    val speaker: SpeakerRole,
    val originalText: String,
    val translatedText: String,
    val sourceLang: String,
    val targetLang: String,
    val timestamp: Long = System.currentTimeMillis()
)

@Serializable
data class HandshakeConfig(
    val type: String = "config",
    val sourceLanguage: String,
    val targetLanguage: String,
    val sampleRate: Int = 16000,
    val channels: Int = 1,
    val pcmBitDepth: Int = 16
)

data class SupportedLanguage(
    val code: String,
    val displayName: String,
    val flagEmoji: String
) {
    companion object {
        val ALL = listOf(
            SupportedLanguage("en-US", "English (US)", "🇺🇸"),
            SupportedLanguage("am-ET", "Amharic (Ethiopia)", "🇪🇹"),
            SupportedLanguage("ti-ET", "Tigrinya (Ethiopia)", "🇪🇷"),
            SupportedLanguage("om-ET", "Oromo (Ethiopia)", "🇪🇹"),
            SupportedLanguage("es-ES", "Spanish (Spain)", "🇪🇸"),
            SupportedLanguage("fr-FR", "French (France)", "🇫🇷"),
            SupportedLanguage("de-DE", "German (Germany)", "🇩🇪"),
            SupportedLanguage("ja-JP", "Japanese", "🇯🇵"),
            SupportedLanguage("zh-CN", "Mandarin (Chinese)", "🇨🇳"),
            SupportedLanguage("ar-SA", "Arabic (Saudi)", "🇸🇦"),
            SupportedLanguage("pt-BR", "Portuguese (Brazil)", "🇧🇷")
        )
    }
}

sealed interface CallServiceState {
    data object Idle : CallServiceState
    data object Connecting : CallServiceState
    data class Active(val sourceLang: String, val targetLang: String) : CallServiceState
    data class Error(val message: String) : CallServiceState
}`
  },
  {
    path: 'app/src/main/java/com/voicecall/translation/ui/MainActivity.kt',
    name: 'MainActivity.kt',
    category: 'Kotlin',
    language: 'kotlin',
    content: `package com.voicecall.translation.ui

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.voicecall.translation.model.*
import java.text.SimpleDateFormat
import java.util.*

class MainActivity : ComponentActivity() {

    private val viewModel: TranslationViewModel by viewModels()

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { _ ->
        // Permissions updated
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        requestRequiredPermissions()

        setContent {
            MaterialTheme(
                colorScheme = darkColorScheme(
                    primary = Color(0xFF6366F1),
                    secondary = Color(0xFF22C55E),
                    background = Color(0xFF0F172A),
                    surface = Color(0xFF1E293B)
                )
            ) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    TranslationMainScreen(
                        viewModel = viewModel,
                        onRequestOverlayPermission = { requestOverlayPermission() }
                    )
                }
            }
        }
    }

    private fun requestRequiredPermissions() {
        val permissions = mutableListOf(
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.READ_PHONE_STATE
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            permissions.add(Manifest.permission.BLUETOOTH_CONNECT)
        }

        val needed = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (needed.isNotEmpty()) {
            permissionLauncher.launch(needed.toTypedArray())
        }
    }

    private fun requestOverlayPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:\$packageName")
            )
            startActivity(intent)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        viewModel.unbindService(this)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TranslationMainScreen(
    viewModel: TranslationViewModel,
    onRequestOverlayPermission: () -> Unit
) {
    val context = LocalContext.current
    val serviceState by viewModel.serviceState.collectAsState()
    val transcripts by viewModel.transcripts.collectAsState()
    val decibels by viewModel.vadDecibels.collectAsState()
    val isVoiceActive by viewModel.isVoiceActive.collectAsState()

    val sourceLang by viewModel.selectedSourceLanguage.collectAsState()
    val targetLang by viewModel.selectedTargetLanguage.collectAsState()

    val isCallActive = serviceState is CallServiceState.Active

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Real-Time Call Translator",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Android 14+ InCallService & Floating HUD",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                actions = {
                    IconButton(onClick = onRequestOverlayPermission) {
                        Icon(Icons.Default.Layers, contentDescription = "Overlay Permission")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Language Selection Card
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                shape = RoundedCornerShape(16.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("You Speak", style = MaterialTheme.typography.labelSmall)
                        Text(
                            "\${sourceLang.flagEmoji} \${sourceLang.displayName}",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold
                        )
                    }

                    IconButton(
                        onClick = { viewModel.swapLanguages() },
                        enabled = !isCallActive
                    ) {
                        Icon(Icons.Default.SwapHoriz, contentDescription = "Swap Languages")
                    }

                    Column(modifier = Modifier.weight(1f), horizontalAlignment = Alignment.End) {
                        Text("Remote Speaks", style = MaterialTheme.typography.labelSmall)
                        Text(
                            "\${targetLang.flagEmoji} \${targetLang.displayName}",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }

            // Real-Time Audio Hardware Telemetry Card
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Microphone VAD Level", style = MaterialTheme.typography.labelMedium)
                        Text(
                            text = String.format("%.1f dB", decibels),
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = FontWeight.Bold,
                            color = if (isVoiceActive) Color(0xFF22C55E) else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    LinearProgressIndicator(
                        progress = { (decibels.toFloat() / 90f).coerceIn(0f, 1f) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(8.dp)
                            .clip(RoundedCornerShape(4.dp)),
                        color = if (isVoiceActive) Color(0xFF22C55E) else MaterialTheme.colorScheme.primary,
                        trackColor = MaterialTheme.colorScheme.background
                    )
                }
            }

            // Live Call Control Button
            Button(
                onClick = {
                    if (isCallActive) {
                        viewModel.stopCall(context)
                    } else {
                        viewModel.startCall(context)
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (isCallActive) Color(0xFFEF4444) else MaterialTheme.colorScheme.primary
                )
            ) {
                Icon(
                    imageVector = if (isCallActive) Icons.Default.CallEnd else Icons.Default.PhoneInTalk,
                    contentDescription = null
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = if (isCallActive) "Stop Call Translation" else "Start Live Call Translation",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }

            // Live Scrolling Subtitles & Transcripts
            Text("Live Subtitles & Conversation Feed", style = MaterialTheme.typography.titleSmall)

            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                shape = RoundedCornerShape(16.dp)
            ) {
                if (transcripts.isEmpty()) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text(
                            "Waiting for speech on active phone call...",
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(transcripts) { msg ->
                            TranscriptBubble(msg)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun TranscriptBubble(msg: TranscriptMessage) {
    val isLocal = msg.speaker == SpeakerRole.LOCAL_USER
    val alignment = if (isLocal) Alignment.End else Alignment.Start
    val containerColor = if (isLocal) Color(0xFF312E81) else Color(0xFF1E3A8A)

    Column(modifier = Modifier.fillMaxWidth(), horizontalAlignment = alignment) {
        Text(
            text = if (isLocal) "You" else "Remote Party",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Card(
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = containerColor),
            modifier = Modifier.widthIn(max = 280.dp)
        ) {
            Column(modifier = Modifier.padding(10.dp)) {
                Text(
                    text = msg.translatedText,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                if (msg.originalText.isNotEmpty()) {
                    Text(
                        text = msg.originalText,
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFF94A3B8)
                    )
                }
            }
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/voicecall/translation/ui/TranslationViewModel.kt',
    name: 'TranslationViewModel.kt',
    category: 'Kotlin',
    language: 'kotlin',
    content: `package com.voicecall.translation.ui

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.IBinder
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.voicecall.translation.model.CallServiceState
import com.voicecall.translation.model.SupportedLanguage
import com.voicecall.translation.model.TranscriptMessage
import com.voicecall.translation.service.CallTranslationService
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class TranslationViewModel : ViewModel() {

    private var boundService: CallTranslationService? = null
    val isBound = MutableStateFlow(false)

    val serviceState = MutableStateFlow<CallServiceState>(CallServiceState.Idle)
    val transcripts = MutableStateFlow<List<TranscriptMessage>>(emptyList())
    val vadDecibels = MutableStateFlow(0.0)
    val isVoiceActive = MutableStateFlow(false)

    val selectedSourceLanguage = MutableStateFlow(SupportedLanguage.ALL[0])
    val selectedTargetLanguage = MutableStateFlow(SupportedLanguage.ALL[4]) // Spanish

    private val connection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
            val binder = service as CallTranslationService.LocalBinder
            val s = binder.getService()
            boundService = s
            isBound.value = true

            viewModelScope.launch {
                s.serviceState.collect { serviceState.value = it }
            }
            viewModelScope.launch {
                s.transcriptsFlow.collect { transcript ->
                    transcripts.value = transcripts.value + transcript
                }
            }
            viewModelScope.launch {
                s.vadDecibelsFlow.collect { vadDecibels.value = it }
            }
            viewModelScope.launch {
                s.isVoiceActiveFlow.collect { isVoiceActive.value = it }
            }
        }

        override fun onServiceDisconnected(name: ComponentName?) {
            boundService = null
            isBound.value = false
            serviceState.value = CallServiceState.Idle
        }
    }

    fun bindService(context: Context) {
        val intent = Intent(context, CallTranslationService::class.java)
        context.bindService(intent, connection, Context.BIND_AUTO_CREATE)
    }

    fun unbindService(context: Context) {
        if (isBound.value) {
            context.unbindService(connection)
            isBound.value = false
            boundService = null
        }
    }

    fun startCall(context: Context) {
        val intent = Intent(context, CallTranslationService::class.java).apply {
            action = CallTranslationService.ACTION_START_CALL
            putExtra(CallTranslationService.EXTRA_SOURCE_LANG, selectedSourceLanguage.value.code)
            putExtra(CallTranslationService.EXTRA_TARGET_LANG, selectedTargetLanguage.value.code)
        }
        context.startForegroundService(intent)
        bindService(context)
    }

    fun stopCall(context: Context) {
        val intent = Intent(context, CallTranslationService::class.java).apply {
            action = CallTranslationService.ACTION_STOP_CALL
        }
        context.startService(intent)
    }

    fun swapLanguages() {
        val temp = selectedSourceLanguage.value
        selectedSourceLanguage.value = selectedTargetLanguage.value
        selectedTargetLanguage.value = temp
    }

    fun clearTranscripts() {
        transcripts.value = emptyList()
    }
}`
  },
  {
    path: 'app/proguard-rules.pro',
    name: 'proguard-rules.pro',
    category: 'Config',
    language: 'pro',
    content: `# Keep Ktor CIO Coroutines and WebSockets
-keep class io.ktor.** { *; }
-dontwarn io.ktor.**

# KotlinX Serialization models
-keepattributes *Annotation*, InnerClasses
-keepclassmembers class * {
    @kotlinx.serialization.Serializable <fields>;
}
-keep class com.voicecall.translation.model.** { *; }

# Preserve AudioRecord and AudioTrack reflection calls
-keepclassmembers class android.media.AudioRecord { *; }
-keepclassmembers class android.media.AudioTrack { *; }`
  }
];
