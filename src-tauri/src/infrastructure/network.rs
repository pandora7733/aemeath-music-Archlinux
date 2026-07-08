const NETWORK_ERROR_KEYWORDS: &[&str] = &[
    "network is unreachable",
    "no route to host",
    "connection refused",
    "connection reset",
    "connection aborted",
    "timed out",
    "timeout",
    "temporary failure in name resolution",
    "name or service not known",
    "failed to lookup address information",
    "dns error",
    "failed to resolve host",
    "failed to resolve",
    "getaddrinfo",
    "unable to connect",
    "cannot connect",
    "not connected",
    "internet disconnected",
    "network unreachable",
];

pub fn is_network_error_text(message: &str) -> bool {
    let lower = message.to_lowercase();
    NETWORK_ERROR_KEYWORDS
        .iter()
        .any(|keyword| lower.contains(keyword))
}

pub fn is_reqwest_offline(err: &reqwest::Error) -> bool {
    err.is_connect() || err.is_timeout() || is_network_error_text(&err.to_string())
}

pub fn offline_message(action: &str) -> String {
    format!("인터넷 연결이 없어 {action}. 인터넷 연결을 확인한 뒤 다시 시도하세요.")
}
