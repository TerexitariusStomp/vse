#!/usr/bin/env python3
"""Record the VSE demo walkthrough video.

CDP Page.startScreencast (server-pushed compositor frames) + espeak-ng
narration per section + ffmpeg mux. An injected CSS animation keeps the
compositor producing frames even on static pages.

Needs a Chrome-family browser on CDP http://localhost:9222.

Output: docs/hackathon/demo-assets/walkthrough.mp4 + walkthrough.srt
"""
import base64, json, os, re, subprocess, threading, time, websocket

# system ffmpeg (Fedora) lacks libx264 — prefer the imageio-ffmpeg static
# build which ships it; fall back to PATH.
try:
    import imageio_ffmpeg
    FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
except Exception:
    FFMPEG = "ffmpeg"

BASE = "https://vse-demonstrator.pages.dev"
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   "docs", "hackathon", "demo-assets")
TMP = "/tmp/vse-video"
W, H, QUALITY = 1920, 1080, 62

# (name, [(path, mode)], narration for espeak-ng + srt)
# modes: scroll | story | signal | check | capital | utopia | thread | None
SECTIONS = [
    ("01-landing", [("/", "scroll")], """Every place knows what it needs.
The Value Structuring Engine turns the stories a place tells into signals
it has checked, and the signals into capital legibility. This is the live
deployment — ten places, a hundred ninety one stories, not one
paraphrased."""),
    ("02-thorntree", [("/thorntree", "diorama")], """Thorntree, a council
estate in east Middlesbrough. Beside its own words sits the official
record: deprivation decile one, thirty four flood risk areas within
fifteen kilometres, tool library vouchers on the ledger."""),
    ("03-stories", [("/thorntree#stories", "story")], """The stories arrive
as records — hub notes, vouchers, plan documents, public posts.
Underlined passages are the exact excerpts the engine kept. Provenance
chips name the record. A public post links back to itself."""),
    ("04-signals", [("/thorntree#signals", "signal")], """Excerpts
consolidate into a handful of signals. Open one and it shows the exact
words behind it — tap a quote and it lands highlighted inside its story.
Every claim is a mechanical slice of the source text. The validator
rejects anything else."""),
    ("05-check", [("/thorntree#check", "check")], """Nothing guides capital
until the people who told the stories have checked it. Endorse, amend,
contest — and a gate: may be priced, commons only, or not yet. Commons is
not price zero. It is a category the system structurally cannot
price."""),
    ("06-capital", [("/thorntree#capital", "capital")], """The same
verified signals, structured two ways. From the plans: one project per
need. From the place: interventions answering several at once — and the
view names what it leaves out. Intervention points mark where the system
could tip."""),
    ("07-utopia", [("/utopia", "utopia")], """One place is fictional, and
says so everywhere. Its diorama carries eight generated voices — press
listen and hear the hill farmer, or the elder's story told in
Welsh."""),
    ("08-scale", [("/nairobi", "diorama")], """Four of the ten places are
founded entirely on public posts — Nairobi, Detroit, Minneapolis, Puerto
la Cruz — attributed to channel, never to a person. A new place ships as
a results file, not a codebase change."""),
    ("09-thread", [("/", "thread")], """Follow one sentence end to end: we
need marsh reeds and planting days volunteers becomes a signal the place
checked, becomes a marsh regeneration scheme a funder can answer. The
schema, the validator, and every place spec are in the public
repo."""),
]

# keeps the compositor emitting frames on static pages
PULSE = """(() => {
  if (document.getElementById('__cap')) return true;
  const d = document.createElement('div');
  d.id = '__cap';
  d.style.cssText = 'position:fixed;left:0;top:0;width:4px;height:4px;'
    + 'z-index:2147483647;pointer-events:none;opacity:.01;';
  d.animate([{background:'#000'},{background:'#111'}],
    {duration:200,iterations:Infinity});
  document.body.appendChild(d); return true;
})()"""

# per-mode prep actions run once the page has settled
JS_FIRST_STORY = (
    "(()=>{const b=document.querySelector('#stories ol li button');"
    "if(b&&b.getAttribute('aria-expanded')!=='true')b.click();return !!b})()")
JS_FIRST_SIGNAL = (
    "(()=>{const b=document.querySelector('#signals ol li > button');"
    "if(b&&b.getAttribute('aria-expanded')!=='true')b.click();return !!b})()")
JS_SIGNAL_QUOTE = (
    "(()=>{const b=document.querySelector('#signals ol li figure blockquote button');"
    "if(b){b.click();return true}return false})()")
JS_ENDORSE = (
    "(()=>{const g=document.querySelector("
    "'#check [role=\"group\"][aria-label=\"Your response\"]');if(!g)return false;"
    "const b=[...g.querySelectorAll('button')]"
    ".find(x=>x.textContent.trim()==='endorse');if(b)b.click();return !!b})()")
