"""
scan_registration_form.py
=========================
Reads a scanned Ghana/Diaspora Network registration form (image or PDF)
and extracts structured member data using Claude's vision API.

PDFs are sent to Claude natively — no Poppler or pdf2image required.

Usage:
    python scripts/scan_registration_form.py path/to/form.jpg
    python scripts/scan_registration_form.py path/to/form.pdf --insert
    python scripts/scan_registration_form.py forms/ --batch --insert

Dependencies:
    pip install anthropic supabase python-dotenv
"""

import argparse
import base64
import json
import os
import sys
from pathlib import Path

import anthropic
from dotenv import load_dotenv

load_dotenv()

# ── Field schema (mirrors RegistrationSubmission in RegistrationForm.tsx) ──────

GHANA_SCHEMA = {
    "platform": "GHANA",
    "fullName": None,
    "gender": None,           # "Male" | "Female" | "Other"
    "ageRange": None,         # e.g. "18-25" | "26-35" | "36-45" | "46-60" | "60+"
    "email": None,
    "countryCode": "+233",
    "contactNumber": None,
    "residentialAddress": None,
    "region": None,           # one of Ghana's 16 regions
    "constituency": None,
    "profession": None,
    "educationLevel": None,   # e.g. "Basic" | "Secondary" | "Tertiary" | "Postgraduate"
    "emergencyContactName": None,
    "emergencyRelationship": None,
    "emergencyNumber": None,
}

DIASPORA_SCHEMA = {
    "platform": "DIASPORA",
    "fullName": None,
    "gender": None,
    "ageRange": None,
    "email": None,
    "country": None,
    "countryCode": None,
    "contactNumber": None,
    "residentialAddress": None,
    "profession": None,
    "educationLevel": None,
    "emergencyContactName": None,
    "emergencyRelationship": None,
    "emergencyNumber": None,
}

GHANA_REGIONS = [
    "Greater Accra", "Ashanti", "Western", "Central", "Eastern", "Volta",
    "Northern", "Upper East", "Upper West", "Brong-Ahafo", "Savannah",
    "Bono East", "Ahafo", "Western North", "Oti", "North East",
]

PROMPT = """You are analysing a scanned physical registration form for The Base Movement,
a Ghanaian political organisation.

The form is either a Ghana Network form (for residents) or a Diaspora Network form
(for Ghanaians living abroad). The form type is usually labelled at the top.

Extract every legible field value and return a single JSON object.

Rules:
- Use null for any field that is blank, illegible, or not present on this form type.
- For `gender`: use exactly one of "Male", "Female", "Other".
- For `ageRange`: use exactly one of "18-25", "26-35", "36-45", "46-60", "60+".
- For `region` (Ghana forms): match to one of these 16 regions exactly —
  Greater Accra, Ashanti, Western, Central, Eastern, Volta, Northern,
  Upper East, Upper West, Brong-Ahafo, Savannah, Bono East, Ahafo,
  Western North, Oti, North East.
- For `educationLevel`: use one of "Basic", "Secondary", "Tertiary", "Postgraduate".
- For `platform`: "GHANA" or "DIASPORA".
- Include ALL fields from the schema even if null.
- Return ONLY valid JSON — no markdown fences, no explanation.

Ghana Network schema:
""" + json.dumps(GHANA_SCHEMA, indent=2) + """

Diaspora Network schema:
""" + json.dumps(DIASPORA_SCHEMA, indent=2) + """

Return the JSON:"""


# ── Core extraction function ───────────────────────────────────────────────────

MEDIA_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".pdf": "application/pdf",
}


def extract_from_file(file_path: str, client: anthropic.Anthropic) -> dict:
    """
    Send an image or PDF to Claude and return extracted registration JSON.
    PDFs are sent as a native document block — no conversion needed.
    """
    ext = Path(file_path).suffix.lower()
    media_type = MEDIA_TYPES.get(ext, "image/jpeg")

    with open(file_path, "rb") as f:
        b64 = base64.standard_b64encode(f.read()).decode("utf-8")

    # PDFs use the 'document' block; images use the 'image' block
    if media_type == "application/pdf":
        file_block = {
            "type": "document",
            "source": {
                "type": "base64",
                "media_type": "application/pdf",
                "data": b64,
            },
        }
    else:
        file_block = {
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": media_type,
                "data": b64,
            },
        }

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[{
            "role": "user",
            "content": [
                file_block,
                {"type": "text", "text": PROMPT},
            ],
        }],
    )

    raw = response.content[0].text.strip()

    # Strip accidental markdown fences
    if raw.startswith("```"):
        lines = raw.split("\n")
        raw = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])

    return json.loads(raw)


