#!/usr/bin/env bash
# Fix Expo/RN scripts that break when the project path contains spaces.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

CONSTANTS_SCRIPT="$ROOT/node_modules/expo-constants/scripts/get-app-config-ios.sh"
if [[ -f "$CONSTANTS_SCRIPT" ]]; then
  if grep -q 'basename \$PROJECT_DIR' "$CONSTANTS_SCRIPT"; then
    sed -i '' 's/basename \$PROJECT_DIR/basename "\$PROJECT_DIR"/' "$CONSTANTS_SCRIPT"
    echo "Patched expo-constants get-app-config-ios.sh for spaced paths"
  fi
fi

PBXPROJ="$ROOT/ios/AdsGuard.xcodeproj/project.pbxproj"
if [[ -f "$PBXPROJ" ]]; then
  python3 - "$PBXPROJ" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
text = path.read_text()
changed = False

# Original Expo/RN form uses unquoted backticks — breaks on spaces in path
old = '`\\"$NODE_BINARY\\" --print \\"require(\'path\').dirname(require.resolve(\'react-native/package.json\')) + \'/scripts/react-native-xcode.sh\'\\"`'
# pbxproj-escaped quoted form so shell executes:
# "$("$NODE_BINARY" --print "...")"
new = '\\"$(\\"$NODE_BINARY\\" --print \\"require(\'path\').dirname(require.resolve(\'react-native/package.json\')) + \'/scripts/react-native-xcode.sh\'\\")\\"'

if old in text:
    text = text.replace(old, new, 1)
    changed = True

# Also fix broken intermediate form if present
broken = '"$(\\"$NODE_BINARY\\" --print \\"require(\'path\').dirname(require.resolve(\'react-native/package.json\')) + \'/scripts/react-native-xcode.sh\'\\")"'
if broken in text:
    text = text.replace(broken, new, 1)
    changed = True

if 'export PROJECT_ROOT=\\"$PROJECT_DIR\\"/..\\n' in text:
    text = text.replace(
        'export PROJECT_ROOT=\\"$PROJECT_DIR\\"/..\\n',
        'export PROJECT_ROOT=\\"$PROJECT_DIR/..\\"\\n',
        1,
    )
    changed = True

# Ensure the Xcode build phase resolves node modules from the real project root.
# Without this, `require.resolve('react-native/package.json')` may pick up an
# unexpected installation path and break when the project directory contains spaces.
needle = 'export PROJECT_ROOT=\\"$PROJECT_DIR/..\\"\\n\\nif [[ \"$CONFIGURATION\" = *Debug* ]]'
replacement = 'export PROJECT_ROOT=\\"$PROJECT_DIR/..\\"\\ncd \\"$PROJECT_ROOT\\" || exit\\n\\nif [[ \"$CONFIGURATION\" = *Debug* ]]'
if needle in text and replacement not in text:
    text = text.replace(needle, replacement, 1)
    changed = True

if changed:
    path.write_text(text)
    print("Patched AdsGuard.xcodeproj Bundle RN script for spaced paths")
PY
fi