JS_PLANS_VIEW = (
    "(()=>{const b=[...document.querySelectorAll('#capital button')]"
    ".find(x=>x.textContent.trim()==='From the plans');"
    "if(b)b.click();return !!b})()")
JS_PLACE_VIEW = (
    "(()=>{const b=[...document.querySelectorAll('#capital button')]"
    ".find(x=>x.textContent.trim()==='From the place');"
    "if(b)b.click();return !!b})()")
JS_DIORAMA = (
    "(()=>{const c=[...document.querySelectorAll('#place canvas')];"
    "const d=c[c.length-1];if(d)d.scrollIntoView({block:'center',"
    "behavior:'instant'});return !!d})()")
JS_TELLER = (
    "(()=>{const g=document.querySelector('[aria-label=\"Storytellers\"]');"
    "if(!g)return false;const b=g.querySelectorAll('button')[0];"
    "if(b)b.click();return !!b})()")
JS_LISTEN = (
    "(()=>{const b=[...document.querySelectorAll('button')]"
    ".find(x=>x.textContent.trim()==='Listen');if(b)b.click();return !!b})()")
JS_THREAD = (
    "(()=>{const t=document.getElementById('thread');"
    "if(t)t.scrollIntoView({behavior:'instant'});return !!t})()")

os.makedirs(TMP, exist_ok=True)
os.makedirs(OUT, exist_ok=True)

tab = json.loads(subprocess.check_output(
    ["curl", "-s", "-X", "PUT", "http://localhost:9222/json/new?about:blank"]))
ws = websocket.create_connection(tab["webSocketDebuggerUrl"], timeout=90,
                                 suppress_origin=True)

_mid, _results, _frames = [0], {}, []
_lock = threading.Lock()
_stop = threading.Event()

def reader():
    while not _stop.is_set():
        try:
            r = json.loads(ws.recv())
        except Exception:
            break
        if "id" in r:
            _results[r["id"]] = r.get("result", {})
        elif r.get("method") == "Page.screencastFrame":
            p = r["params"]
            _frames.append((p["metadata"]["timestamp"], p["data"]))
            send("Page.screencastFrameAck",
                 {"sessionId": p["sessionId"]}, wait=False)

def send(method, params=None, wait=True):
    with _lock:
        _mid[0] += 1
        i = _mid[0]
    ws.send(json.dumps({"id": i, "method": method, "params": params or {}}))
    if not wait:
        return None
    t0 = time.time()
    while i not in _results and time.time() - t0 < 60:
        time.sleep(0.01)
    return _results.pop(i, {})

def ev(expr):
    return send("Runtime.evaluate", {"expression": expr,
                                     "returnByValue": True,
                                     "awaitPromise": True
                                     }).get("result", {}).get("value")

threading.Thread(target=reader, daemon=True).start()
send("Emulation.setDeviceMetricsOverride",
     {"width": W, "height": H, "deviceScaleFactor": 1, "mobile": False})

def scroll_steps(page_dur, start_at):
    n = max(2, int(page_dur / 6))
    return [(start_at + i * (page_dur / n), "js",
             f"window.scrollBy({{top:{350 if i < n-1 else -99999},"
             "behavior:'smooth'}})") for i in range(n)]

def record(dur, steps):
    """Capture screencast frames for `dur` s while running timed steps."""
    _frames.clear()
    send("Page.startScreencast",
         {"format": "jpeg", "quality": QUALITY,
          "maxWidth": W, "maxHeight": H, "everyNthFrame": 1})
    t0, si = time.time(), 0
    while time.time() - t0 < dur:
        el = time.time() - t0
        while si < len(steps) and el >= steps[si][0]:
            kind, arg = steps[si][1], steps[si][2]
            if kind == "nav":
                send("Page.navigate", {"url": BASE + arg}, wait=False)
            elif kind == "js":
                ev(arg)
            si += 1
        ev(PULSE)          # keep frames flowing during static stretches
        time.sleep(0.4)
    send("Page.stopScreencast")
    time.sleep(0.5)
    return list(_frames), time.time() - t0

