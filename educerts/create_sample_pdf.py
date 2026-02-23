import fitz

def create_sample_pdf(filename):
    print(f"Creating sample PDF: {filename}")
    doc = fitz.open()
    page = doc.new_page()
    
    # Title
    page.insert_text((50, 50), "Certificate of Excellence", fontsize=24)
    
    # Body with placeholders
    page.insert_text((50, 150), "This is to certify that", fontsize=12)
    page.insert_text((50, 180), "{{ student_name }}", fontsize=18)
    
    page.insert_text((50, 230), "has successfully completed the course", fontsize=12)
    page.insert_text((50, 260), "{{ course_name }}", fontsize=18)
    
    page.insert_text((50, 310), "Issued on: {{ issued_at }}", fontsize=12)
    page.insert_text((50, 330), "Certificate ID: {{ cert_id }}", fontsize=10)
    
    # Signature areas
    page.insert_text((50, 500), "Authorized Signature:", fontsize=12)
    page.insert_text((50, 550), "{{ digital_signature }}", fontsize=14)
    
    page.insert_text((350, 500), "Official Stamp:", fontsize=12)
    page.insert_text((350, 550), "{{ stamp }}", fontsize=14)

    doc.save(filename)
    doc.close()
    print(f"Sample PDF created successfully at {filename}")

if __name__ == "__main__":
    create_sample_pdf("sample_template.pdf")
