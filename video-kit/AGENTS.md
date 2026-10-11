# Instructions for coding agents (Codex CLI, Claude Code, etc.)

This folder turns a `spec.json` into a finished vertical 3D explainer video (1080x1920 MP4).

When the user asks for a video ("сделай ролик про …" / "make a video about …"):
1. Research facts with sources (dates). No number without a source.
2. Write `inbox/<name>_ru.json` and/or `inbox/<name>_en.json` strictly following `SPEC.md`
   (example: `examples/passkey_en/spec.json`). Rules and voice IDs are in `CHATGPT_PROMPT.md`.
   Every `start`/`at`/`until` anchor must be words copied verbatim from `voice.text`.
3. Run `python3 build.py inbox/<name>.json --sheet`, open `out/<name>_sheet.jpg`, fix overlaps
   (labels on top of each other, text under the top HUD or bottom subtitles) by editing positions.
4. Run `python3 build.py inbox/<name>.json`. Result: `out/<name>.mp4`.
5. Write publication captions (TikTok/Reels/Shorts/Telegram) and the legal checklist
   (sources, "illustration" label, AI-generated content label in TikTok) to `out/<name>_post.md`.

Costs: each new voice ≈ $0.17–0.18 per minute + word timings ≈ $0.06 (ElevenLabs key in `.env`).
Voice and timings are cached in `work/<name>/`; editing the spec and rebuilding does not re-buy the voice
unless `voice.text` changed — then delete `work/<name>/voice.mp3` and `words.json` first.
