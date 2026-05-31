import re

pages = [
    'frontend/src/pages/MyBookings.jsx',
    'frontend/src/pages/Notifications.jsx',
]

for fp in pages:
    with open(fp, 'r', encoding='utf-8') as f:
        c = f.read()

    # 1. Restore root div to simple minHeight:100vh
    c = re.sub(
        r"backgroundColor: 'var\(--background\)', height: '100vh', display: 'flex', flexDirection: 'column'",
        "backgroundColor: 'var(--background)', minHeight: '100vh'",
        c
    )

    # 2. Remove the scroll wrapper div (the one after Navbar with flex:1 overflowY)
    c = re.sub(
        r"\n\n      \{/\* Scrollable middle content \*/\}\n      <div style=\{\{ flex: 1, overflowY: 'auto' \}\}>\n\n",
        "\n\n",
        c
    )

    # 3. Remove the closing </div>{/* end scrollable content */} line
    c = c.replace('      </div>{/* end scrollable content */}\n      <Footer />', '      <Footer />')
    
    # Also handle Notifications variant
    c = c.replace('      </div>{/* end notifications list */}\n      </div>{/* end scrollable content */}\n      <Footer />', '      </div>\n      <Footer />')

    with open(fp, 'w', encoding='utf-8') as f:
        f.write(c)
    print(f'Fixed: {fp}')

print('Done.')
