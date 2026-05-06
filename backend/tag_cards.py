import json
import random
from pathlib import Path
from card_models import Library
from tags import CARD_TAG_NAMES

def load_json(file_path: str) -> dict:
    """
    Load a JSON file and return its contents as a dictionary.
    Args:
        file_path (str): The path to the JSON file to be loaded.
    Returns:
        dict: The contents of the JSON file as a dictionary.
    """
    with open(file_path, 'r') as f:
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
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=4)

def load_dataset(file_path: str) -> Library:
    """
    Load a cards dataset from a JSON file.
    Args:
        file_path (str): The path to the JSON file containing card data.
    Returns:
        CardsDataset: The loaded dataset.
    """
    return Library.from_dict(load_json(file_path))

def save_dataset(dataset: Library, file_path: str) -> None:
    """
    Save a cards dataset to a JSON file.
    Args:
        dataset (CardsDataset): The dataset to save.
        file_path (str): The path to the JSON file where the dataset will be saved.
    Returns:
        None
    """
    save_json(dataset.to_dict(), file_path)

def tag_dataset(dataset: Library, tags: list[str]) -> Library:
    """
    Tag every card in a dataset with the specified tags.
    Args:
        dataset (CardsDataset): The dataset whose cards will be tagged.
        tags (list[str]): The list of tags to be assigned.
    Returns:
        CardsDataset: The updated dataset.
    """
    for book in dataset.books:
        for card in book.cards:
            card.tags = [random.choice(tags)]
    return dataset

def main():
    # Load cards from JSON file
    base_dir = Path(__file__).resolve().parent
    dataset = load_dataset(base_dir / 'cards.json')

    tagged_dataset = tag_dataset(dataset, CARD_TAG_NAMES)

    # Save the tagged cards to a new JSON file
    save_dataset(tagged_dataset, base_dir / 'tagged_cards.json')

if __name__ == "__main__":
    main()