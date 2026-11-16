"""
Automata Equivalence and Counterexample Search.
Uses the Product Automaton Symmetric Difference technique:
L(M1) == L(M2) <=> L(M1 x M2 with F_xor) == empty set.
If not equivalent, extracts the shortest counterexample string.
"""

from typing import Dict, Set, List, Optional, Tuple, Any
from collections import deque
from backend.automata.dfa import DFA


def check_dfa_equivalence(dfa1: DFA, dfa2: DFA) -> Dict[str, Any]:
    """
    Checks if dfa1 and dfa2 are equivalent: L(dfa1) == L(dfa2).
    Returns:
        {
            "equivalent": bool,
            "counterexample": Optional[str],
            "counterexample_details": Optional[dict],
            "dfa1_states": int,
            "dfa2_states": int
        }
    """
    joint_alphabet = sorted(list(dfa1.alphabet.union(dfa2.alphabet)))
    
    # Ensure both are complete over joint_alphabet
    def make_complete(dfa: DFA) -> DFA:
        states = set(dfa.states)
        transitions = {s: dict(dfa.transitions.get(s, {})) for s in states}
        sink = "SINK_TRAP"
        while sink in states:
            sink += "_"

        needs_sink = False
        for s in states:
            for a in joint_alphabet:
                if a not in transitions.get(s, {}):
                    needs_sink = True
                    break
            if needs_sink:
                break

        if needs_sink:
            states.add(sink)
            transitions[sink] = {a: sink for a in joint_alphabet}
            for s in states:
                if s not in transitions:
                    transitions[s] = {}
                for a in joint_alphabet:
                    if a not in transitions[s]:
                        transitions[s][a] = sink

        return DFA(
            states=states,
            alphabet=set(joint_alphabet),
            transitions=transitions,
            start_state=dfa.start_state,
            accepting_states=set(dfa.accepting_states)
        )

    m1 = make_complete(dfa1.trim())
    m2 = make_complete(dfa2.trim())

    # BFS on Product Automaton: states are (q1, q2)
    start_pair = (m1.start_state, m2.start_state)
    queue = deque([(start_pair, "")])
    visited: Set[Tuple[str, str]] = {start_pair}

    while queue:
        (p, q), path = queue.popleft()

        p_acc = p in m1.accepting_states
        q_acc = q in m2.accepting_states

        # Symmetric difference condition: one accepts, the other rejects
        if p_acc != q_acc:
            dfa1_acc = dfa1.accepts(path)
            dfa2_acc = dfa2.accepts(path)
            return {
                "equivalent": False,
                "counterexample": path if path != "" else "ε (empty string)",
                "raw_counterexample": path,
                "counterexample_details": {
                    "string": path,
                    "dfa1_accepts": dfa1_acc,
                    "dfa2_accepts": dfa2_acc,
                    "explanation": f"String '{path or 'ε'}' is {'accepted' if dfa1_acc else 'rejected'} by Machine 1, but {'accepted' if dfa2_acc else 'rejected'} by Machine 2."
                },
                "dfa1_states": len(dfa1.states),
                "dfa2_states": len(dfa2.states)
            }

        # Expand transitions for all symbols in joint alphabet
        for a in joint_alphabet:
            nxt_p = m1.transitions[p][a]
            nxt_q = m2.transitions[q][a]
            nxt_pair = (nxt_p, nxt_q)

            if nxt_pair not in visited:
                visited.add(nxt_pair)
                queue.append((nxt_pair, path + a))

    return {
        "equivalent": True,
        "counterexample": None,
        "counterexample_details": None,
        "dfa1_states": len(dfa1.states),
        "dfa2_states": len(dfa2.states)
    }