def mode_steps(mode, per):
    """Timed in-page beats for one (path, mode) leg."""
    t = 3.2  # let results.json load + hash scroll fire
    if mode == "scroll":
        return scroll_steps(per - 4.0, t)
    if mode == "story":
        return [(t, "js", JS_FIRST_STORY)] + scroll_steps(per - 8, t + 3)
    if mode == "signal":
        return [(t, "js", JS_FIRST_SIGNAL),
                (t + per * 0.55, "js", JS_SIGNAL_QUOTE)]
    if mode == "check":
        return [(t, "js", JS_ENDORSE)] + scroll_steps(per - 9, t + 3.5)
    if mode == "capital":
        return [(t, "js", JS_PLANS_VIEW),
                (t + per * 0.45, "js", JS_PLACE_VIEW)]
    if mode == "diorama":
        return [(t, "js", JS_DIORAMA)]
    if mode == "utopia":
        # keep the clicks inside the first ~80% — `-shortest` trims each
        # segment to narration length, which is ~1.5s short of `dur`
        return [(t, "js", JS_DIORAMA),
                (t + per * 0.30, "js", JS_TELLER),
                (t + per * 0.55, "js", JS_LISTEN)]
    if mode == "thread":
        return [(t, "js", JS_THREAD)]
    return []

def srt_ts(sec):
    h = int(sec // 3600); m = int((sec % 3600) // 60); s = sec % 60
    return f"{h:02d}:{m:02d}:{s:06.3f}".replace(".", ",")

segs, cues, cursor = [], [], 0.0
for name, pages, narration in SECTIONS:
    wav = f"{TMP}/{name}.wav"
    subprocess.run(["espeak-ng", "-v", "en-us", "-s", "145", "-p", "30",
                    "-w", wav, narration], check=True)
    adur = float(subprocess.check_output(
        ["ffprobe", "-v", "quiet", "-show_entries", "format=duration",
         "-of", "csv=p=0", wav]).strip())
    dur = adur + 1.5
    per = dur / len(pages)
    steps = [(0.0, "nav", pages[0][0])]
    for i, (path, mode) in enumerate(pages):
        if i > 0:
            steps.append((i * per, "nav", path))
        steps += mode_steps(mode, per)
    steps.sort(key=lambda s: s[0])
    print(f"[{name}] audio {adur:.1f}s -> record {dur:.1f}s", flush=True)
    frames, actual = record(dur, steps)
    sdir = f"{TMP}/{name}"
    os.makedirs(sdir, exist_ok=True)
    # write frames at their real timestamps via a concat-demuxer image list
    lst = f"{sdir}/frames.txt"
    with open(lst, "w") as f:
        tbase = frames[0][0] if frames else 0
        prev = 0.0
        for i, (ts, data) in enumerate(frames):
            fp = f"{sdir}/f{i:05d}.jpg"
            open(fp, "wb").write(base64.b64decode(data))
            d = max(0.001, ts - tbase - prev) if i else 0.001
            prev = ts - tbase
            f.write(f"file '{fp}'\nduration {d:.3f}\n")
        if frames:
            f.write(f"file '{sdir}/f{len(frames)-1:05d}.jpg'\n")
    seg = f"{TMP}/{name}.mp4"
    subprocess.run(
        [FFMPEG, "-y", "-f", "concat", "-safe", "0", "-i", lst,
         "-i", wav, "-t", f"{actual:.2f}",
         "-vf", f"scale={W}:{H}:force_original_aspect_ratio=decrease,"
                f"pad={W}:{H}:(ow-iw)/2:(oh-ih)/2,fps=25",
         "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "fast",
         "-crf", "21",
         "-c:a", "aac", "-b:a", "128k",
         "-shortest", seg], check=True, capture_output=True)
    segs.append(seg)
    # -shortest cuts the segment to the narration length — measure the
    # real muxed duration so srt cues land on the actual video timeline.
    probe = subprocess.run([FFMPEG, "-hide_banner", "-i", seg],
                           capture_output=True, text=True).stderr
    m = re.search(r"Duration: (\d+):(\d+):(\d+\.\d+)", probe)
    seg_dur = (int(m.group(1)) * 3600 + int(m.group(2)) * 60
               + float(m.group(3))) if m else adur
    cues.append((cursor, cursor + seg_dur, " ".join(narration.split())))
    cursor += seg_dur
    print(f"  {len(frames)} frames over {actual:.1f}s -> {seg}"
          f" (seg {seg_dur:.1f}s)", flush=True)

lst = f"{TMP}/concat.txt"
open(lst, "w").write("".join(f"file '{s}'\n" for s in segs))
final = f"{OUT}/walkthrough.mp4"
subprocess.run([FFMPEG, "-y", "-f", "concat", "-safe", "0", "-i", lst,
                "-c", "copy", final], check=True, capture_output=True)

srt = f"{OUT}/walkthrough.srt"
with open(srt, "w") as f:
    for i, (a, b, text) in enumerate(cues, 1):
        f.write(f"{i}\n{srt_ts(a)} --> {srt_ts(b)}\n{text}\n\n")

print("DONE:", final)
subprocess.run(["ffprobe", "-v", "quiet", "-show_entries",
                "format=duration,size", "-of", "default=nw=1", final])
_stop.set()
ws.close()
