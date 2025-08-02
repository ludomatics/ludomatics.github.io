#!/usr/bin/env python3
"""
YAML to JSON converter for exam files
Converts YAML exam configuration to JSON format for the existing JavaScript code
"""

import yaml
import json
import sys
import os

def convert_yaml_to_json(yaml_file_path):
    """Convert YAML exam file to JSON format"""
    
    # Read YAML file
    with open(yaml_file_path, 'r', encoding='utf-8') as file:
        yaml_data = yaml.safe_load(file)
    
    # Basic validation
    required_fields = ['title', 'numberOfOptions', 'sections', 'correctAnswers']
    for field in required_fields:
        if field not in yaml_data:
            raise ValueError(f"Missing required field: {field}")
    
    if not isinstance(yaml_data['correctAnswers'], dict):
        raise ValueError("correctAnswers must be a dictionary with question numbers as keys")
    
    if not yaml_data['correctAnswers']:
        raise ValueError("correctAnswers cannot be empty")
    
    # Convert the correctAnswers from numbered format to array format
    if 'correctAnswers' in yaml_data and isinstance(yaml_data['correctAnswers'], dict):
        # Convert numbered answers (1: A, 2: B, etc.) to array format
        numbered_answers = yaml_data['correctAnswers']
        max_question = max(numbered_answers.keys())
        
        # Create array with correct answers in order
        answers_array = []
        for i in range(1, max_question + 1):
            if i in numbered_answers:
                answers_array.append(numbered_answers[i])
            else:
                # If a question number is missing, use 'A' as default
                answers_array.append('A')
        
        yaml_data['correctAnswers'] = answers_array
    
    return yaml_data

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 yaml_to_json.py <yaml_file>")
        sys.exit(1)
    
    yaml_file = sys.argv[1]
    
    if not os.path.exists(yaml_file):
        print(f"Error: File {yaml_file} not found")
        sys.exit(1)
    
    try:
        # Convert YAML to JSON
        json_data = convert_yaml_to_json(yaml_file)
        
        # Generate output filename
        base_name = os.path.splitext(yaml_file)[0]
        json_file = base_name + '.json'
        
        # Write JSON file
        with open(json_file, 'w', encoding='utf-8') as file:
            json.dump(json_data, file, indent=4, ensure_ascii=False)
        
        print(f"✅ Converted {yaml_file} to {json_file}")
        
    except Exception as e:
        print(f"❌ Error converting {yaml_file}: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 
