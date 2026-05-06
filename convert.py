import os
import re

directories = ['Grammar', 'Listening', 'Reading', 'Writing', 'Quizzes']
base_dir = '/Users/tfl/Documents/GitHub/Teaching-Archives'

for d in directories:
    dir_path = os.path.join(base_dir, d)
    if not os.path.exists(dir_path):
        continue
    for root, dirs, files in os.walk(dir_path):
        for file in files:
            if file.endswith('.html'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Extract title
                title_match = re.search(r'<title>(.*?)</title>', content)
                title = title_match.group(1) if title_match else file.replace('.html', '')
                
                # Try to extract subtitle if present
                subtitle_match = re.search(r'<h1 style=".*?">(.*?)</h1>', content)
                subtitle_frontmatter = f'\nsubtitle: "{subtitle_match.group(1)}"' if subtitle_match and '聆聽考試策略' in subtitle_match.group(1) else ''

                # Try to extract the h1 title instead of the <title> tag for better naming
                h1_match = re.search(r'<h1>(?:.*?(?:🎧|📖|✍️|🧩|📝)\s*)?(.*?)(?:</h1>)', content)
                if h1_match:
                    h1_title = re.sub(r'<.*?>', '', h1_match.group(1)).strip()
                    if h1_title:
                        title = h1_title

                # Define icon based on category
                icon = ""
                if d == "Grammar": icon = "🧩"
                elif d == "Reading": icon = "📖"
                elif d == "Writing": icon = "✍️"
                elif d == "Listening": icon = "🎧"
                elif d == "Quizzes": icon = "📝"

                # Extract everything inside <div class="content">
                content_start = content.find('<div class="content">')
                if content_start != -1:
                    content_start += len('<div class="content">')
                    
                    body_end = content.find('</body>')
                    if body_end == -1:
                        body_end = len(content)
                    
                    last_div = content.rfind('</div>', content_start, body_end)
                    second_last_div = content.rfind('</div>', content_start, last_div - 1)
                    
                    if second_last_div != -1:
                        main_content = content[content_start:second_last_div].strip()
                    else:
                        main_content = content[content_start:last_div].strip()
                        
                    # Also keep any script tags that might be at the end of the file
                    # like the one in Tenses.html
                    script_start = content.find('<script>', last_div)
                    if script_start != -1 and script_start < body_end:
                        script_end = content.find('</script>', script_start) + 9
                        main_content += '\n\n' + content[script_start:script_end]

                else:
                    # Fallback
                    main_content = content

                # Remove any leftover inline scripts that disable right-click 
                # (since it's now in the default template)
                main_content = re.sub(r'<script>\s*// Disable right-click.*?// Optional: Disable text drag\s*document.addEventListener\(\'dragstart\', event => event.preventDefault\(\)\);\s*</script>', '', main_content, flags=re.DOTALL)
                main_content = re.sub(r'<script>.*?</script>', '', main_content, flags=re.DOTALL) if 'function switchTense' not in main_content else main_content # Don't strip logic scripts like tenses

                # Escape quotes in title
                title_escaped = title.replace('"', '\\"')

                front_matter = f'---\nlayout: default\ntitle: "{title_escaped}"\ncategory: "{d}"\nicon: "{icon}"{subtitle_frontmatter}\n---\n\n'
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(front_matter + main_content)

print("Conversion complete.")
