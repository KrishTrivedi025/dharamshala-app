import sys
import re

files = ['frontend/src/pages/Profile.jsx', 'frontend/src/pages/Dashboard.jsx']
for filepath in files:
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Change root div
        content = re.sub(r'<div style=\{\{\s*backgroundColor:\s*\'var\(--background\)\',\s*minHeight:\s*\'100vh\'\s*\}\}>', r"<div style={{ backgroundColor: 'var(--background)', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>", content)

        # Replace <Navbar />\n\n      {/* Header */}
        content = re.sub(r'<Navbar />\s*\{/\*\s*Header\s*\*/\}', r"<Navbar />\n\n      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>\n      {/* Header */}", content)

        if '<Footer />' in content:
            content = content.replace('<Footer />\n    </div>', '<Footer />\n      </div>\n    </div>')
        else:
            # Append the closing div before the very last </div>
            # Using regex to find the last </div>
            idx = content.rfind('</div>')
            if idx != -1:
                content = content[:idx] + '  </div>\n    ' + content[idx:]

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
    except:
        pass

print("User layouts updated")
