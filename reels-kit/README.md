# Набор для роликов: ник + концовка + звуки

Запуск (нужны python3, numpy, Pillow, ffmpeg, DejaVu-шрифты):

1. python3 build_endcard_and_nick.py  -> создаст nick.png, endcard.mp4, sfx.wav
2. Собрать итоговый ролик (исходник src.mp4):

ffmpeg -i src.mp4 -i endcard.mp4 -i sfx.wav -i nick.png -filter_complex "[0:v][3:v]overlay=0:0,trim=duration=55.5,setpts=PTS-STARTPTS[mv];[1:v]setpts=PTS-STARTPTS,format=yuv420p[ev];[mv][ev]concat=n=2:v=1:a=0[v];[0:a]atrim=0:55.5,asetpts=PTS-STARTPTS,aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[a0];[2:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,volume=0.55[sfx];[a0][sfx]amix=inputs=2:normalize=0:duration=longest,loudnorm=I=-14:TP=-1.5:LRA=11,alimiter=limit=0.95,atrim=0:60.5[a]" -map "[v]" -map "[a]" -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -t 60.5 -movflags +faststart final.mp4

Что менять под новый ролик:
- длину исходника (SRC_DUR) и длину концовки (END_DUR) в начале скрипта;
- текст призывов (LINES) и ник (NICK);
- цвета (PINK, YELLOW, CYAN) под аккаунт;
- таймкоды звуков в build_sfx().
