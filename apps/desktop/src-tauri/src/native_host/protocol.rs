//! The browser side of native messaging: each message is a 32-bit length in native byte order,
//! then that many bytes of UTF-8 JSON. The extension sends one request with `sendNativeMessage`,
//! reads one response and closes the pipe.

use std::io::{self, Read, Write};

use serde::{Deserialize, Serialize};

use crate::fix::{self, InputSources, LayoutSwitch};
use crate::platform::ArabicLayout;

/// Requests are tiny; anything larger is not from our extension.
const MAX_REQUEST_BYTES: u32 = 4096;

#[derive(Debug, Deserialize, PartialEq, Eq)]
#[serde(tag = "type", rename_all = "kebab-case")]
pub enum Request {
    /// The extension's Settings checks that the desktop app is installed and new enough.
    Ping,
    SwitchLayout {
        language: String,
        layout: ArabicLayout,
    },
}

#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct Response {
    ok: bool,
    version: &'static str,
    #[serde(skip_serializing_if = "Option::is_none")]
    result: Option<LayoutSwitch>,
    /// A stable code (`invalid-request`, `unsupported`, …); details stay in the app's logs.
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

impl Response {
    fn ok(result: Option<LayoutSwitch>) -> Self {
        Self {
            ok: true,
            version: env!("CARGO_PKG_VERSION"),
            result,
            error: None,
        }
    }
    fn error(code: impl Into<String>) -> Self {
        Self {
            ok: false,
            version: env!("CARGO_PKG_VERSION"),
            result: None,
            error: Some(code.into()),
        }
    }
}

/// `None` at a clean end of input (the browser closed the pipe).
pub fn read_message(input: &mut impl Read) -> io::Result<Option<Vec<u8>>> {
    let mut length = [0u8; 4];
    match input.read_exact(&mut length) {
        Ok(()) => {}
        Err(error) if error.kind() == io::ErrorKind::UnexpectedEof => return Ok(None),
        Err(error) => return Err(error),
    }
    let length = u32::from_ne_bytes(length);
    if length > MAX_REQUEST_BYTES {
        return Err(io::Error::new(
            io::ErrorKind::InvalidData,
            format!("message of {length} bytes"),
        ));
    }
    let mut body = vec![0; length as usize];
    input.read_exact(&mut body)?;
    Ok(Some(body))
}

pub fn write_message(output: &mut impl Write, response: &Response) -> io::Result<()> {
    let body = serde_json::to_vec(response).map_err(io::Error::other)?;
    let length = u32::try_from(body.len()).map_err(io::Error::other)?;
    output.write_all(&length.to_ne_bytes())?;
    output.write_all(&body)?;
    output.flush()
}

/// Answers one request. `preferred` maps the Arabic layout setting to this OS's layout ids.
pub fn handle(
    body: &[u8],
    sources: &dyn InputSources,
    preferred: fn(ArabicLayout) -> &'static [&'static str],
) -> Response {
    match serde_json::from_slice::<Request>(body) {
        Ok(Request::Ping) => Response::ok(None),
        Ok(Request::SwitchLayout { language, layout }) if fix::is_language_code(&language) => {
            match fix::switch_to(sources, &language, preferred(layout)) {
                Ok(result) => Response::ok(Some(result)),
                Err(error) => {
                    eprintln!("[layout-fixer] native host: {error}");
                    Response::error(match error {
                        fix::FixError::Unsupported => "unsupported",
                        fix::FixError::Wayland => "wayland",
                        _ => "system",
                    })
                }
            }
        }
        Ok(Request::SwitchLayout { .. }) | Err(_) => Response::error("invalid-request"),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fix::{FixError, InputLayout};
    use std::sync::Mutex;

    fn frame(json: &str) -> Vec<u8> {
        let mut bytes = u32::try_from(json.len()).unwrap().to_ne_bytes().to_vec();
        bytes.extend_from_slice(json.as_bytes());
        bytes
    }

    #[derive(Default)]
    struct Fake {
        selected: Mutex<Vec<String>>,
    }

    impl InputSources for Fake {
        fn enabled(&self) -> Result<Vec<InputLayout>, FixError> {
            Ok(vec![
                InputLayout {
                    id: "abc".into(),
                    languages: vec!["en".into()],
                },
                InputLayout {
                    id: "arabic-pc".into(),
                    languages: vec!["ar".into()],
                },
            ])
        }
        fn current(&self) -> Option<InputLayout> {
            None
        }
        fn select(&self, id: &str) -> Result<(), FixError> {
            self.selected.lock().unwrap().push(id.into());
            Ok(())
        }
    }

    fn preferred(layout: ArabicLayout) -> &'static [&'static str] {
        match layout {
            ArabicLayout::ArPc => &["arabic-pc"],
            ArabicLayout::ArMac => &[],
        }
    }

    fn answer(json: &str, sources: &Fake) -> serde_json::Value {
        serde_json::to_value(handle(json.as_bytes(), sources, preferred)).unwrap()
    }

    #[test]
    fn reads_a_framed_message_then_the_end() {
        let mut input = io::Cursor::new(frame(r#"{"type":"ping"}"#));
        assert_eq!(
            read_message(&mut input).unwrap().unwrap(),
            br#"{"type":"ping"}"#
        );
        assert!(read_message(&mut input).unwrap().is_none());
    }

    #[test]
    fn refuses_oversized_messages() {
        let mut input = io::Cursor::new((MAX_REQUEST_BYTES + 1).to_ne_bytes().to_vec());
        assert!(read_message(&mut input).is_err());
    }

    #[test]
    fn writes_length_then_json() {
        let mut output = Vec::new();
        write_message(&mut output, &Response::ok(None)).unwrap();
        let length = u32::from_ne_bytes(output[..4].try_into().unwrap()) as usize;
        assert_eq!(length, output.len() - 4);
        let json: serde_json::Value = serde_json::from_slice(&output[4..]).unwrap();
        assert_eq!(json["ok"], true);
        assert_eq!(json["version"], env!("CARGO_PKG_VERSION"));
    }

    #[test]
    fn answers_a_ping_with_the_version() {
        let json = answer(r#"{"type":"ping"}"#, &Fake::default());
        assert_eq!(
            json,
            serde_json::json!({ "ok": true, "version": env!("CARGO_PKG_VERSION") })
        );
    }

    #[test]
    fn switches_to_the_requested_language() {
        let sources = Fake::default();
        let json = answer(
            r#"{"type":"switch-layout","language":"ar","layout":"ar-pc"}"#,
            &sources,
        );
        assert_eq!(json["ok"], true);
        assert_eq!(json["result"], "switched");
        assert_eq!(*sources.selected.lock().unwrap(), vec!["arabic-pc"]);
    }

    #[test]
    fn rejects_anything_unexpected_without_switching() {
        let sources = Fake::default();
        for request in [
            "not json",
            r#"{"type":"format-disk"}"#,
            r#"{"type":"switch-layout","language":"../../x","layout":"ar-pc"}"#,
            r#"{"type":"switch-layout","language":"ar","layout":"ar-klingon"}"#,
        ] {
            assert_eq!(
                answer(request, &sources)["error"],
                "invalid-request",
                "{request}"
            );
        }
        assert!(sources.selected.lock().unwrap().is_empty());
    }
}
