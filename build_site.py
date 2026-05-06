#!/usr/bin/env python3
import os
import shutil
import re
import json
from pathlib import Path

# Paths
root_dir = Path('/Users/tfl/Documents/GitHub/Teaching-Archives')
source_dirs = ['Grammar', 'Reading', 'Writing', 'Listening', 'Quizzes']
site_dir = root_dir / '_site'
layout_file = root_dir / '_layouts' / 'default.html'

# Read layout template
with open(layout_file, 'r') as f:
    layout = f.read()

# Extract the part before {{ content }}
layout_before = layout.split('{{ content }}')[0]
layout_after = layout.split('{{ content }}')[1]

def extract_front_matter(content):
    """Extract YAML front matter from a file"""
    if not content.startswith('---'):
        return {}, content
    
    match = re.match(r'^---\n(.*?)\n---\n(.*)$', content, re.DOTALL)
    if not match:
        return {}, content
    
    fm_text = match.group(1)
    body = match.group(2)
    
    fm = {}
    for line in fm_text.split('\n'):
        if ':' in line:
            key, value = line.split(':', 1)
            fm[key.strip()] = value.strip().strip('"').strip("'")
    
    return fm, body

def replace_in_layout(layout_str, fm, page_url='/'):
    """Replace template variables and Jekyll conditionals in layout"""
    title = fm.get('title', 'Page')
    icon = fm.get('icon', '')
    subtitle = fm.get('subtitle', '')
    
    # Replace template variables first
    result = layout_str.replace('{{ page.title }}', title)
    
    # Handle icon conditional: {% if page.icon %}{{ page.icon }} {% endif %}
    if icon:
        result = result.replace('{% if page.icon %}{{ page.icon }} {% endif %}', icon + ' ')
    else:
        result = result.replace('{% if page.icon %}{{ page.icon }} {% endif %}', '')
    
    # Handle subtitle conditional block
    if subtitle:
        # Replace the entire conditional block with just the subtitle
        result = re.sub(
            r'\{%\s*if\s+page\.subtitle\s*%\}\s*<h2[^>]*>\{\{[^}]*page\.subtitle[^}]*\}\}</h2>\s*\{%\s*endif\s*%\}',
            f'<h2 style="color: #64748b; font-size: 1.8em; font-weight: 500;">{subtitle}</h2>',
            result,
            flags=re.DOTALL
        )
    else:
        # Remove the entire subtitle conditional block
        result = re.sub(
            r'\{%\s*if\s+page\.subtitle\s*%\}.*?\{%\s*endif\s*%\}',
            '',
            result,
            flags=re.DOTALL
        )
    
    # Handle back button conditional - remove it (we handle this separately)
    result = re.sub(
        r'\{%\s*if\s+page\.url.*?endif\s*%\}',
        '',
        result,
        flags=re.DOTALL
    )
    
    return result

def collect_resources():
    """Collect all lesson resources and their metadata"""
    resources = []
    
    for dir_name in source_dirs:
        source_subdir = root_dir / dir_name
        for file in sorted(source_subdir.glob('*.html')):
            with open(file, 'r') as f:
                content = f.read()
            fm, _ = extract_front_matter(content)
            
            if fm.get('title') and fm.get('category'):
                url_path = f"/{dir_name}/{file.name}".replace(' ', '%20')
                resources.append({
                    'title': fm['title'],
                    'category': fm['category'],
                    'icon': fm.get('icon', '📄'),
                    'url': url_path
                })
    
    return sorted(resources, key=lambda x: x['title'])

def copy_and_process_files():
    """Copy files from source to _site and process layouts"""
    
    # Collect all resources first
    resources = collect_resources()
    
    # Remove and recreate _site
    if site_dir.exists():
        shutil.rmtree(site_dir)
    site_dir.mkdir()
    
    # Process root HTML files
    print("Processing root files...")
    for file in root_dir.glob('*.html'):
        if file.name == 'index.html':
            with open(file, 'r') as f:
                content = f.read()
            fm, body = extract_front_matter(content)
            
            # Generate resources array JavaScript
            resources_js = "    const resources = [\n"
            for res in resources:
                resources_js += f"        {{\n"
                resources_js += f"            title: {json.dumps(res['title'])},\n"
                resources_js += f"            category: {json.dumps(res['category'])},\n"
                resources_js += f"            icon: {json.dumps(res['icon'])},\n"
                resources_js += f"            file: {json.dumps(res['url'])}\n"
                resources_js += f"        }},\n"
            resources_js += "    ];"
            
            # Replace Jekyll template with generated JavaScript
            body_processed = re.sub(
                r'const resources = \[[\s\S]*?\];',
                lambda m: resources_js,
                body
            )
            
            # Process with layout
            before = replace_in_layout(layout_before, fm, page_url='/')
            final_html = before + body_processed + layout_after
            
            with open(site_dir / file.name, 'w') as f:
                f.write(final_html)
            print(f"✓ {file.name} (with {len(resources)} resources)")
    
    # Copy other root files (non-HTML)
    for file in root_dir.glob('*'):
        if file.is_file() and file.name not in ['index.html', 'Gemfile', 'convert.py', 'convert_quizzes.py', 'build_site.py']:
            shutil.copy2(file, site_dir / file.name)
    
    # Process lesson files in subdirectories
    for dir_name in source_dirs:
        source_subdir = root_dir / dir_name
        site_subdir = site_dir / dir_name
        site_subdir.mkdir(exist_ok=True)
        
        print(f"\nProcessing {dir_name}/...")
        for file in sorted(source_subdir.glob('*.html')):
            with open(file, 'r') as f:
                content = f.read()
            
            fm, body = extract_front_matter(content)
            page_url = f"/{dir_name}/{file.name}"
            
            # Process with layout
            before = replace_in_layout(layout_before, fm, page_url=page_url)
            final_html = before + '<div class="nav-bar"><a href="/" class="back-btn">← Back to Home</a></div>' + body + layout_after
            
            with open(site_subdir / file.name, 'w') as f:
                f.write(final_html)
            print(f"  ✓ {file.name}")
    
    print("\n✨ Build complete! All files processed to _site/")


if __name__ == '__main__':
    copy_and_process_files()
