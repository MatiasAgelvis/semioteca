from sentence_transformers import SentenceTransformer
from torch import Tensor
from tqdm import tqdm

from card_models import Card, Library
from logging_config import get_tag_logger, log_card_score_summary
from tags import CARD_TAG_NAMES, CARD_TAGS, CardTag

MODEL_ID = "ibm-granite/granite-embedding-311m-multilingual-r2"
DEFAULT_PROMPT = ""
TAG_THRESHOLD = 0.8
MAX_TAGS = 2

logger = get_tag_logger()


def normalize_card_content(card: Card) -> str:
    return f"{card.title}: {card.content[150:]}"


def _score_card(
    model: SentenceTransformer,
    card: Card,
    tag_embeddings: list[Tensor],
    threshold: float,
    max_tags: int,
) -> list[str]:
    card_embedding = model.encode(normalize_card_content(card), prompt=DEFAULT_PROMPT)

    scored_tags = [
        (index, model.similarity(card_embedding, tag_emb))
        for index, tag_emb in enumerate(tag_embeddings)
    ]
    scored_tags.sort(key=lambda item: item[1], reverse=True)

    selected = [
        (CARD_TAG_NAMES[index], score)
        for index, score in scored_tags
        if score >= threshold
    ]
    selected_tags = [name for name, _ in selected][:max_tags]
    log_card_score_summary(logger, card, threshold, selected_tags, scored_tags, CARD_TAG_NAMES)
    return selected_tags


def tag_dataset(
    dataset: Library,
    tags: list[CardTag] = CARD_TAGS,
    threshold: float = TAG_THRESHOLD,
    max_tags: int = MAX_TAGS,
    hf_token: str | None = None,
) -> Library:
    model = SentenceTransformer(MODEL_ID, token=hf_token)

    tag_embeddings = [
        model.encode(tag.to_label, prompt=DEFAULT_PROMPT)
        for tag in tqdm(tags, desc="Tag embeddings", unit="tag")
    ]

    for book in tqdm(dataset.books, desc="Books", unit="book"):
        for card in tqdm(book.cards, desc="Cards", unit="card", leave=False):
            card.tags = _score_card(model, card, tag_embeddings, threshold, max_tags)

    return dataset
