"""Run inside the chatterbox venv. python chatterbox_gen.py <jobs.json> <out_dir>
jobs: [{"id": "s3p1_seed7", "text": "...", "seed": 7}, ...]  Settings = sample 'B' (exaggeration 0.4, cfg 0.35)."""
import sys, json, torch, torchaudio as ta
from chatterbox.tts import ChatterboxTTS
jobs = json.load(open(sys.argv[1])); out = sys.argv[2]
model = ChatterboxTTS.from_pretrained(device="cpu")
for j in jobs:
    torch.manual_seed(j["seed"]); w = model.generate(j["text"], exaggeration=0.4, cfg_weight=0.35)
    ta.save(f"{out}/{j['id']}.wav", w, model.sr); print("done", j["id"], round(w.shape[-1] / model.sr, 1), flush=True)
