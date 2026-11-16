"""
Exploratory ML Clustering of labeled strings based on automata visitation patterns
and n-gram character distributions.
"""

from typing import List, Dict, Any, Optional
import numpy as np
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
from backend.automata.dfa import DFA


def cluster_strings(
    strings_data: List[Dict[str, Any]],
    dfa: Optional[DFA] = None,
    alphabet: Optional[List[str]] = None,
    n_clusters: int = 2
) -> Dict[str, Any]:
    """
    Extracts feature representations of strings:
    - 1-gram and 2-gram frequencies
    - If DFA is provided, state visitation frequency distribution
    Reduces to 2D via PCA and assigns K-Means cluster labels.
    """
    if not strings_data:
        return {"points": [], "clusters": 0}

    words = [it.get("raw_word", it.get("word", "")) for it in strings_data]
    labels = [bool(it.get("label", False)) for it in strings_data]

    if alphabet is None:
        all_chars = set("".join(words))
        alphabet = sorted(list(all_chars)) if all_chars else ["0", "1"]

    # 1. Feature extraction
    feature_matrix = []

    # Prepare DFA states order if DFA provided
    dfa_states = sorted(list(dfa.states)) if dfa else []
    state_to_idx = {s: i for i, s in enumerate(dfa_states)}

    for w in words:
        feats = []
        # Length
        feats.append(float(len(w)))

        # Character frequencies
        for ch in alphabet:
            feats.append(float(w.count(ch)))

        # Bigram frequencies
        for c1 in alphabet:
            for c2 in alphabet:
                feats.append(float(w.count(c1 + c2)))

        # DFA state visitation profile (if DFA available)
        if dfa and dfa_states:
            visit_counts = [0.0] * len(dfa_states)
            curr = dfa.start_state
            if curr in state_to_idx:
                visit_counts[state_to_idx[curr]] += 1.0

            for ch in w:
                if curr in dfa.transitions and ch in dfa.transitions[curr]:
                    curr = dfa.transitions[curr][ch]
                    if curr in state_to_idx:
                        visit_counts[state_to_idx[curr]] += 1.0

            feats.extend(visit_counts)

        feature_matrix.append(feats)

    X = np.array(feature_matrix, dtype=float)

    # Dimensionality reduction to 2D
    if X.shape[1] >= 2 and X.shape[0] >= 2:
        pca = PCA(n_components=2, random_state=42)
        coords_2d = pca.fit_transform(X)
        explained_variance = float(np.sum(pca.explained_variance_ratio_))
    else:
        coords_2d = np.zeros((len(words), 2))
        for i in range(len(words)):
            coords_2d[i] = [float(len(words[i])), 0.0]
        explained_variance = 1.0

    # K-Means clustering
    actual_k = min(n_clusters, len(words))
    if actual_k >= 2:
        kmeans = KMeans(n_clusters=actual_k, random_state=42, n_init="auto")
        cluster_assignments = kmeans.fit_predict(X).tolist()
    else:
        cluster_assignments = [0] * len(words)

    points = []
    for i, it in enumerate(strings_data):
        w = words[i]
        points.append({
            "word": it.get("word", w if w != "" else "ε"),
            "raw_word": w,
            "x": round(float(coords_2d[i, 0]), 3),
            "y": round(float(coords_2d[i, 1]), 3),
            "true_label": labels[i],
            "cluster": cluster_assignments[i]
        })

    return {
        "points": points,
        "n_clusters": actual_k,
        "explained_variance_ratio": round(explained_variance, 3)
    }
