import os
import re

targets = [
    r"c:\VIT\Placements\Hackathon\AlgorithmX\AI-Driven-Autonomous-Recruitment-and-Candidate-Assesment-System-main\backend\ai_interview_bot\code_router.py",
    r"c:\VIT\Placements\Hackathon\AlgorithmX\AI-Driven-Autonomous-Recruitment-and-Candidate-Assesment-System-main\backend\ai_interview_bot\services\sarvam_service.py",
    r"c:\VIT\Placements\Hackathon\AlgorithmX\AI-Driven-Autonomous-Recruitment-and-Candidate-Assesment-System-main\backend\candidate_profile\routes.py",
    r"c:\VIT\Placements\Hackathon\AlgorithmX\AI-Driven-Autonomous-Recruitment-and-Candidate-Assesment-System-main\backend\resume_parsing\utils.py"
]

for path in targets:
    if not os.path.exists(path):
        continue
    with open(path, "r", encoding="utf-8") as f:
        data = f.read()

    original = data

    # Replace print( with logger.info(
    # Only simple print(...) that doesn't span multiple complex lines.
    # We will use re.sub for any print(...)
    data = re.sub(r'\bprint\(', 'logger.info(', data)

    if original != data:
        # Check if logging is imported
        if "import logging" not in data:
            data = "import logging\n\nlogger = logging.getLogger(__name__)\n\n" + data
        elif "logger = logging.getLogger" not in data:
            # Maybe it uses some other logger, or just imported logging. Let's just add the logger.
            data = re.sub(r'import logging\n', 'import logging\nlogger = logging.getLogger(__name__)\n', data)

        with open(path, "w", encoding="utf-8") as f:
            f.write(data)
        print("Cleaned " + path)
