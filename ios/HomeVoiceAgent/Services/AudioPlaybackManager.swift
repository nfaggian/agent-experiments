import AVFoundation

final class AudioPlaybackManager {
    private let engine = AVAudioEngine()
    private let playerNode = AVAudioPlayerNode()
    private let format = AVAudioFormat(
        commonFormat: .pcmFormatInt16,
        sampleRate: 24_000,
        channels: 1,
        interleaved: true
    )

    func start() throws {
        guard let format else {
            throw NSError(domain: "AudioPlaybackManager", code: 1)
        }

        engine.attach(playerNode)
        engine.connect(playerNode, to: engine.mainMixerNode, format: format)
        engine.prepare()
        try engine.start()
        playerNode.play()
    }

    func enqueue(pcmData: Data) {
        guard let format else { return }

        let frameCount = pcmData.count / MemoryLayout<Int16>.size
        guard frameCount > 0,
              let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: AVAudioFrameCount(frameCount)),
              let channelData = buffer.int16ChannelData else {
            return
        }

        buffer.frameLength = AVAudioFrameCount(frameCount)
        pcmData.withUnsafeBytes { rawBuffer in
            guard let source = rawBuffer.bindMemory(to: Int16.self).baseAddress else { return }
            channelData[0].update(from: source, count: frameCount)
        }
        playerNode.scheduleBuffer(buffer)
    }

    func interrupt() {
        playerNode.stop()
        playerNode.play()
    }

    func stop() {
        playerNode.stop()
        engine.stop()
    }
}
