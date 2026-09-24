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

    <!-- Audio Hardware & Networking Permissions -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />

    <!-- Android 13+ (API 33) Notification Permission -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <!-- Android 14 (API 34) Foreground Service Requirements -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />

    <application
        android:allowBackup="true"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="@xml/backup_rules"
        android:icon="@mipmap/ic_launcher"
        android:label="Voice &amp; Call Translator"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.Material3.DayNight.NoActionBar">

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

        <!-- Foreground Service Declaration with Dual Android 14 Types -->
        <service
            android:name=".service.CallTranslationService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="microphone|mediaPlayback" />

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

    // Ktor CIO Client for Low-Latency WebSockets
    implementation("io.ktor:ktor-client-core:$ktorVersion")
    implementation("io.ktor:ktor-client-cio:$ktorVersion")
    implementation("io.ktor:ktor-client-websockets:$ktorVersion")
    implementation("io.ktor:ktor-client-logging:$ktorVersion")

    // KotlinX Serialization JSON
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.1")
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
 * Production-ready low-latency audio capture and playback engine.
 * - AudioRecord: 16kHz, MONO, 16-bit PCM using VOICE_COMMUNICATION for hardware AEC/AGC.
 * - AudioTrack: USAGE_VOICE_COMMUNICATION, CONTENT_TYPE_SPEECH for clear earpiece routing.
 * - Voice Activity Detection: RMS dB evaluation gating silent frames below ~30dB.
 */
