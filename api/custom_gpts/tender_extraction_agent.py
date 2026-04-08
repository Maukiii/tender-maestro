"""
Tender Extractor Agent

Accepts a JSON payload and calls Anthropic's Messages API via HTTPS POST.
"""
from prompting import prompt
from extract_text import extract_text

EXTRACTION_PROMPT = """Task: Extract the information from the attached PDF document and convert it into a structured JSON format.

Requirements:

Structure: Create a valid JSON object. Use clear keys in CamelCase (e.g., invoiceNumber, itemList).

Completeness: Extract all relevant data points (names, dates, amounts, table contents).

Data types: Ensure that numbers are formatted as Number, Booleans as Boolean, and lists as Array.

No text: Output only the JSON code. Do not add any explanations or introductory sentences.

JSON schema (example):
{
  "metadata": { "title": "", "date": "" },
  "content": { },
  "tables": [ { "column1": "", "column2": "" } ]
}"""

def run_tender_extractor_agent(tender_pdf_file_path="/Users/kirschenmannfabian/Library/CloudStorage/GoogleDrive-fabi.kcm@gmail.com/My Drive/Barbie Q/Code/tender-maestro/example_data/sample_tender1_for_building.pdf"):
    tender_text = extract_text(tender_pdf_file_path)
    answer = prompt(EXTRACTION_PROMPT + "\n\n" + tender_text)
    print(answer)
    return answer

if __name__ == "__main__":
    run_tender_extractor_agent()
