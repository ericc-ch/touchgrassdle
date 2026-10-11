# Snapdle: hot/cold (DEV touch grass entry)

name picked 2026-10-09; "photo hunt" was the working name.
daily hidden-prompt photo game, like contexto but with your camera. you go outside and shoot things, each photo tells you how close you are to the secret prompt, plus a small clue. web app.

entry for DEV Hacktoberfest Open-Source AI Challenge week 1, theme "Touch Grass".
deadline sun oct 11 11:59pm PDT = mon oct 12 13:59 WIB.
challenge: https://dev.to/challenges/hacktoberfest-week1-2026-10-05
hub (weeks 2-4): https://dev.to/challenges/hf26

## how it plays

- one hidden prompt a day, same for everyone worldwide
- prompts are concepts that exist anywhere, no regions: "something red and round", "a shadow that looks like an animal", "three of the same thing", "something older than you"
- 6 photos max. each one gets a closeness score (hot/cold) and a short clue nudging you toward the prompt
- hit the threshold = solved, prompt revealed
- share card: 6 temperature squares (cold to hot), no photos
- no chat UI. AI is the judge and the clue giver, not the interface

## models (decided 2026-10-08 ~23:58 WIB)

- scorer: siglip2-b16-224 q4f16 on-device in the browser via transformers.js (apache 2.0, ~55mb, ~0.5s/img). image vs hidden prompt cosine, mapped to 0-100 with a fixed logistic: score = 100/(1+exp(-(cos-c)/w)), c=0.0669 w=0.0262. avoid its q8 build (degrades). photos never leave the device.
- dropped eg2-hosted-as-default. no provider hosts embeddinggemma 2 yet, free or paid (HF Inference Providers empty, Vertex "coming soon", Cloudflare/DeepInfra only text-only v1 embeddinggemma-300m, Gemini API doesn't list it). checked 2026-10-08.
- free HF CPU hardware no longer allows new Gradio/Docker Spaces (need PRO); only static Spaces free. free route left is a ZeroGPU Space (account must be 30+ days old with verified email; GPU time charged to each caller's daily quota: 2 min anon / 5 min free / 40 min PRO; call from browser via @gradio/client). template: https://huggingface.co/spaces/google/embedding-draw-challenge (uses model.encode({"image": img}, normalize_embeddings=True)).
- random public Space https://huggingface.co/spaces/misukisu/embeddinggemma-2-api serves EG2 image embeddings (9-15s/image on 2 CPU, CLS-style pooling not the official mean pooling, could vanish); test-only.
- stretch only ("gemma mode", only if time remains after the game is done, for the Gemma featured category): embeddinggemma 2 (google, released 2026-10-06, apache 2.0, natively multimodal, 768-d). same logistic with c=0.6578 w=0.0338 at 70 soft tokens, query prefix "task: search result | query: ". on-device via transformers.js onnx-community/embeddinggemma-2-ONNX (~255mb q4f16 / ~316mb q4, ~3.4s/img wasm at 70 tok) or ZeroGPU Space host.
- accuracy: spike on 122 photos gave SigLIP 2 97% pairwise, EG2 97%, MobileCLIP S0 fp16 96%. EG2 ties but is ~255-316MB at 4-bit vs ~55MB. mobileclip-s0 fp16 is accurate at 23mb but apple research-only license, skip.
- other fallback: gemini-embedding-2 free tier (image input, unpublished limits, free tier data used for training). closed; kills the open story, keep as last resort only.
- precompute prompt text embeddings at build time, ship as json
- clues: still a handwritten clue bank tiered by temperature, picked by the current score. no runtime llm
- spike numbers (15 prompts x 122 photos, 1830 graded pairs, human-order agreement): embeddinggemma 2 0.979, siglip 2 q4f16 0.972, siglip v1 0.970, mobileclip-s0 0.968, clip b32 0.938. all overlap within error. full writeup on eous box /workspace/photo-hunt-spike/RESULTS.md

### prompts: what breaks every model

- stop sign vs red fire hydrant scores 84-98
- abstract ("something cozy"), color+shape combos ("something red and round"), counting (three dogs ~ two dogs), small objects in clutter
- use concrete single things: exit sign, clock, bicycle, potted plant, flowering tree, sleeping cat, car of one color

## cheating

local model means anyone can fake it. doesn't matter, it's a game for fun.

- no global leaderboard, friends only
- light friction: any photo, from the native camera or the gallery

## prior art (cite in post)

- kaptr (kaptr.app): daily prompt, ai scores 0-100, share card. visible prompt, no hot/cold. reason we pivoted
- I, Spy (jamesg.blog/2023/08/01/webispy-game): 60-min toy, visible prompt photo, server CLIP, warmer/colder vs last guess
- week 1 entries: touch grass bingo (openclip server), tuft (siglip on phone), goseek (smolvlm riddle), color loop, duelo de fotos. none do hidden prompt + hot/cold
- pixle (github francisphn/Pixle): empty repo, tagline only

## why open (for the post)

- photos stay on the device. people shoot their street, house, kids. a closed api uploads every photo
- free to run so the game stays free. paid vision api costs per guess, and hot/cold means 6 guesses a day per player
- works offline after first load
- control the judge: calibrate siglip thresholds per prompt, model doesn't change under you
- compare against one closed api with real numbers: cost per 1000 photos, latency, photos uploaded or not
- airplane-mode clip in the demo

## judging (from the challenge)

writing quality weighted most. then relevance (open AI at the core, gets people off the screen), creativity, technical execution. bonus for taking it outside and saying how it went.

## prizes

overall $250. featured $200 each: gemma (build-time clue drafting), render / digitalocean are featured too (hosting; render wants it as ai runtime or agent front end, static hosting is weak). partner $100. one project can enter every category it uses, wins once.

## risks

- on-device siglip download on mobile data (~55mb). cache it, show progress
- if stretch gemma mode is built: ~255-316mb download, or ZeroGPU quota/cold start when hosted. do not block the game on it
- spike found one fixed curve per model works; per-prompt reference calibration gave no gain
- abstract prompts ("older than you") may score poorly with siglip. pick prompts siglip handles, test on day 1

## backup idea

ghost racer: replays your last run's pace as 3D footsteps ahead or behind you. no screen. candidate for week 2.
