from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

TAG_FILE = Path(__file__).resolve().parent / "card-tags.json"


@dataclass(frozen=True)
class CardTag:
    name: str
    prompt: str
    definition: str = ""

    @property
    def to_label(self) -> str:
        return f"{self.name}: {self.prompt}"

    @classmethod
    def labels_to_name_dict(cls, tags: list[CardTag]) -> dict[str, str]:
        return {tag.to_label: tag.name for tag in tags}


CARD_TAGS: list[CardTag]
CARD_TAG_NAMES: list[str]

try:
    raw_tags = json.loads(TAG_FILE.read_text(encoding="utf-8"))
except FileNotFoundError:
    raw_tags = []


def _normalize_tags(raw_tags: list[object]) -> list[CardTag]:
    normalized: list[CardTag] = []
    for item in raw_tags:
        if isinstance(item, str):
            normalized.append(CardTag(name=item, prompt=item))
            continue
        if isinstance(item, dict):
            name = item.get("name")
            prompt = item.get("prompt")
            if isinstance(name, str) and isinstance(prompt, str):
                definition = item.get("definition", "")
                normalized.append(CardTag(name=name, prompt=prompt, definition=str(definition)))
    return normalized


CARD_TAGS = _normalize_tags(raw_tags)
CARD_TAG_NAMES = [tag.name for tag in CARD_TAGS]


def load_tag_definitions() -> list[CardTag]:
    return CARD_TAGS


def load_tags() -> list[str]:
    return CARD_TAG_NAMES
