import json
import os
from pathlib import Path
from dotenv import load_dotenv

from card_models import Library
from logging_config import get_tag_logger
from tags import CARD_TAGS, CardTag
import nli_tagger
# import embedding_tagger as tagger

os.environ.setdefault("HF_HUB_DISABLE_PROGRESS_BAR", "0")
load_dotenv()
HF_TOKEN = os.getenv('HF_TOKEN')

tagger = nli_tagger

logger = get_tag_logger()
logger.info("\n\n" + "="*80 + "\n\n")
logger.info(f"Tagger: {tagger.__name__}, Model: {tagger.MODEL_ID}, Max Tags: {tagger.MAX_TAGS}")

def load_json(file_path: str) -> dict:
    """
    Load a JSON file and return its contents as a dictionary.
    Args:
        file_path (str): The path to the JSON file to be loaded.
    Returns:
        dict: The contents of the JSON file as a dictionary.
    """
    with open(file_path, "r") as f:
        return json.load(f)


def save_json(data: dict, file_path: str) -> None:
    """
    Save a dictionary to a JSON file.
    Args:
        data (dict): The dictionary to save.
        file_path (str): The path to the JSON file where the data will be saved.
    Returns:
        None
    """
    with open(file_path, "w") as f:
        json.dump(data, f, indent=4)


def load_dataset(file_path: str) -> Library:
    """
    Load a cards dataset from a JSON file.
    Args:
        file_path (str): The path to the JSON file containing card data.
    Returns:
        Library: The loaded dataset.
    """
    return Library.from_dict(load_json(file_path))


def save_dataset(dataset: Library, file_path: str) -> None:
    """
    Save a cards dataset to a JSON file.
    Args:
        dataset (Library): The dataset to save.
        file_path (str): The path to the JSON file where the dataset will be saved.
    Returns:
        None
    """
    save_json(dataset.to_dict(), file_path)


def tag_dataset(
    dataset: Library, tags: list[CardTag] = CARD_TAGS
) -> Library:
    """
    Tag all cards in a dataset with the most relevant tags based on their content.
    Args:
        dataset (Library): The dataset containing books and cards to be tagged.
        tags (list[CardTag], optional): A list of CardTag objects representing the available tags. Defaults to CARD_TAGS.
    Returns:
        Library: The updated dataset with tagged cards.
    """

    return tagger.tag_dataset(dataset, tags=tags, hf_token=HF_TOKEN)


def main():
    # Load cards from JSON file
    base_dir = Path(__file__).resolve().parent
    dataset = load_dataset(base_dir / "cards.json")

    # tag the first 3 entries as an example (to avoid long processing time during development)
    tagged_dataset = tag_dataset(Library(books=dataset.books[0:3]), tags=CARD_TAGS)

    # Save the tagged cards to a new JSON file
    save_dataset(tagged_dataset, base_dir / "tagged_cards.json")


if __name__ == "__main__":
    main()
