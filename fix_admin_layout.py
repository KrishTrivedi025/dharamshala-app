import sys
import glob
import re

files = glob.glob('frontend/src/pages/admin/*.jsx')
for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Modify AdminSidebar
    if 'AdminDashboard.jsx' in filepath:
        content = re.sub(r'minHeight:\s*\'100vh\',\s*padding:\s*\'32px 16px\',\s*position:\s*\'sticky\',\s*top:\s*0', r"height: '100vh', overflowY: 'auto', padding: '32px 16px'", content)
        
    # Modify the parent div for all admin pages
    content = re.sub(r'<div style=\{\{\s*display:\s*\'flex\',\s*minHeight:\s*\'100vh\'(.*?)>\s*<AdminSidebar\s*/>', r"<div style={{ display: 'flex', height: '100vh', overflow: 'hidden'\g<1>><AdminSidebar />", content, flags=re.DOTALL)
    
    # Modify the content area overflow
    # <div style={{ flex: 1, padding: '40px 36px', overflowY: 'auto' }}>
    content = re.sub(r'<div style=\{\{\s*flex:\s*1,\s*padding:\s*\'(\w+ \w+)\'(.*?)\}\}>', r"<div style={{ flex: 1, padding: '\g<1>', height: '100vh', overflowY: 'auto'\g<2> }}>", content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Admin pages updated")