class AudioHardwareEngine(
    private val scope: CoroutineScope,
    private val onVadStateChanged: (isVoiceActive: Boolean, decibels: Double) -> Unit
) {
    companion object {
        private const val TAG = "AudioHardwareEngine"
        const val SAMPLE_RATE = 16000 // 16kHz voice sample rate
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

    private var recordingJob: Job? = null
    private var playbackJob: Job? = null

    // Channel for incoming downstream TTS audio ready to play
    val downstreamPlaybackChannel = Channel<ByteArray>(capacity = Channel.UNLIMITED)

    // Channel for upstream microphone audio chunks (gated by VAD)
    val upstreamAudioChannel = Channel<ByteArray>(capacity = Channel.BUFFERED)

    @SuppressLint("MissingPermission")
    fun startCaptureAndPlayback() {
        stop()

        // 1. Initialize AudioRecord with Hardware Echo Cancellation
        val minRecordBufSize = AudioRecord.getMinBufferSize(SAMPLE_RATE, CHANNEL_IN, ENCODING)
        val recordBufferSize = max(minRecordBufSize, FRAME_SIZE_BYTES * 4)

        audioRecord = AudioRecord(
            MediaRecorder.AudioSource.VOICE_COMMUNICATION, // Activates hardware AEC & AGC
            SAMPLE_RATE,
            CHANNEL_IN,
            ENCODING,
            recordBufferSize
        ).apply {
            if (state != AudioRecord.STATE_INITIALIZED) {
                Log.e(TAG, "AudioRecord initialization failed!")
                return
            }
            startRecording()
        }

        // 2. Initialize AudioTrack for low-latency Speech Playback
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
            if (state != AudioTrack.STATE_INITIALIZED) {
                Log.e(TAG, "AudioTrack initialization failed!")
                return
            }
            play()
        }

        // 3. Launch Record Loop on background Default Dispatcher
        recordingJob = scope.launch(Dispatchers.Default) {
            val byteBuffer = ByteArray(FRAME_SIZE_BYTES)
            val shortArray = ShortArray(FRAME_SIZE_SHORTS)

            while (isActive && audioRecord?.recordingState == AudioRecord.RECORDSTATE_RECORDING) {
                val bytesRead = audioRecord?.read(byteBuffer, 0, FRAME_SIZE_BYTES) ?: -1

                if (bytesRead == FRAME_SIZE_BYTES) {
                    // Convert raw PCM bytes to shorts for RMS evaluation
                    ByteBuffer.wrap(byteBuffer)
                        .order(ByteOrder.LITTLE_ENDIAN)
                        .asShortBuffer()
                        .get(shortArray)

                    val decibels = calculateDecibels(shortArray)
                    val isVoiceActive = decibels >= VAD_THRESHOLD_DB

                    onVadStateChanged(isVoiceActive, decibels)

                    if (isVoiceActive) {
                        // Forward 3200-byte frame into the outbound transmission pipe
                        upstreamAudioChannel.send(byteBuffer.copyOf())
                    }
                }
            }
        }

        // 4. Launch Playback Loop to pipe incoming TTS bytes directly to AudioTrack
        playbackJob = scope.launch(Dispatchers.Default) {
            for (chunk in downstreamPlaybackChannel) {
                if (!isActive || audioTrack == null) break
                var offset = 0
                while (offset < chunk.size) {
                    val written = audioTrack?.write(chunk, offset, chunk.size - offset) ?: -1
                    if (written > 0) {
                        offset += written
                    } else {
                        Log.w(TAG, "AudioTrack write returned: $written")
                        break
                    }
                }
            }
        }

        Log.i(TAG, "Audio Hardware Engine fully started.")
    }

    /**
     * RMS (Root Mean Square) decibel calculation relative to 16-bit PCM full scale.
     */
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
            maxFrameSize = Long.MAX_VALUE
        }
    }

    private var connectionJob: Job? = null
    private var isIntentionalStop = false

    fun startSession(
        sourceLang: String,
        targetLang: String,
        upstreamAudioChannel: Channel<ByteArray>
    ) {
        isIntentionalStop = false
        connectionJob?.cancel()

        connectionJob = scope.launch(Dispatchers.IO) {
            var attempt = 0

            while (isActive && !isIntentionalStop) {
                try {
                    Log.i(TAG, "Connecting to Translation WebSocket: $serverHost (Attempt $attempt)")
                    onConnectionStatusChanged(false)

                    client.webSocket(
                        method = HttpMethod.Get,
                        urlString = serverHost
                    ) {
                        Log.i(TAG, "WebSocket connected successfully.")
                        onConnectionStatusChanged(true)
                        attempt = 0 // Reset backoff upon successful handshake

                        // 1. Send initial session handshake configuration
                        val config = HandshakeConfig(
                            sourceLanguage = sourceLang,
                            targetLanguage = targetLang
                        )
                        send(Frame.Text(json.encodeToString(HandshakeConfig.serializer(), config)))

                        // 2. Upstream transmitter coroutine: Pipe 3200-byte VAD frames to server
                        val upstreamJob = launch {
                            for (chunk in upstreamAudioChannel) {
                                if (!isActive) break
                                send(Frame.Binary(fin = true, data = chunk))
                            }
                        }

                        // 3. Downstream receiver loop
                        try {
                            for (frame in incoming) {
                                when (frame) {
                                    is Frame.Binary -> {
                                        val rawPcm = frame.readBytes()
                                        onIncomingAudioChunk(rawPcm)
                                    }
                                    is Frame.Text -> {
                                        val text = frame.readText()
                                        try {
                                            val transcript = json.decodeFromString(
                                                TranscriptMessage.serializer(),
                                                text
                                            )
                                            onTranscriptReceived(transcript)
                                        } catch (e: Exception) {
                                            Log.d(TAG, "Non-JSON incoming message: $text")
                                        }
                                    }
                                    else -> Unit
                                }
                            }
                        } finally {
                            upstreamJob.cancel()
                        }
                    }
                } catch (e: CancellationException) {
                    Log.i(TAG, "WebSocket session canceled.")
                    break
                } catch (e: ClosedReceiveChannelException) {
                    Log.w(TAG, "WebSocket server closed channel.")
                } catch (e: Exception) {
                    Log.e(TAG, "WebSocket connection error: \${e.localizedMessage}")
                } finally {
                    onConnectionStatusChanged(false)
                }

                if (!isIntentionalStop) {
                    attempt++
                    val backoff = min(BASE_BACKOFF_MS * (2.0.pow(attempt.toDouble())).toLong(), MAX_BACKOFF_MS)
                    Log.w(TAG, "Reconnecting in \${backoff}ms...")
                    delay(backoff)
                }
            }
        }
    }

    fun stopSession() {
        isIntentionalStop = true
        connectionJob?.cancel()
        connectionJob = null
        onConnectionStatusChanged(false)
        Log.i(TAG, "Translation WebSocket stopped.")
    }

    fun close() {
        stopSession()
        client.close()
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
import androidx.core.app.ServiceCompat
import com.voicecall.translation.audio.AudioHardwareEngine
import com.voicecall.translation.model.CallServiceState
import com.voicecall.translation.model.TranscriptMessage
import com.voicecall.translation.network.TranslationWebSocketClient
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
 * Android 14+ Compliant Foreground Service.
 * Enforces dual foreground types: FOREGROUND_SERVICE_TYPE_MICROPHONE & FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK.
 */
class CallTranslationService : Service() {

    companion object {
        private const val TAG = "CallTranslationService"
        const val NOTIFICATION_ID = 9001
        const val CHANNEL_ID = "call_translation_channel"

        const val ACTION_START_CALL = "ACTION_START_CALL"
        const val ACTION_STOP_CALL = "ACTION_STOP_CALL"

        const val EXTRA_SOURCE_LANG = "EXTRA_SOURCE_LANG"
        const val EXTRA_TARGET_LANG = "EXTRA_TARGET_LANG"

        const val BROADCAST_TRANSCRIPT = "com.voicecall.translation.BROADCAST_TRANSCRIPT"
        const val EXTRA_TRANSCRIPT_JSON = "EXTRA_TRANSCRIPT_JSON"
    }

    private val serviceJob = SupervisorJob()
    private val serviceScope = CoroutineScope(Dispatchers.Default + serviceJob)

    private val binder = LocalBinder()

    private val _serviceState = MutableStateFlow<CallServiceState>(CallServiceState.Idle)
    val serviceState = _serviceState.asStateFlow()

    private val _transcriptsFlow = MutableSharedFlow<TranscriptMessage>(replay = 50)
    val transcriptsFlow = _transcriptsFlow.asSharedFlow()

    private val _vadDecibelsFlow = MutableStateFlow(0.0)
    val vadDecibelsFlow = _vadDecibelsFlow.asStateFlow()

    private val _isVoiceActiveFlow = MutableStateFlow(false)
    val isVoiceActiveFlow = _isVoiceActiveFlow.asStateFlow()

    private var audioEngine: AudioHardwareEngine? = null
    private var webSocketClient: TranslationWebSocketClient? = null

    inner class LocalBinder : Binder() {
        fun getService(): CallTranslationService = this@CallTranslationService
    }

    override fun onBind(intent: Intent?): IBinder = binder

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        Log.i(TAG, "CallTranslationService created.")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START_CALL -> {
                val sourceLang = intent.getStringExtra(EXTRA_SOURCE_LANG) ?: "en-US"
                val targetLang = intent.getStringExtra(EXTRA_TARGET_LANG) ?: "es-ES"
                startForegroundCall(sourceLang, targetLang)
            }
            ACTION_STOP_CALL -> {
                stopForegroundCall()
            }
        }
        return START_NOT_STICKY
    }

    private fun startForegroundCall(sourceLang: String, targetLang: String) {
        val notification = buildPersistentNotification(
            title = "Live Call Translation Active",
            content = "Translating: $sourceLang ➔ $targetLang"
        )

        // Android 14 (API 34+) requires explicit foregroundServiceType flags
        val serviceTypes = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE or
            ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
        } else {
            0
        }

        ServiceCompat.startForeground(
            this,
            NOTIFICATION_ID,
            notification,
            serviceTypes
        )

        _serviceState.value = CallServiceState.Connecting

        // 1. Initialize Audio Hardware Engine
        audioEngine = AudioHardwareEngine(
            scope = serviceScope,
            onVadStateChanged = { isActive, decibels ->
                _isVoiceActiveFlow.value = isActive
                _vadDecibelsFlow.value = decibels
            }
        ).apply {
            startCaptureAndPlayback()
        }

        // 2. Initialize WebSocket Network Engine
        webSocketClient = TranslationWebSocketClient(
            scope = serviceScope,
            onTranscriptReceived = { transcript ->
                serviceScope.launch {
                    _transcriptsFlow.emit(transcript)
                }
                sendBroadcast(Intent(BROADCAST_TRANSCRIPT).apply {
                    putExtra(EXTRA_TRANSCRIPT_JSON, transcript.translatedText)
                })
            },
            onIncomingAudioChunk = { pcmChunk ->
                audioEngine?.downstreamPlaybackChannel?.send(pcmChunk)
            },
            onConnectionStatusChanged = { isConnected ->
                _serviceState.value = if (isConnected) {
                    CallServiceState.Active(sourceLang, targetLang)
                } else {
                    CallServiceState.Connecting
                }
            }
        ).apply {
            startSession(
                sourceLang = sourceLang,
                targetLang = targetLang,
                upstreamAudioChannel = audioEngine!!.upstreamAudioChannel
            )
        }

        Log.i(TAG, "Foreground call started: $sourceLang -> $targetLang")
    }

    private fun stopForegroundCall() {
        audioEngine?.stop()
        audioEngine = null

        webSocketClient?.stopSession()
        webSocketClient = null

        _serviceState.value = CallServiceState.Idle
        _isVoiceActiveFlow.value = false
        _vadDecibelsFlow.value = 0.0

        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
        stopSelf()
        Log.i(TAG, "Foreground call stopped.")
    }

    private fun buildPersistentNotification(title: String, content: String): Notification {
        val launchIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val contentPendingIntent = PendingIntent.getActivity(
            this,
            0,
            launchIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val stopIntent = Intent(this, CallTranslationService::class.java).apply {
            action = ACTION_STOP_CALL
        }
        val stopPendingIntent = PendingIntent.getService(
            this,
            1,
            stopIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(content)
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setOngoing(true)
            .setContentIntent(contentPendingIntent)
            .addAction(
                android.R.drawable.ic_menu_close_clear_cancel,
                "End Translation",
                stopPendingIntent
            )
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
            .setPriority(NotificationCompat.PRIORITY_LOW) // Silent so it won't interrupt phone audio
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Live Call Translation",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Status notification for active real-time call translation"
                setSound(null, null)
                enableVibration(false)
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        stopForegroundCall()
        webSocketClient?.close()
        serviceScope.cancel()
        Log.i(TAG, "CallTranslationService destroyed.")
    }
}`
  },
  {
    path: 'app/src/main/java/com/voicecall/translation/ui/MainActivity.kt',
    name: 'MainActivity.kt',
    category: 'Kotlin',
    language: 'kotlin',
    content: `package com.voicecall.translation.ui

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
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
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.voicecall.translation.model.CallServiceState
import com.voicecall.translation.model.SpeakerRole
import com.voicecall.translation.model.SupportedLanguage
import com.voicecall.translation.model.TranscriptMessage
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : ComponentActivity() {

    private val viewModel: TranslationViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            MaterialTheme(colorScheme = darkColorScheme()) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    TranslationAppScreen(viewModel = viewModel)
                }
            }
        }
    }

    override fun onStart() {
        super.onStart()
        viewModel.bindService(this)
    }

    override fun onStop() {
        super.onStop()
        viewModel.unbindService(this)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TranslationAppScreen(viewModel: TranslationViewModel) {
    val context = LocalContext.current
    val serviceState by viewModel.serviceState.collectAsState()
    val transcripts by viewModel.transcripts.collectAsState()
    val vadDecibels by viewModel.vadDecibels.collectAsState()
    val isVoiceActive by viewModel.isVoiceActive.collectAsState()

    val sourceLanguage by viewModel.selectedSourceLanguage.collectAsState()
    val targetLanguage by viewModel.selectedTargetLanguage.collectAsState()

    // Android 14 Dual Permissions: RECORD_AUDIO and POST_NOTIFICATIONS
    val requiredPermissions = remember {
        mutableListOf(Manifest.permission.RECORD_AUDIO).apply {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                add(Manifest.permission.POST_NOTIFICATIONS)
            }
        }.toTypedArray()
    }

    var hasAllPermissions by remember {
        mutableStateOf(
            requiredPermissions.all {
                ContextCompat.checkSelfPermission(context, it) == PackageManager.PERMISSION_GRANTED
            }
        )
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { results ->
        hasAllPermissions = results.values.all { it }
    }

    val isCallActive = serviceState is CallServiceState.Active || serviceState is CallServiceState.Connecting
    val listState = rememberLazyListState()

    LaunchedEffect(transcripts.size) {
        if (transcripts.isNotEmpty()) {
            listState.animateScrollToItem(transcripts.size - 1)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Translate,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(28.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text("Voice & Call Translator", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                            Text(
                                text = when (serviceState) {
                                    is CallServiceState.Active -> "Live Stream • Low-Latency 16kHz"
                                    is CallServiceState.Connecting -> "Connecting to WebSocket..."
                                    is CallServiceState.Error -> "Connection Error"
                                    CallServiceState.Idle -> "Hardware AEC Ready"
                                },
                                style = MaterialTheme.typography.bodySmall,
                                color = if (isCallActive) Color(0xFF4CAF50) else MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                },
                actions = {
                    if (transcripts.isNotEmpty()) {
                        IconButton(onClick = { viewModel.clearTranscripts() }) {
                            Icon(Icons.Default.DeleteOutline, contentDescription = "Clear History")
                        }
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp, vertical = 8.dp)
        ) {
            // Permission Banner
            if (!hasAllPermissions) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
                    modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.MicOff, contentDescription = null, tint = MaterialTheme.colorScheme.error)
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(
                            "Record Audio & Notification permissions are required.",
                            modifier = Modifier.weight(1f),
                            style = MaterialTheme.typography.bodyMedium
                        )
                        Button(onClick = { permissionLauncher.launch(requiredPermissions) }) {
                            Text("Grant")
                        }
                    }
                }
            }

            // Language Selector Card
            LanguageSelectorCard(
                sourceLanguage = sourceLanguage,
                targetLanguage = targetLanguage,
                isCallActive = isCallActive,
                onSourceChange = { viewModel.selectedSourceLanguage.value = it },
                onTargetChange = { viewModel.selectedTargetLanguage.value = it },
                onSwap = { viewModel.swapLanguages() }
            )

            Spacer(modifier = Modifier.height(10.dp))

            // Live Audio & RMS VAD Decibel Gauge
            AnimatedVisibility(visible = isCallActive) {
                VadAudioMeter(
                    decibels = vadDecibels,
                    isVoiceActive = isVoiceActive
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Real-Time Transcript Display
            Card(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f))
            ) {
                if (transcripts.isEmpty()) {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                imageVector = Icons.Default.RecordVoiceOver,
                                contentDescription = null,
                                modifier = Modifier.size(48.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                "No conversation yet.\\nTap Start to begin live translation.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
                                textAlign = androidx.compose.ui.text.style.TextAlign.Center
                            )
                        }
                    }
                } else {
                    LazyColumn(
                        state = listState,
                        modifier = Modifier.fillMaxSize().padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        items(transcripts, key = { it.id }) { message ->
                            TranscriptBubble(message = message)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Main Call Control Button
            Button(
                onClick = {
                    if (isCallActive) {
                        viewModel.stopCall(context)
                    } else {
                        if (hasAllPermissions) {
                            viewModel.startCall(context)
                        } else {
                            permissionLauncher.launch(requiredPermissions)
                        }
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(60.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (isCallActive) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary
                ),
                shape = RoundedCornerShape(16.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = if (isCallActive) Icons.Default.CallEnd else Icons.Default.Call,
                        contentDescription = null,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        text = if (isCallActive) "End Translation Call" else "Start Live Translation",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

@Composable
fun VadAudioMeter(decibels: Double, isVoiceActive: Boolean) {
    val animatedProgress by animateFloatAsState(
        targetValue = (decibels.toFloat() / 90f).coerceIn(0f, 1f),
        label = "AudioLevel"
    )
    val indicatorColor by animateColorAsState(
        targetValue = if (isVoiceActive) Color(0xFF4CAF50) else Color(0xFF757575),
        label = "VADColor"
    )

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(10.dp)
                            .clip(CircleShape)
                            .background(indicatorColor)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (isVoiceActive) "Voice Detected (Streaming)" else "Silence Gate Active (<30dB)",
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.Medium
                    )
                }
                Text(
                    text = "\${decibels.toInt()} dB",
                    style = MaterialTheme.typography.bodySmall,
                    color = indicatorColor,
                    fontWeight = FontWeight.Bold
                )
            }
            Spacer(modifier = Modifier.height(6.dp))
            LinearProgressIndicator(
                progress = { animatedProgress },
                modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(3.dp)),
                color = indicatorColor,
                trackColor = MaterialTheme.colorScheme.surfaceVariant
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LanguageSelectorCard(
    sourceLanguage: SupportedLanguage,
    targetLanguage: SupportedLanguage,
    isCallActive: Boolean,
    onSourceChange: (SupportedLanguage) -> Unit,
    onTargetChange: (SupportedLanguage) -> Unit,
    onSwap: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f))
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            LanguageDropdown(
                label = "Speak",
                selectedLanguage = sourceLanguage,
                enabled = !isCallActive,
                onSelected = onSourceChange,
                modifier = Modifier.weight(1f)
            )

            IconButton(
                onClick = onSwap,
                enabled = !isCallActive,
                modifier = Modifier.padding(horizontal = 4.dp)
            ) {
                Icon(Icons.Default.SwapHoriz, contentDescription = "Swap Languages")
            }

            LanguageDropdown(
                label = "Translate To",
                selectedLanguage = targetLanguage,
                enabled = !isCallActive,
                onSelected = onTargetChange,
                modifier = Modifier.weight(1f)
            )
        }
    }
}

@Composable
fun LanguageDropdown(
    label: String,
    selectedLanguage: SupportedLanguage,
    enabled: Boolean,
    onSelected: (SupportedLanguage) -> Unit,
    modifier: Modifier = Modifier
) {
    var expanded by remember { mutableStateOf(false) }

    Column(modifier = modifier) {
        Text(text = label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
        Spacer(modifier = Modifier.height(2.dp))
        Surface(
            onClick = { if (enabled) expanded = true },
            shape = RoundedCornerShape(8.dp),
            color = MaterialTheme.colorScheme.surface,
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "\${selectedLanguage.flagEmoji} \${selectedLanguage.displayName}",
                    style = MaterialTheme.typography.bodyMedium,
                    maxLines = 1
                )
                Icon(Icons.Default.ArrowDropDown, contentDescription = null, modifier = Modifier.size(18.dp))
            }
        }

        DropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false }
        ) {
            SupportedLanguage.ALL.forEach { lang ->
                DropdownMenuItem(
                    text = { Text("\${lang.flagEmoji}  \${lang.displayName}") },
                    onClick = {
                        onSelected(lang)
                        expanded = false
                    }
                )
            }
        }
    }
}

