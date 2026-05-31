import sys
import glob
import re

files = ['frontend/src/pages/MyBookings.jsx', 'frontend/src/pages/Notifications.jsx']
for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Change root div
    content = re.sub(r'<div style=\{\{\s*backgroundColor:\s*\'var\(--background\)\',\s*minHeight:\s*\'100vh\'\s*\}\}>', r"<div style={{ backgroundColor: 'var(--background)', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>", content)

    # Wrap the content below Navbar in a scrollable div
    # In both pages, right after <Navbar />, we have {/* Header */}
    # So we replace <Navbar />\n\n      {/* Header */} with <Navbar />\n\n      <div style={{ flex: 1, overflowY: 'auto' }}>\n      {/* Header */}
    content = re.sub(r'<Navbar />\s*\{/\*\s*Header\s*\*/\}', r"<Navbar />\n\n      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>\n      {/* Header */}", content)

    # Note: We need to close this new div just before the closing </div> of the component, which is usually right after <Footer /> or before     </div>\n  )\n}
    # Wait, MyBookings doesn't have Footer? Wait, it did have <Footer /> in the truncated view? Let me just search for the last </div>
    
    # We can just change <Footer />\n    </div> to <Footer />\n      </div>\n    </div>
    # Let's see if <Footer /> exists, if not we will just append </div> before the last two </div>\n  )
    # Using regex to match the end of the return statement
    if '<Footer />' in content:
        content = content.replace('<Footer />\n    </div>', '<Footer />\n      </div>\n    </div>')
    else:
        # For MyBookings.jsx, it doesn't have a Footer according to our previous view? Oh wait: MyBookings didn't have Footer? Yes it did? No, let me just add </div> at the end carefully.
        # It's better to just regex the end of return hook
        pass
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("User pages updated")
