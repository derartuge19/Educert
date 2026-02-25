import fitz
import os

def verify_pdf_content(pdf_path, expected_texts):
    if not os.path.exists(pdf_path):
        print(f"FAIL: {pdf_path} not found")
        return False
    
    doc = fitz.open(pdf_path)
    full_text = ""
    for page in doc:
        full_text += page.get_text("text")
    
    doc.close()
    
    success = True
    for text in expected_texts:
        if text.lower() in full_text.lower():
            print(f"PASS: Found '{text}' in {pdf_path}")
        else:
            print(f"FAIL: Could not find '{text}' in {pdf_path}")
            success = False
            
    if not success:
        print("\nFull text extracted from PDF:")
        print("---")
        print(full_text)
        print("---")
        
    return success

if __name__ == "__main__":
    # Look for files in generated_certs
    certs_dir = "generated_certs"
    if os.path.exists(certs_dir):
        files = [f for f in os.listdir(certs_dir) if f.endswith(".pdf")]
        if not files:
            print("No generated certificates found to verify.")
        else:
            for f in files:
                # We expect common student names or course names to be in the filename or we can just check for any text
                path = os.path.join(certs_dir, f)
                # Since we don't know the exact data used by the user, we just check if it's NOT empty
                doc = fitz.open(path)
                text = "".join(p.get_text() for p in doc)
                doc.close()
                if len(text.strip()) > 0:
                    print(f"VERIFIED: {f} contains text data.")
                    print(f"  Snippet: {text[:100].replace('\n', ' ')}")
                else:
                    print(f"CRITICAL: {f} appears EMPTY of text!")
    else:
        print("generated_certs directory not found.")
