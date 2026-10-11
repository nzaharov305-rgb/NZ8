#!/bin/bash
# Двойной щелчок: собирает ролики из всех новых файлов inbox/*.json (у которых ещё нет mp4 в out/).
cd "$(dirname "$0")"
for p in /opt/homebrew/bin /usr/local/bin; do [ -d "$p" ] && export PATH="$p:$PATH"; done
shopt -s nullglob
found=0
for f in inbox/*.json; do
  name=$(python3 -c "import json,re,sys,pathlib;s=json.load(open(sys.argv[1]));print(re.sub(r'[^\w-]+','_',s.get('name') or pathlib.Path(sys.argv[1]).stem))" "$f") || { echo "Файл $f — не JSON, пропускаю"; continue; }
  [ -f "out/$name.mp4" ] && continue
  found=1
  echo "=== $f → out/$name.mp4 ==="
  python3 build.py "$f" --sheet && open "out/${name}_sheet.jpg"
  python3 build.py "$f" && open "out/$name.mp4"
done
[ $found = 0 ] && echo "Новых файлов в inbox нет. Сохрани туда spec.json от ChatGPT."
read -n 1 -s -r -p "Нажми любую клавишу, чтобы закрыть"