@Composable
fun TranscriptBubble(message: TranscriptMessage) {
    val isLocal = message.speaker == SpeakerRole.LOCAL_USER
    val alignment = if (isLocal) Alignment.End else Alignment.Start
    val bubbleColor = if (isLocal) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.secondaryContainer
    val timeFormat = remember { SimpleDateFormat("HH:mm:ss", Locale.getDefault()) }

    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = alignment
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = if (isLocal) "You (\${message.sourceLang})" else "Remote (\${message.targetLang})",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = timeFormat.format(Date(message.timestamp)),
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
            )
        }

        Spacer(modifier = Modifier.height(4.dp))

        Card(
            shape = RoundedCornerShape(
                topStart = 14.dp,
                topEnd = 14.dp,
                bottomStart = if (isLocal) 14.dp else 2.dp,
                bottomEnd = if (isLocal) 2.dp else 14.dp
            ),
            colors = CardDefaults.cardColors(containerColor = bubbleColor),
            modifier = Modifier.widthIn(max = 300.dp)
        ) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text(
                    text = message.translatedText,
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.SemiBold
                )
                if (message.originalText.isNotEmpty() && message.originalText != message.translatedText) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "\\"" + message.originalText + "\\"",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                    )
                }
            }
        }
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
    val selectedTargetLanguage = MutableStateFlow(SupportedLanguage.ALL[1])

    private val connection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
            val binder = service as CallTranslationService.LocalBinder
            val s = binder.getService()
            boundService = s
            isBound.value = true

            // Observe service state
            viewModelScope.launch {
                s.serviceState.collect { serviceState.value = it }
            }
            // Observe transcripts
            viewModelScope.launch {
                s.transcriptsFlow.collect { transcript ->
                    transcripts.value = transcripts.value + transcript
                }
            }
            // Observe VAD
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
