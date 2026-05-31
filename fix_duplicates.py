import sys
import glob
import re

files = glob.glob('frontend/src/pages/admin/*.jsx')
for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Clean up duplicate overflowY
    content = re.sub(r'overflowY:\s*\'auto\',\s*overflowY:\s*\'auto\'', r"overflowY: 'auto'", content)
    # same for overflowY:'auto' without spaces
    content = re.sub(r'overflowY:\s*\'auto\',\s*overflowY:\'auto\'', r"overflowY: 'auto'", content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Duplicates cleaned")
