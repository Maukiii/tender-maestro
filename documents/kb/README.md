# KB Folder Structure

Add files into category folders. The parser maps them to normalized categories in `kb.json`.

Suggested structure:

- `team_cvs/` - CVs and team profiles
- `company/` - company profile, capabilities, certifications
- `past_tenders/` - previous tender responses
- `methodology/` - methods, QA, delivery approach
- `references/` - project references and case studies

Supported file types:

- `.pdf`
- `.docx`
- `.xlsx`
- `.md`
- `.txt`

Notes:

- Office temp files like `~$file.xlsx` are skipped automatically.
- Unknown top-level folders are still parsed and used as category names.

