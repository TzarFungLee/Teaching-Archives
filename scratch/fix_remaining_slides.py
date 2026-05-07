import os

files_to_fix = [
    ('./Reading/Reading Vocabulary.html', '<table>', 'after'),
    ('./Reading/Tips.html', '</table>', 'after'),
    ('./Reading/Question Types.html', '</table>', 'after'),
    ('./Writing/Text Types.html', '</table>', 'after'),
    ('./Listening/Listening Vocabulary.html', '<table>', 'after')
]

replacement = """
<hr>
<h3>📊 Teaching Slides</h3>
<div style="text-align: center; margin: 30px 0;">
    <a href="https://docs.google.com/presentation/d/e/2PACX-1vQ...placeholder.../pub" target="_blank" class="btn" style="padding: 12px 24px; font-size: 1.1rem;">📖 Open Reading Material</a>
</div>
<hr>
"""

for file_path, anchor, mode in files_to_fix:
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            content = f.read()
        
        if anchor in content:
            if mode == 'after':
                parts = content.split(anchor, 1)
                new_content = parts[0] + anchor + replacement + parts[1]
            
            with open(file_path, 'w') as f:
                f.write(new_content)
            print(f"Fixed {file_path}")
        else:
            print(f"Anchor '{anchor}' not found in {file_path}")
    else:
        print(f"File not found: {file_path}")
