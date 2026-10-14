import asyncio, sys, os
from playwright.async_api import async_playwright
W,H,FPS,DUR=1080,1920,30,45
HTML="file:///tmp/claude-0/reel/index2.html"
OUT="/tmp/claude-0/reel/frames2"
CHROME="/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
async def worker(p,idx):
    b=await p.chromium.launch(executable_path=CHROME,args=["--no-sandbox"])
    pg=await b.new_page(viewport={"width":W,"height":H})
    pg.on("pageerror",lambda e:print("PAGEERR",e,flush=True))
    await pg.goto(HTML)
    await pg.wait_for_function("window.ready === true")
    for i in idx:
        await pg.evaluate(f"window.render({i/FPS})")
        await pg.screenshot(path=f"{OUT}/f{i:05d}.jpg",type="jpeg",quality=92)
    await b.close()
async def main():
    os.makedirs(OUT,exist_ok=True)
    if sys.argv[1]=="test":
        times=[float(x) for x in sys.argv[2:]]
        idx=[round(t*FPS) for t in times]
        async with async_playwright() as p:
            await worker(p,idx)
        print("test done",idx)
    else:
        n=int(sys.argv[2]) if len(sys.argv)>2 else 4
        total=DUR*FPS
        parts=[list(range(k,total,n)) for k in range(n)]
        async with async_playwright() as p:
            await asyncio.gather(*[worker(p,pt) for pt in parts])
        print("frames:",len(os.listdir(OUT)))
asyncio.run(main())
