# Nyurgun Video Kit — 3D-ролики одной командой

ChatGPT (или любой ИИ) пишет **spec.json** → Mac собирает готовый MP4 1080×1920:
3D-сцена, голос ElevenLabs, субтитры по словам, звук (удар, щелчки, свуши, райзеры, фон).

## Самый простой путь
1. Двойной щелчок по **setup.command** (один раз). Если Mac скажет «неизвестный разработчик» — правый клик → Открыть.
2. Сохрани spec.json от ChatGPT в папку **inbox**.
3. Двойной щелчок по **make-video.command** → ролик откроется сам из папки **out**.

Через Codex (ChatGPT в Терминале): `cd ~/Projects/nyurgun-video-kit && codex "сделай ролик про …"` —
он сам напишет spec.json и соберёт ролик (инструкция для него в AGENTS.md).

## Установка вручную (если setup.command не сработал)
В Терминале:
```bash
# 1. Homebrew, если его нет: https://brew.sh
brew install node ffmpeg python
# 2. папка набора
cd ~/nyurgun-video-kit        # куда скачал папку kit
npm install
npx playwright install chromium
pip3 install numpy requests
# 3. ключ ElevenLabs (Profile → API Keys на elevenlabs.io)
echo 'export ELEVENLABS_API_KEY="сюда_ключ"' >> ~/.zshrc && source ~/.zshrc
```

## Как сделать ролик
1. В ChatGPT: «сделай ролик про …» (инструкция для него — `CHATGPT_PROMPT.md`).
2. Он отдаёт JSON. Сохрани его как файл, например `inbox/topic_ru.json`.
3. Проверка раскладки (быстро, ~1 мин, без затрат кроме голоса):
   ```bash
   python3 build.py inbox/topic_ru.json --sheet
   ```
   Открой `out/topic_ru_sheet.jpg`. Если подписи наезжают — попроси ChatGPT поправить координаты.
4. Финал:
   ```bash
   python3 build.py inbox/topic_ru.json
   ```
   Готово: `out/topic_ru.mp4`. Описания для публикации ChatGPT даёт отдельным блоком.

Голос и тайминги генерируются один раз и кэшируются в `work/<name>/`. Повторная сборка после правок spec.json голос заново **не** покупает. Чтобы перегенерировать голос, удали `work/<name>/voice.mp3` и `words.json`.

## Стоимость
Голос ~$0,17–0,18 за минуту + распознавание слов ~$0,06. Рендер и звук бесплатны (на твоём Mac).

## Опции
- `--preview` — быстрый черновик 540p 15 fps
- `--voice-file v.mp3 --words-file w.json` — своя озвучка и тайминги
- `--jobs 4` — больше параллельных процессов рендера (если Mac мощный)
- `SOFTGL=1` — если 3D не запускается на GPU

## Перед публикацией (юридически)
- Все цифры — с источником (строка `source` на экране и в описании).
- Без чужих логотипов, музыки и голосов; на экране «иллюстрация».
- Голос синтезирован → в TikTok включить «AI-generated content».

## Файлы
- `build.py` — сборщик · `render.mjs` — покадровый рендер · `engine/` — 3D-движок
- `SPEC.md` — формат spec.json · `CHATGPT_PROMPT.md` — инструкция для ChatGPT
- `examples/passkey_en/spec.json` — рабочий пример (ролик про passkey)