def scan_form(file_path: str, client: anthropic.Anthropic) -> list[dict]:
    """
    Scan one file (image or PDF). Returns a list of extracted records.
    For PDFs, Claude reads all pages in a single call and returns one record.
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    label = "PDF" if path.suffix.lower() == ".pdf" else "image"
    print(f"  Scanning {label}…")

    data = extract_from_file(str(path), client)
    data["_source_file"] = str(path)
    return [data]


# ── Optional Supabase insert ───────────────────────────────────────────────────

def insert_to_supabase(record: dict) -> str:
    """Insert extracted record into the members table. Returns the new member ID."""
    try:
        from supabase import create_client
    except ImportError:
        sys.exit("supabase is not installed. Run: pip install supabase")

    url = os.environ.get("VITE_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")

    if not url or not key:
        sys.exit(
            "Supabase credentials missing. Set VITE_SUPABASE_URL and "
            "SUPABASE_SERVICE_ROLE_KEY in your .env file."
        )

    client = create_client(url, key)

    # Strip internal metadata keys before insert
    payload = {k: v for k, v in record.items() if not k.startswith("_")}

    # Map to the members table column names
    row = {
        "name": payload.get("fullName"),
        "platform": payload.get("platform", "GHANA"),
        "gender": payload.get("gender"),
        "age_range": payload.get("ageRange"),
        "email": payload.get("email"),
        "country_code": payload.get("countryCode", "+233"),
        "contact_number": payload.get("contactNumber"),
        "address": payload.get("residentialAddress"),
        "region": payload.get("region"),
        "constituency": payload.get("constituency"),
        "country": payload.get("country", "Ghana"),
        "profession": payload.get("profession"),
        "education_level": payload.get("educationLevel"),
        "emergency_contact_name": payload.get("emergencyContactName"),
        "emergency_relationship": payload.get("emergencyRelationship"),
        "emergency_number": payload.get("emergencyNumber"),
        "status": "Pending",
        "source": "scanned_form",
    }

    res = client.table("members").insert(row).execute()
    return res.data[0]["id"] if res.data else "unknown"


# ── CLI ────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Scan physical registration forms and extract member data."
    )
    parser.add_argument("input", help="Image/PDF file path, or directory for --batch")
    parser.add_argument(
        "--batch", action="store_true",
        help="Process all images/PDFs in the given directory"
    )
    parser.add_argument(
        "--insert", action="store_true",
        help="Insert extracted records directly into Supabase"
    )
    parser.add_argument(
        "--out", default=None,
        help="Write extracted JSON to this file (default: print to stdout)"
    )
    args = parser.parse_args()

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        sys.exit("ANTHROPIC_API_KEY is not set in environment or .env file.")

    client = anthropic.Anthropic(api_key=api_key)

    # Gather files to process
    if args.batch:
        folder = Path(args.input)
        if not folder.is_dir():
            sys.exit(f"Not a directory: {args.input}")
        supported = {".jpg", ".jpeg", ".png", ".webp", ".pdf"}
        files = [f for f in sorted(folder.iterdir()) if f.suffix.lower() in supported]
        if not files:
            sys.exit(f"No supported files found in {args.input}")
    else:
        files = [Path(args.input)]

    all_records = []

    for file in files:
        print(f"\n[{file.name}]")
        try:
            records = scan_form(str(file), client)
            for record in records:
                print(f"  ✓ Extracted: {record.get('fullName') or '(no name)'} — {record.get('platform')}")
                if args.insert:
                    member_id = insert_to_supabase(record)
                    print(f"  → Inserted to Supabase: {member_id}")
                    record["_inserted_id"] = member_id
            all_records.extend(records)
        except json.JSONDecodeError as e:
            print(f"  ✗ JSON parse error: {e}")
        except Exception as e:
            print(f"  ✗ Error: {e}")

    print(f"\nDone — {len(all_records)} record(s) processed.")

    output = json.dumps(all_records, indent=2, ensure_ascii=False)
    if args.out:
        Path(args.out).write_text(output, encoding="utf-8")
        print(f"Results written to {args.out}")
    else:
        print("\n── Extracted data ──────────────────────────────────────")
        print(output)


if __name__ == "__main__":
    main()
