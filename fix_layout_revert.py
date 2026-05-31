import re

# Pages to fully REVERT (remove height 100vh, remove extra wrapper)
revert_pages = [
    'frontend/src/pages/Booking.jsx',
    'frontend/src/pages/Profile.jsx',
    'frontend/src/pages/Dashboard.jsx',
]

for fp in revert_pages:
    with open(fp, 'r', encoding='utf-8') as f:
        c = f.read()

    # 1. Restore root div - replace height:100vh broken version with minHeight
    c = re.sub(
        r"backgroundColor: 'var\(--background\)', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden'",
        "backgroundColor: 'var(--background)', minHeight: '100vh'",
        c
    )

    # 2. Remove the extra scroll wrapper div added after header comment
    # It was inserted as: flex:1, overflowY line + {/* Header */}
    c = re.sub(
        r"<div style=\{\{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' \}\}>\n      \{/\* Header \*/\}",
        '{/* Header */}',
        c
    )
    
    # Also handle case without the comment (Dashboard)
    c = re.sub(
        r"<Navbar />\n\n      <div style=\{\{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' \}\}>\n      ",
        "<Navbar />\n\n      ",
        c
    )

    # 3. Remove the extra </div> before Footer  
    # We changed Footer + </div> to Footer + </div> + </div>
    c = re.sub(
        r'<Footer />\n      </div>\n    </div>',
        '<Footer />\n    </div>',
        c
    )
    
    # Also handle extra div at bottom added for pages without footer pattern
    # Pattern: the last two </div> before ) }  export
    # Check if we have a stray extra </div> near the end
    # (for Dashboard which may not have Footer)

    with open(fp, 'w', encoding='utf-8') as f:
        f.write(c)
    print(f'Reverted: {fp}')

print('Done reverting pages.')
