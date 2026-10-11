#!/bin/bash
# Двойной щелчок в Finder: установка всего нужного для сборки роликов.
cd "$(dirname "$0")"
echo "=== Nyurgun Video Kit: установка ==="
if ! command -v brew >/dev/null 2>&1; then
  for p in /opt/homebrew/bin/brew /usr/local/bin/brew; do [ -x "$p" ] && eval "$($p shellenv)"; done
fi
if ! command -v brew >/dev/null 2>&1; then
  echo "Ставлю Homebrew (попросит пароль от Mac — это нормально)..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  for p in /opt/homebrew/bin/brew /usr/local/bin/brew; do [ -x "$p" ] && eval "$($p shellenv)"; done
fi
command -v node   >/dev/null 2>&1 || brew install node
command -v ffmpeg >/dev/null 2>&1 || brew install ffmpeg
command -v python3 >/dev/null 2>&1 || brew install python
echo "Ставлю библиотеки..."
npm install || exit 1
npx playwright install chromium || exit 1
python3 -m pip install --user numpy requests 2>/dev/null || python3 -m pip install --user --break-system-packages numpy requests
if ! grep -q ELEVENLABS_API_KEY .env 2>/dev/null; then
  echo ""
  echo "Вставь ключ ElevenLabs (elevenlabs.io → Profile → API Keys) и нажми Enter:"
  read -r KEY
  [ -n "$KEY" ] && echo "ELEVENLABS_API_KEY=$KEY" >> .env && chmod 600 .env
fi
echo ""
echo "Проверка: собираю контрольные кадры примера (без затрат, голос уже в примере)..."
python3 build.py examples/passkey_en/spec.json --voice-file examples/passkey_en/voice.mp3 --words-file examples/passkey_en/words.json --sheet && open out/passkey_en_sheet.jpg
echo ""
echo "=== Готово. Клади spec.json от ChatGPT в папку inbox и запускай make-video.command ==="
read -n 1 -s -r -p "Нажми любую клавишу, чтобы закрыть"
