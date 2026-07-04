import Foundation

struct ServerSettings {
    private enum Keys {
        static let host = "home_agent_server_host"
        static let useTLS = "home_agent_server_use_tls"
        static let userID = "home_agent_user_id"
    }

    static var host: String {
        get { UserDefaults.standard.string(forKey: Keys.host) ?? "192.168.1.100:8000" }
        set { UserDefaults.standard.set(newValue, forKey: Keys.host) }
    }

    static var useTLS: Bool {
        get { UserDefaults.standard.bool(forKey: Keys.useTLS) }
        set { UserDefaults.standard.set(newValue, forKey: Keys.useTLS) }
    }

    static var userID: String {
        if let existing = UserDefaults.standard.string(forKey: Keys.userID) {
            return existing
        }
        let generated = UUID().uuidString.prefix(10).description
        UserDefaults.standard.set(generated, forKey: Keys.userID)
        return generated
    }

    static func websocketURL(audioMode: Bool) -> URL? {
        let scheme = useTLS ? "wss" : "ws"
        let audioFlag = audioMode ? "true" : "false"
        return URL(string: "\(scheme)://\(host)/ws/\(userID)?is_audio=\(audioFlag)")
    }
}
