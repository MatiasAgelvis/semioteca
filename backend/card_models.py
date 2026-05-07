from dataclasses import asdict, dataclass, field
from typing import List, Optional


# --------------------------------------
# Helper classes for card data structures
# --------------------------------------

@dataclass(frozen=True)
class BookGroupKey:
    title: Optional[str]
    author: Optional[str]
    book: Optional[str]
    year: Optional[str]


@dataclass
class CardSection:
    content: str
    marker: Optional[str] = None
    page: Optional[str] = None
    year: Optional[str] = None

# ---------------------------------------
# Schema models
# ---------------------------------------

@dataclass
class BaseMetadata:
    title: Optional[str] = None
    author: Optional[str] = None
    book: Optional[str] = None
    year: Optional[str] = None


@dataclass
class ImageRef:
    path: str
    filename: str
    internal_path: Optional[str] = None
    caption: Optional[str] = None
    position: Optional[str] = None
    placeholder_id: Optional[int] = None
    alt_text: Optional[str] = None

    def to_dict(self) -> dict:
        return asdict(self)

    @staticmethod
    def from_dict(data: dict) -> "ImageRef":
        return ImageRef(
            path=data["path"],
            filename=data["filename"],
            internal_path=data.get("internal_path"),
            caption=data.get("caption"),
            position=data.get("position"),
            placeholder_id=data.get("placeholder_id"),
            alt_text=data.get("alt_text"),
        )


@dataclass(kw_only=True)
class Card(BaseMetadata):
    id: str
    page: Optional[str]
    raw_marker: Optional[str]
    content: str
    source_path: str
    source_format: str
    images: List[ImageRef] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        data = asdict(self)
        data["images"] = [image.to_dict() for image in self.images]
        return data

    @staticmethod
    def from_dict(data: dict) -> "Card":
        return Card(
            id=data["id"],
            title=data.get("title"),
            author=data.get("author"),
            book=data.get("book"),
            year=data.get("year"),
            page=data.get("page"),
            raw_marker=data.get("raw_marker"),
            content=data.get("content", ""),
            source_path=data.get("source_path", ""),
            source_format=data.get("source_format", ""),
            images=[ImageRef.from_dict(image) for image in data.get("images", [])],
            tags=data.get("tags", []),
        )


@dataclass
class Book(BaseMetadata):
    cards: list[Card] = field(default_factory=list)

    def to_dict(self) -> dict:
        data = asdict(self)
        data["cards"] = [card.to_dict() for card in self.cards]
        return data

    @staticmethod
    def from_dict(data: dict) -> "Book":
        return Book(
            title=data.get("title"),
            author=data.get("author"),
            book=data.get("book"),
            year=data.get("year"),
            cards=[Card.from_dict(card_data) for card_data in data.get("cards", [])],
        )


@dataclass
class Library:
    books: list[Book] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {"books": [book.to_dict() for book in self.books]}

    @staticmethod
    def from_dict(data: dict) -> "Library":
        return Library(
            books=[Book.from_dict(book_data) for book_data in data.get("books", [])]
        )

    def flatten_cards(self) -> list[Card]:
        return [card for book in self.books for card in book.cards]
