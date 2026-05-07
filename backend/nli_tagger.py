from card_models import Card, Library
from logging_config import get_tag_logger, log_card_score_summary
from tags import CARD_TAG_NAMES, CARD_TAGS, CardTag
from tqdm import tqdm
from transformers import pipeline

MODEL_ID = "MoritzLaurer/mDeBERTa-v3-base-mnli-xnli"
# MODEL_ID = "Recognai/zeroshot_selectra_medium"
MAX_TAGS = 2
MIN_CONFIDENCE = 0.7
HYPOTHESIS_TEMPLATE = "Este texto trata sobre el concepto de {}."

logger = get_tag_logger()


def normalize_card_content(card: Card) -> str:
    return f"{card.title}: {card.content[150:]}"


def _score_card(
    classifier,
    card: Card,
    tags: list[CardTag],
    max_tags: int,
    min_confidence: float,
) -> list[str]:
    card_text = normalize_card_content(card)
    label_to_name = CardTag.labels_to_name_dict(tags)
    tag_labels = list(label_to_name.keys())

    result = classifier(
        card_text,
        candidate_labels=tag_labels,
        hypothesis_template=HYPOTHESIS_TEMPLATE,
        multi_label=True,
    )

    # result["labels"] is already sorted by score descending
    scored_tags = [
        (CARD_TAG_NAMES.index(label_to_name[label]), score)
        for label, score in zip(result["labels"], result["scores"])
        if label in label_to_name
    ]

    selected_tags = [
        label_to_name[label]
        for label, score in zip(result["labels"], result["scores"])
        if label in label_to_name and score >= min_confidence
    ][:max_tags]

    log_card_score_summary(
        logger, card, min_confidence, selected_tags, scored_tags, CARD_TAG_NAMES
    )
    return selected_tags


def tag_dataset(
    dataset: Library,
    tags: list[CardTag] = CARD_TAGS,
    max_tags: int = MAX_TAGS,
    min_confidence: float = MIN_CONFIDENCE,
    hf_token: str | None = None,
) -> Library:
    classifier = pipeline(
        "zero-shot-classification",
        model=MODEL_ID,
        token=hf_token,
    )

    for book in tqdm(dataset.books, desc="Books", unit="book"):
        for card in tqdm(book.cards, desc="Cards", unit="card", leave=False):
            card.tags = _score_card(classifier, card, tags, max_tags, min_confidence)

    return dataset
