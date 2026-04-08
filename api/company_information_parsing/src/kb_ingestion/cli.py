import argparse
import json
from pathlib import Path

from .config import default_kb_path
from .ingest import parse_folder
from .structured import build_standardized_output


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Build KB JSON from documents folder.")
    parser.add_argument(
        "--kb-path",
        type=Path,
        default=None,
        help="Path to kb source folder. Default: <project>/documents/kb",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Combined output JSON file path. Default: <project>/kb.json",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=None,
        help="Directory for per-category JSON files. Default: <project>/outputs",
    )
    return parser


def main() -> None:
    args = build_arg_parser().parse_args()

    base_dir = Path(__file__).resolve().parents[2]
    kb_path = args.kb_path or default_kb_path(base_dir)
    output_path = args.output or (base_dir / "kb.json")
    output_dir = args.output_dir or (base_dir / "outputs")

    entries = parse_folder(kb_path)
    kb = build_standardized_output(entries)
    output_dir.mkdir(parents=True, exist_ok=True)

    with output_path.open("w", encoding="utf-8") as file:
        json.dump(kb, file, ensure_ascii=False, indent=2)

    company_path = output_dir / "company_documents.json"
    methodology_path = output_dir / "methodology_documents.json"
    team_cvs_path = output_dir / "team_cvs.json"

    with company_path.open("w", encoding="utf-8") as file:
        json.dump(kb["company_documents"], file, ensure_ascii=False, indent=2)

    with methodology_path.open("w", encoding="utf-8") as file:
        json.dump(kb["methodology_documents"], file, ensure_ascii=False, indent=2)

    with team_cvs_path.open("w", encoding="utf-8") as file:
        json.dump(kb["team_cvs"], file, ensure_ascii=False, indent=2)

    print(
        "\nDone: "
        f"{len(entries)} files processed "
        f"({len(kb['company_documents'])} company docs, "
        f"{len(kb['methodology_documents'])} methodology docs, "
        f"{len(kb['team_cvs'])} team CVs)"
    )
    print(f"Combined output: {output_path}")
    print(f"Category outputs: {output_dir}")


if __name__ == "__main__":
    main()

