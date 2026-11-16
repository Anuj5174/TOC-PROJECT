"""
State minimization algorithms for DFA:
1. Myhill-Nerode Table-Filling Algorithm (Distinguishability Matrix) - ideal for educational visualization.
2. Hopcroft's Partition Refinement Algorithm.
"""

from typing import Dict, Set, List, Tuple, Any
from collections import deque
from backend.automata.dfa import DFA


def minimize_dfa_table_filling(dfa: DFA) -> Tuple[DFA, Dict[str, Any]]:
    """
    Minimizes a DFA using the Myhill-Nerode Table-Filling method.
    Returns:
        (minimized_dfa, visualization_data)
        where visualization_data includes initial markings, iterative markings,
        and final equivalence classes.
    """
    # 1. First remove unreachable states and ensure complete transitions
    trimmed = dfa.trim().complete("DEAD")
    states = sorted(list(trimmed.states))
    n = len(states)
    alphabet = sorted(list(trimmed.alphabet))

    # state to index
    s_idx = {s: i for i, s in enumerate(states)}

    # Table of pairs (i, j) where i > j
    # marked[(i, j)] = True if distinguishable
    marked: Dict[Tuple[int, int], bool] = {}
    marked_reason: Dict[Tuple[int, int], str] = {}
    history: List[Dict[str, Any]] = []

    for i in range(n):
        for j in range(i):
            pair = (i, j)
            marked[pair] = False
            marked_reason[pair] = ""

    # Base step: Mark pairs where one is accepting and the other is not
    base_marked_count = 0
    for i in range(n):
        for j in range(i):
            s1, s2 = states[i], states[j]
            s1_acc = s1 in trimmed.accepting_states
            s2_acc = s2 in trimmed.accepting_states
            if s1_acc != s2_acc:
                marked[(i, j)] = True
                marked_reason[(i, j)] = f"Base: {s1} is {'accepting' if s1_acc else 'non-accepting'}, but {s2} is {'accepting' if s2_acc else 'non-accepting'}"
                base_marked_count += 1

    history.append({
        "iteration": 0,
        "newly_marked_count": base_marked_count,
        "description": "Base step: marked pairs with differing acceptance status."
    })

    # Inductive step: repeat until no new pairs are marked
    changed = True
    iteration = 1
    while changed:
        changed = False
        iteration_new = 0
        for i in range(n):
            for j in range(i):
                if not marked[(i, j)]:
                    s1, s2 = states[i], states[j]
                    for sym in alphabet:
                        t1 = trimmed.transitions[s1][sym]
                        t2 = trimmed.transitions[s2][sym]
                        if t1 != t2:
                            idx1, idx2 = s_idx[t1], s_idx[t2]
                            p = (max(idx1, idx2), min(idx1, idx2))
                            if marked.get(p, False):
                                marked[(i, j)] = True
                                marked_reason[(i, j)] = f"On '{sym}', transitions to ({t1}, {t2}) which is marked"
                                changed = True
                                iteration_new += 1
                                break
        history.append({
            "iteration": iteration,
            "newly_marked_count": iteration_new,
            "description": f"Iteration {iteration}: marked {iteration_new} new distinguishable pairs."
        })
        iteration += 1

    # Form equivalence classes via Disjoint Set / Union-Find
    parent = {s: s for s in states}

    def find(u: str) -> str:
        if parent[u] != u:
            parent[u] = find(parent[u])
        return parent[u]

    def union(u: str, v: str):
        ru, rv = find(u), find(v)
        if ru != rv:
            parent[ru] = rv

    for i in range(n):
        for j in range(i):
            if not marked[(i, j)]:
                union(states[i], states[j])

    classes: Dict[str, List[str]] = {}
    for s in states:
        root = find(s)
        if root not in classes:
            classes[root] = []
        classes[root].append(s)

    # Build representative mapping
    rep_map: Dict[str, str] = {}
    merged_states: Set[str] = set()
    for root, group in classes.items():
        # Canonical label: sorted group joined or chosen representative
        rep_name = "{" + ",".join(sorted(group)) + "}"
        merged_states.add(rep_name)
        for s in group:
            rep_map[s] = rep_name

    new_start = rep_map[trimmed.start_state]
    new_accepting = {rep_map[s] for s in trimmed.accepting_states if s in rep_map}
    new_transitions: Dict[str, Dict[str, str]] = {}

    for rep in merged_states:
        new_transitions[rep] = {}

    for s, outgoing in trimmed.transitions.items():
        rep_src = rep_map[s]
        for sym, tgt in outgoing.items():
            rep_tgt = rep_map[tgt]
            new_transitions[rep_src][sym] = rep_tgt

    minimized = DFA(
        states=merged_states,
        alphabet=set(alphabet),
        transitions=new_transitions,
        start_state=new_start,
        accepting_states=new_accepting
    ).rename_states("q")

    # Table visualization data
    table_grid = []
    for i in range(n):
        row = []
        for j in range(i):
            pair = (i, j)
            row.append({
                "state1": states[i],
                "state2": states[j],
                "distinguishable": marked[pair],
                "reason": marked_reason[pair]
            })
        if row:
            table_grid.append({
                "state": states[i],
                "cells": row
            })

    viz_data = {
        "original_states_count": len(dfa.states),
        "minimized_states_count": len(minimized.states),
        "states_list": states,
        "table_grid": table_grid,
        "history": history,
        "equivalence_classes": [sorted(grp) for grp in classes.values()]
    }

    return minimized, viz_data
