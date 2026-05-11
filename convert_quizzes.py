import os
import re

dir_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'Quizzes')

for root, dirs, files in os.walk(dir_path):
    for file in files:
        if file.endswith('.html'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            # Extract title
            title_match = re.search(r'<title>(.*?)</title>', content)
            title = title_match.group(1) if title_match else file.replace('.html', '')
            
            # Try to extract the h1 title instead of the <title> tag for better naming
            h1_match = re.search(r'<h1>(?:.*?(?:🎧|📖|✍️|🧩|📝)\s*)?(.*?)(?:</h1>)', content)
            if h1_match:
                h1_title = re.sub(r'<.*?>', '', h1_match.group(1)).strip()
                if h1_title:
                    title = h1_title

            # Extract everything from <div class="quiz-container"> or fallback
            content_start = content.find('<div class="quiz-container">')
            if content_start != -1:
                # keep from quiz-container
                pass
            else:
                content_start = content.find('<div class="content">')
            
            if content_start != -1:
                # extract from the start of the container
                body_end = content.find('</body>')
                if body_end == -1:
                    body_end = len(content)
                
                # We want to extract up to the end of the script block
                # There is usually a script block at the end
                script_end = content.rfind('</script>', content_start, body_end)
                if script_end != -1:
                    main_content = content[content_start:script_end + 9].strip()
                else:
                    # just extract up to the last </div>
                    last_div = content.rfind('</div>', content_start, body_end)
                    second_last_div = content.rfind('</div>', content_start, last_div - 1)
                    if second_last_div != -1:
                        main_content = content[content_start:second_last_div].strip()
                    else:
                        main_content = content[content_start:last_div].strip()
            else:
                # Fallback
                main_content = content
                
            # Remove the right-click script if it accidentally got included
            main_content = re.sub(r'<script>\s*// Disable right-click.*?// Optional: Disable text drag\s*document.addEventListener\(\'dragstart\', event => event.preventDefault\(\)\);\s*</script>', '', main_content, flags=re.DOTALL)

            title_escaped = title.replace('"', '\\"')

            front_matter = f'---\nlayout: default\ntitle: "{title_escaped}"\ncategory: "Quizzes"\nicon: "📝"\n---\n\n'
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(front_matter + main_content)

print("Quizzes fixed.")
