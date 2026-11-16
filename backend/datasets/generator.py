"""
Dataset generator for regular languages.
Generates balanced positive and negative strings, supports synthetic label noise,
and handles custom user-provided datasets.
"""

import random
import itertools
from typing import List, Dict, Tuple, Optional, Any, Callable
from backend.datasets.benchmarks import get_benchmark, BenchmarkLanguage


class DatasetItem:
    def __init__(self, word: str, label: bool, original_label: Optional[bool] = None, is_noisy: bool = False):
        self.word = word
        self.label = label
        self.original_label = original_label if original_label is not None else label
        self.is_noisy = is_noisy

    def to_dict(self) -> Dict[str, Any]:
        return {
            "word": self.word if self.word != "" else "ε",
            "raw_word": self.word,
            "label": self.label,
            "original_label": self.original_label,
            "is_noisy": self.is_noisy,
            "length": len(self.word)
        }


def generate_all_words(alphabet: List[str], max_len: int) -> List[str]:
    """Generates all strings over alphabet up to max_len in shortlex order."""
    words = [""]
    current_level = [""]
    for _ in range(max_len):
        next_level = []
        for w in current_level:
            for char in alphabet:
                nw = w + char
                next_level.append(nw)
                words.append(nw)
        current_level = next_level
    return words


def sample_regular_language(
    oracle_func: Callable[[str], bool],
    alphabet: List[str],
    num_samples: int = 50,
    max_len: int = 7,
    balance_ratio: float = 0.5,
    seed: Optional[int] = 42
) -> List[DatasetItem]:
    """
    Samples strings up to max_len with a desired ratio of positive samples.
    Uses shortlex enumeration for small max_len and random walks/uniform sampling for larger.
    """
    if seed is not None:
        random.seed(seed)

    target_pos = int(num_samples * balance_ratio)
    target_neg = num_samples - target_pos

    all_short = generate_all_words(alphabet, min(max_len, 6))
    
    pos_pool = []
    neg_pool = []
    seen = set()

    for w in all_short:
        seen.add(w)
        if oracle_func(w):
            pos_pool.append(w)
        else:
            neg_pool.append(w)

    # If needed, generate longer strings by random generation
    attempts = 0
    max_attempts = num_samples * 20
    while (len(pos_pool) < target_pos or len(neg_pool) < target_neg) and attempts < max_attempts:
        attempts += 1
        length = random.randint(min(7, max_len), max_len)
        w = "".join(random.choice(alphabet) for _ in range(length))
        if w not in seen:
            seen.add(w)
            if oracle_func(w):
                pos_pool.append(w)
            else:
                neg_pool.append(w)

    random.shuffle(pos_pool)
    random.shuffle(neg_pool)

    chosen_pos = pos_pool[:target_pos]
    chosen_neg = neg_pool[:target_neg]

    items = [DatasetItem(word=w, label=True) for w in chosen_pos] + \
            [DatasetItem(word=w, label=False) for w in chosen_neg]
    random.shuffle(items)
    return items


def inject_noise(items: List[DatasetItem], noise_rate: float, seed: Optional[int] = None) -> List[DatasetItem]:
    """
    Inverts the label of a fraction `noise_rate` (0.0 to 0.5) of the dataset.
    """
    if noise_rate <= 0.0:
        return [DatasetItem(item.word, item.label, item.original_label, False) for item in items]

    if seed is not None:
        random.seed(seed)

    n = len(items)
    num_noisy = int(round(n * noise_rate))
    indices_to_flip = set(random.sample(range(n), min(num_noisy, n)))

    noisy_items = []
    for i, it in enumerate(items):
        if i in indices_to_flip:
            noisy_items.append(DatasetItem(
                word=it.word,
                label=not it.label,
                original_label=it.original_label,
                is_noisy=True
            ))
        else:
            noisy_items.append(DatasetItem(
                word=it.word,
                label=it.label,
                original_label=it.original_label,
                is_noisy=False
            ))
    return noisy_items


def create_dataset(
    benchmark_id: Optional[str] = None,
    custom_oracle: Optional[Callable[[str], bool]] = None,
    alphabet: Optional[List[str]] = None,
    train_size: int = 40,
    test_size: int = 60,
    max_len: int = 7,
    noise_rate: float = 0.0,
    seed: int = 42
) -> Dict[str, Any]:
    """
    Creates complete partitioned dataset: Train (with optional noise) and clean Test.
    """
    if benchmark_id:
        bench = get_benchmark(benchmark_id)
        oracle = bench.accepts
        alph = bench.alphabet
    elif custom_oracle and alphabet:
        oracle = custom_oracle
        alph = alphabet
    else:
        raise ValueError("Either benchmark_id or (custom_oracle, alphabet) must be provided.")

    total_needed = train_size + test_size
    all_samples = sample_regular_language(
        oracle_func=oracle,
        alphabet=alph,
        num_samples=total_needed,
        max_len=max_len,
        balance_ratio=0.5,
        seed=seed
    )

    train_raw = all_samples[:train_size]
    test_raw = all_samples[train_size:train_size + test_size]

    train_noisy = inject_noise(train_raw, noise_rate=noise_rate, seed=seed)
    # Test set is kept clean to evaluate true generalization!
    test_clean = [DatasetItem(it.word, it.label, it.original_label, False) for it in test_raw]

    def stats(items: List[DatasetItem]):
        pos = sum(1 for it in items if it.label)
        neg = len(items) - pos
        noisy = sum(1 for it in items if it.is_noisy)
        avg_len = sum(len(it.word) for it in items) / len(items) if items else 0
        return {
            "total": len(items),
            "positives": pos,
            "negatives": neg,
            "noisy_labels": noisy,
            "avg_length": round(avg_len, 2)
        }

    return {
        "alphabet": alph,
        "train": [it.to_dict() for it in train_noisy],
        "test": [it.to_dict() for it in test_clean],
        "train_stats": stats(train_noisy),
        "test_stats": stats(test_clean),
        "noise_rate": noise_rate
    }
