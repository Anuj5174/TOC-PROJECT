"""
Prefix Tree Acceptor (PTA) construction.
Given positive strings S+, builds a tree DFA whose states correspond to prefixes of S+.
"""

from typing import List, Set, Dict, Tuple, Any
from backend.automata.dfa import DFA


class PTA:
    def __init__(self, positive_strings: List[str], alphabet: Set[str]):
        self.alphabet = set(alphabet)
        self.positive_strings = sorted(list(set(positive_strings)))
        
        # States are identified by prefix strings
        self.prefixes: List[str] = [""]
        self.prefix_to_id: Dict[str, str] = {"": "p0"}
        self.id_to_prefix: Dict[str, str] = {"p0": ""}
        
        counter = 1
        for word in self.positive_strings:
            curr = ""
            for char in word:
                curr += char
                if curr not in self.prefix_to_id:
                    pid = f"p{counter}"
                    counter += 1
                    self.prefix_to_id[curr] = pid
                    self.id_to_prefix[pid] = curr
                    self.prefixes.append(curr)

        self.states = set(self.prefix_to_id.values())
        self.start_state = self.prefix_to_id[""]
        self.accepting_states = {
            self.prefix_to_id[w] for w in self.positive_strings if w in self.prefix_to_id
        }

        # Transitions: delta(prefix, char) = prefix + char
        self.transitions: Dict[str, Dict[str, str]] = {s: {} for s in self.states}
        for pref, pid in self.prefix_to_id.items():
            for char in self.alphabet:
                nxt_pref = pref + char
                if nxt_pref in self.prefix_to_id:
                    nxt_id = self.prefix_to_id[nxt_pref]
                    self.transitions[pid][char] = nxt_id

    def to_dfa(self) -> DFA:
        """Converts PTA to standard DFA object."""
        return DFA(
            states=set(self.states),
            alphabet=set(self.alphabet),
            transitions={s: dict(out) for s, out in self.transitions.items()},
            start_state=self.start_state,
            accepting_states=set(self.accepting_states)
        )

    def to_dict(self) -> Dict[str, Any]:
        dfa = self.to_dfa()
        d = dfa.to_dict()
        d["prefix_mapping"] = self.id_to_prefix
        return d
