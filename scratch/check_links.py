import os
import re
from pathlib import Path

root_dir = Path('.')
html_files = list(root_dir.glob('**/*.html'))

for html_file in html_files:
    if '_site' in str(html_file):
        continue
    
    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find all links
    links = re.findall(r'href=["\'](.*?)["\']', content)
    
    for link in links:
        if link.startswith('http') or link.startswith('#') or link.startswith('mailto:'):
            continue
        
        # Check relative link
        link_path = (html_file.parent / link).resolve()
        
        # Strip query params/anchors
        link_path = Path(str(link_path).split('#')[0].split('?')[0])
        
        if not link_path.exists():
            # Try appending .html
            if not link_path.with_suffix('.html').exists():
                print(f"Broken link in {html_file.relative_to(root_dir)}: {link}")
