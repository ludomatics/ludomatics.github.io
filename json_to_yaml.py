#!/usr/bin/env python3
"""
JSON to YAML converter for exam files
Converts existing JSON exam files to YAML format for easier editing
"""

import json
import yaml
import sys
import os

def convert_json_to_yaml(json_file_path):
    """Convert JSON exam file to YAML format"""
    
    # Read JSON file
    with open(json_file_path, 'r', encoding='utf-8') as file:
        json_data = json.load(file)
    
    # Convert the correctAnswers from array format to numbered format
    if 'correctAnswers' in json_data and isinstance(json_data['correctAnswers'], list):
        # Convert array answers to numbered format
        answers_array = json_data['correctAnswers']
        numbered_answers = {}
        
        for i, answer in enumerate(answers_array, 1):
            numbered_answers[i] = answer
        
        json_data['correctAnswers'] = numbered_answers
    
    return json_data

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 json_to_yaml.py <json_file>")
        sys.exit(1)
    
    json_file = sys.argv[1]
    
    if not os.path.exists(json_file):
        print(f"Error: File {json_file} not found")
        sys.exit(1)
    
    try:
        # Convert JSON to YAML
        yaml_data = convert_json_to_yaml(json_file)
        
        # Generate output filename
        base_name = os.path.splitext(json_file)[0]
        yaml_file = base_name + '.yaml'
        
        # Write YAML file
        with open(yaml_file, 'w', encoding='utf-8') as file:
            yaml.dump(yaml_data, file, default_flow_style=False, allow_unicode=True, sort_keys=False)
        
        print(f"✅ Converted {json_file} to {yaml_file}")
        
    except Exception as e:
        print(f"❌ Error converting {json_file}: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 
