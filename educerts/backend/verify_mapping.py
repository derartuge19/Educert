import sys
import os

# Supplement the path to import backend modules
sys.path.append(os.getcwd())

import main

def test_normalization():
    test_cases = [
        ("Student Name", "student_name"),
        ("Full Name", "student_name"),
        ("Course Name", "course_name"),
        ("Training Name", "course_name"),
        ("Subject", "course_name"),
        ("GPA", "gpa"),
        ("Grade", "grade"),
        ("student-id", "student_id"),
        ("STUDENT NAME ", "student_name"),
    ]
    
    print("Testing normalize_column_name:")
    for input_val, expected in test_cases:
        actual = main.normalize_column_name(input_val)
        status = "✅" if actual == expected else "❌"
        print(f"  {input_val:20} -> {actual:20} {status}")

def test_bulk_mapping_simulation():
    # Simulation of the logic in bulk_issue_from_excel
    template_fields = {"student_name", "course_name", "gpa", "grade", "training_date"}
    row = {
        "Full Name": "John Doe",
        "Subject": "Advanced Physics",
        "GPA": "3.8",
        "Grade": "A",
        "Training Date": "2024-12-01"
    }
    
    normalized_row = {main.normalize_column_name(k): k for k in row.keys()}
    data_payload_fields = {}
    system_auto = {"issued_at", "cert_id", "signature", "qr_code", "digital_signature", "stamp"}

    for field in template_fields:
        if field in system_auto: continue
        
        # 1. Try exact match
        if field in row:
            data_payload_fields[field] = str(row[field]).strip()
            continue
            
        # 2. Try normalized match
        f_norm = main.normalize_column_name(field)
        if f_norm in normalized_row:
            val = row[normalized_row[f_norm]]
            data_payload_fields[field] = str(val).strip()
            continue
            
        # 3. Handle specific aliases
        if f_norm == "student_name":
            # Finding name column manually if not auto-mapped
            pass # Simplified for test
            
    print("\nMapping Simulation results:")
    for field, val in data_payload_fields.items():
        print(f"  {field:20}: {val}")
    
    # Check if all fields were mapped
    missing = template_fields - set(data_payload_fields.keys()) - system_auto
    if missing:
        print(f"❌ Missing fields: {missing}")
    else:
        print("✅ All fields mapped successfully!")

if __name__ == "__main__":
    test_normalization()
    test_bulk_mapping_simulation()
