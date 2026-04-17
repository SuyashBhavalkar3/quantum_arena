import os
import re

base_dir = r"c:\VIT\Placements\Hackathon\AlgorithmX\AI-Driven-Autonomous-Recruitment-and-Candidate-Assesment-System-main\frontend"

def clean_file(path):
    with open(path, "r", encoding="utf-8") as f:
        data = f.read()

    new_data = re.sub(r'<Sparkles\b[^>]*/>', '', data)
    new_data = re.sub(r'\bSparkles,\s*', '', new_data)
    new_data = re.sub(r'import\s*\{\s*\}\s*from\s*[\'"]lucide-react[\'"];?\s*\n', '', new_data)

    if new_data != data:
        with open(path, "w", encoding="utf-8") as f:
            f.write(new_data)
        print("Cleaned " + path)

for root, _, files in os.walk(base_dir):
    for fn in files:
        if fn.endswith(".tsx") or fn.endswith(".ts"):
            clean_file(os.path.join(root, fn))
