import sys

filepath = 'frontend/src/pages/Booking.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for idx, line in enumerate(lines):
    if "overflowY: 'auto'" in line:
        # Check if it appears twice and fix it if so. But wait, what if it's on line 46?
        pass
    new_lines.append(line)

# Let me print line 46 and line 446.
print("Line 46:", lines[45])
print("Line 446:", lines[445])
