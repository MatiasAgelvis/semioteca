import json
from pathlib import Path
from typing import TypedDict

TAG_FILE = Path(__file__).resolve().parent / "card-tags.json"


class TagDefinition(TypedDict):
    name: str
    description: str


TAG_DEFINITIONS_LIST: list[TagDefinition]
CARD_TAG_NAMES: list[str]

try:
    raw_tags = json.loads(TAG_FILE.read_text(encoding="utf-8"))
except FileNotFoundError:
    raw_tags = []


def _normalize_tags(raw_tags: list[object]) -> list[TagDefinition]:
    normalized: list[TagDefinition] = []
    for item in raw_tags:
        if isinstance(item, str):
            normalized.append({"name": item, "description": item})
            continue
        if isinstance(item, dict):
            name = item.get("name")
            description = item.get("description")
            if isinstance(name, str) and isinstance(description, str):
                normalized.append({"name": name, "description": description})
    return normalized


TAG_DEFINITIONS_LIST = _normalize_tags(raw_tags)
CARD_TAG_NAMES = [tag["name"] for tag in TAG_DEFINITIONS_LIST]


def load_tag_definitions() -> list[TagDefinition]:
    return TAG_DEFINITIONS_LIST


def load_tags() -> list[str]:
    return CARD_TAG_NAMES
