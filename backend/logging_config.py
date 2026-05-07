import json
import logging
from pathlib import Path
from typing import Optional

ROOT_DIR = Path(__file__).resolve().parent
DEFAULT_LOG_FILE = ROOT_DIR / "global.log"
TAG_LOG_FILE = ROOT_DIR / "tag_scores.log"


def get_logger(name: str, log_file: Optional[Path] = None, level: int = logging.INFO) -> logging.Logger:
    if log_file is None:
        log_file = DEFAULT_LOG_FILE

    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(level)
        logger.propagate = False
        handler = logging.FileHandler(log_file, mode="a", encoding="utf-8")
        handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
        logger.addHandler(handler)

    return logger

def get_tag_logger() -> logging.Logger:
    return get_logger("backend.tag_cards", TAG_LOG_FILE)

def log_card_score_summary(
    logger: logging.Logger,
    card: object,
    threshold: float,
    selected_tags: list[str],
    scored_tags: list[tuple[int, float]],
    tag_names: list[str],
) -> None:
    score_log = {
        "card_title": getattr(card, "title", None),
        "card_id": getattr(card, "id", None),
        "threshold": threshold,
        "selected_tags": selected_tags,
        "scores": [
            {"tag": tag_names[index], "score": float(score)}
            for index, score in scored_tags
        ],
    }
    logger.info(f"Card score summary: {json.dumps(score_log, ensure_ascii=False)}")
