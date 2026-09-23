// Dumps what a macOS keyboard layout types for each printable key (by KeyboardEvent.code),
// with and without Shift.
// Used to generate the fixtures that verify src/core/maps against the real OS layouts.
//
//   swiftc -O scripts/dump-macos-layout.swift -o /tmp/dump-layout
//   /tmp/dump-layout com.apple.keylayout.Arabic > src/core/layouts/fixtures/com.apple.keylayout.Arabic.json
import Carbon
import Foundation

let keys: [(UInt16, String)] = [
  (50,"Backquote"),(18,"Digit1"),(19,"Digit2"),(20,"Digit3"),(21,"Digit4"),(23,"Digit5"),(22,"Digit6"),
  (26,"Digit7"),(28,"Digit8"),(25,"Digit9"),(29,"Digit0"),(27,"Minus"),(24,"Equal"),
  (12,"KeyQ"),(13,"KeyW"),(14,"KeyE"),(15,"KeyR"),(17,"KeyT"),(16,"KeyY"),(32,"KeyU"),(34,"KeyI"),
  (31,"KeyO"),(35,"KeyP"),(33,"BracketLeft"),(30,"BracketRight"),(42,"Backslash"),
  (0,"KeyA"),(1,"KeyS"),(2,"KeyD"),(3,"KeyF"),(5,"KeyG"),(4,"KeyH"),(38,"KeyJ"),(40,"KeyK"),
  (37,"KeyL"),(41,"Semicolon"),(39,"Quote"),
  (6,"KeyZ"),(7,"KeyX"),(8,"KeyC"),(9,"KeyV"),(11,"KeyB"),(45,"KeyN"),(46,"KeyM"),
  (43,"Comma"),(47,"Period"),(44,"Slash"),
]

func layout(_ id: String) -> Data? {
  let filter = [kTISPropertyInputSourceID as String: id] as CFDictionary
  guard let list = TISCreateInputSourceList(filter, true)?.takeRetainedValue() as? [TISInputSource],
        let source = list.first,
        let ptr = TISGetInputSourceProperty(source, kTISPropertyUnicodeKeyLayoutData) else { return nil }
  return Unmanaged<CFData>.fromOpaque(ptr).takeUnretainedValue() as Data
}

func translate(_ data: Data, _ code: UInt16, shift: Bool) -> String {
  data.withUnsafeBytes { raw -> String in
    let layoutPtr = raw.bindMemory(to: UCKeyboardLayout.self).baseAddress!
    var dead: UInt32 = 0
    var length = 0
    var chars = [UniChar](repeating: 0, count: 8)
    let modifiers: UInt32 = shift ? UInt32(shiftKey >> 8) : 0
    UCKeyTranslate(layoutPtr, code, UInt16(kUCKeyActionDown), modifiers, UInt32(LMGetKbdType()),
                   OptionBits(kUCKeyTranslateNoDeadKeysBit), &dead, 8, &length, &chars)
    return String(utf16CodeUnits: chars, count: length)
  }
}

let id = CommandLine.arguments[1]
guard let data = layout(id) else { print("NOT FOUND \(id)"); exit(1) }
var out: [String: [String: String]] = ["base": [:], "shift": [:]]
for (code, name) in keys {
  out["base"]![name] = translate(data, code, shift: false)
  out["shift"]![name] = translate(data, code, shift: true)
}
let json = try JSONSerialization.data(withJSONObject: out, options: [.sortedKeys])
print(String(data: json, encoding: .utf8)!)
