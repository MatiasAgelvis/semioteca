import json
from dataclasses import dataclass
from pathlib import Path

TAG_FILE = Path(__file__).resolve().parent / "card-tags.json"


@dataclass(frozen=True)
class CardTag:
    name: str
    description: str

    @property
    def to_label(self) -> str:
        return f"{self.name}: {self.description}"

    @classmethod
    def labels_to_name_dict(cls, tags: list["CardTag"]) -> dict[str, str]:
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
            normalized.append(CardTag(name=item, description=item))
            continue
        if isinstance(item, dict):
            name = item.get("name")
            description = item.get("description")
            if isinstance(name, str) and isinstance(description, str):
                normalized.append(CardTag(name=name, description=description))
    return normalized


CARD_TAGS = _normalize_tags(raw_tags)
CARD_TAG_NAMES = [tag.name for tag in CARD_TAGS]


def load_tag_definitions() -> list[CardTag]:
    return CARD_TAGS


def load_tags() -> list[str]:
    return CARD_TAG_NAMES
