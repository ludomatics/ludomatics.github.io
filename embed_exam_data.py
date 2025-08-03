#!/usr/bin/env python3
"""
Create exam data reference in HTML files
Instead of embedding data, creates a reference to the JSON file
"""

import json
import sys
import os
import re

def create_exam_data_reference(json_file_path, html_file_path):
    """Create a reference to the JSON file in the HTML"""
    
    # Read JSON data to validate it
    with open(json_file_path, 'r', encoding='utf-8') as file:
        exam_data = json.load(file)
    
    # Validate required fields
    required_fields = ['title', 'numberOfOptions', 'correctAnswers']
    for field in required_fields:
        if field not in exam_data:
            raise ValueError(f"Missing required field: {field}")
    
    # Validate that correctAnswers is an array
    if not isinstance(exam_data['correctAnswers'], list):
        raise ValueError("correctAnswers must be an array")
    
    # Read HTML template
    with open(html_file_path, 'r', encoding='utf-8') as file:
        html_content = file.read()
    
    # The new template already uses ExamService, so we don't need to modify it
    # Just validate that the JSON file exists and is valid
    print(f"✅ Exam data reference created for {os.path.basename(json_file_path)}")
    print(f"   HTML file will load data from: {os.path.basename(json_file_path)}")

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
        create_exam_data_reference(json_file, html_file)
    except Exception as e:
        print(f"❌ Error creating exam data reference: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 
