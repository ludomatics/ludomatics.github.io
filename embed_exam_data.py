#!/usr/bin/env python3
"""
Embed exam data directly in HTML files
Replaces JSON file references with embedded exam data
"""

import json
import sys
import os
import re

def embed_exam_data_in_html(json_file_path, html_file_path):
    """Embed exam data directly in HTML file"""
    
    # Read JSON data
    with open(json_file_path, 'r', encoding='utf-8') as file:
        exam_data = json.load(file)
    
    # Calculate number of questions
    exam_data['numberOfQuestions'] = len(exam_data['correctAnswers'])
    
    # Read HTML template
    with open(html_file_path, 'r', encoding='utf-8') as file:
        html_content = file.read()
    
    # Create JavaScript object with exam data
    # Format with indentation but put correctAnswers on a single line
    exam_data_formatted = {
        'title': exam_data['title'],
        'numberOfOptions': exam_data['numberOfOptions'],
        'sections': exam_data['sections'],
        'correctAnswers': exam_data['correctAnswers'],
        'numberOfQuestions': exam_data['numberOfQuestions']
    }
    
    # Convert to JSON with custom formatting
    exam_data_js = json.dumps(exam_data_formatted, ensure_ascii=False, indent=2)
    
    # Put correctAnswers on a single line
    lines = exam_data_js.split('\n')
    formatted_lines = []
    in_correct_answers = False
    
    for line in lines:
        if '"correctAnswers": [' in line:
            in_correct_answers = True
            # Start the correctAnswers array
            formatted_lines.append(line)
        elif in_correct_answers and ']' in line:
            # End of correctAnswers array
            in_correct_answers = False
            formatted_lines.append(line)
        elif in_correct_answers:
            # Skip individual answer lines, they'll be added as a single line
            continue
        else:
            formatted_lines.append(line)
    
    # Reconstruct with correctAnswers on a single line
    exam_data_js = '\n'.join(formatted_lines)
    
    # Replace the multi-line correctAnswers with a single line
    answers_single_line = '[' + ', '.join(f'"{answer}"' for answer in exam_data['correctAnswers']) + ']'
    exam_data_js = re.sub(r'"correctAnswers": \[\s*[\s\S]*?\s*\]', f'"correctAnswers": {answers_single_line}', exam_data_js)
    
    # Replace the existing examData with the new data
    # This handles both the template with mock data and the old pattern
    old_pattern = r'const examData = \{[\s\S]*?\};'
    new_content = f'const examData = {exam_data_js};'
    
    # Replace the pattern
    new_html_content = re.sub(old_pattern, new_content, html_content, flags=re.DOTALL)
    
    # Write the updated HTML file
    with open(html_file_path, 'w', encoding='utf-8') as file:
        file.write(new_html_content)
    
    print(f"✅ Embedded exam data in {html_file_path}")

def main():
    if len(sys.argv) != 3:
        print("Usage: python3 embed_exam_data.py <json_file> <html_file>")
        sys.exit(1)
    
    json_file = sys.argv[1]
    html_file = sys.argv[2]
    
    if not os.path.exists(json_file):
        print(f"Error: JSON file {json_file} not found")
        sys.exit(1)
    
    if not os.path.exists(html_file):
        print(f"Error: HTML file {html_file} not found")
        sys.exit(1)
    
    try:
        embed_exam_data_in_html(json_file, html_file)
    except Exception as e:
        print(f"❌ Error embedding exam data: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 
