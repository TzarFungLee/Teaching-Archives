import os
import re

files = [
    './Grammar/Simple Present Tense.html',
    './Grammar/Simple Past Tense.html',
    './Grammar/So That So As To.html',
    './Grammar/Past Continuous Tense.html',
    './Grammar/Simple Future Tense.html',
    './Grammar/Defining Non-Defining Relative Clauses.html',
    './Grammar/Tenses.html',
    './Grammar/Second Conditional.html',
    './Grammar/Must Have to Need to.html',
    './Grammar/First Conditional.html',
    './Grammar/Present Continuous Tense.html',
    './Grammar/Comparative and Superlative Adjectives.html',
    './Grammar/Connectives Because Since So.html',
    './Grammar/Unless.html',
    './Grammar/Adverbs of Sequence.html',
    './Grammar/Connectives So Therefore As a result.html',
    './Grammar/Prepositions of Movement.html',
    './Reading/Reading Vocabulary.html',
    './Reading/Tips.html',
    './Reading/Question Types.html',
    './Writing/Text Types.html',
    './Listening/Listening Vocabulary.html',
    './Listening/Listening Strategies.html'
]

replacement = """<h3>📊 Teaching Slides</h3>
<div style="text-align: center; margin: 30px 0;">
    <a href="https://docs.google.com/presentation/d/e/2PACX-1vQ...placeholder.../pub" target="_blank" class="btn" style="padding: 12px 24px; font-size: 1.1rem;">📖 Open Reading Material</a>
</div>"""

pattern_exists = re.compile(r'<h3.*?>.*?Teaching Slides.*?</h3>\s*(<div.*?>.*?</div>|<!--.*?-->\s*<div.*?>.*?</div>|<p.*?>.*?</p>)?', re.DOTALL)

for file_path in files:
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            content = f.read()
        
        # 1. Try to replace existing
        new_content, count = pattern_exists.subn(replacement, content)
        
        if count > 0:
            with open(file_path, 'w') as f:
                f.write(new_content)
            print(f"Updated existing Slides in {file_path}")
        else:
            # 2. If not found, insert after first <hr>
            if '<hr>' in content:
                # Find the first hr
                parts = content.split('<hr>', 1)
                new_content = parts[0] + '<hr>\n\n' + replacement + '\n\n' + parts[1]
                with open(file_path, 'w') as f:
                    f.write(new_content)
                print(f"Inserted new Slides in {file_path}")
            else:
                print(f"No <hr> found to insert Slides in {file_path}")
    else:
        print(f"File not found: {file_path}")
