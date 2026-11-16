"""
Nondeterministic Finite Automaton (NFA with epsilon-transitions).
Formal definition: N = (Q, Sigma, Delta, q0, F)
Supports epsilon-closure, subset construction (NFA -> DFA), and active-state simulation.
"""

from typing import Dict, Set, List, Any, Optional
from collections import deque
from backend.automata.dfa import DFA

EPSILON = "ε"


class NFA:
    def __init__(
        self,
        states: Set[str],
        alphabet: Set[str],
        transitions: Dict[str, Dict[str, Set[str]]],
        start_state: str,
        accepting_states: Set[str]
    ):
        self.states = {str(s) for s in states}
        self.alphabet = {str(a) for a in alphabet if a != EPSILON and a != "e"}
        self.start_state = str(start_state)
        self.accepting_states = {str(s) for s in accepting_states}
        
        # transitions: {state: {symbol: {target_states}}}
        self.transitions: Dict[str, Dict[str, Set[str]]] = {}
        for s in self.states:
            self.transitions[s] = {}

        for s, outgoing in transitions.items():
            s_str = str(s)
            if s_str not in self.transitions:
                self.transitions[s_str] = {}
            for sym, tgts in outgoing.items():
                sym_str = EPSILON if (sym == "e" or sym == EPSILON) else str(sym)
                tgts_set = {str(t) for t in tgts}
                self.transitions[s_str][sym_str] = tgts_set

    def epsilon_closure(self, states: Set[str]) -> Set[str]:
        """Calculates epsilon-closure for a set of states using BFS."""
        closure = set(states)
        queue = deque(list(states))

        while queue:
            curr = queue.popleft()
            eps_targets = self.transitions.get(curr, {}).get(EPSILON, set())
            for nxt in eps_targets:
                if nxt not in closure:
                    closure.add(nxt)
                    queue.append(nxt)
        return closure

    def step(self, current_states: Set[str], symbol: str) -> Set[str]:
        """Takes a transition on symbol followed by epsilon-closure."""
        next_states = set()
        for s in current_states:
            targets = self.transitions.get(s, {}).get(symbol, set())
            next_states.update(targets)
        return self.epsilon_closure(next_states)

    def accepts(self, word: str) -> bool:
        """Determines whether the NFA accepts the word."""
        curr_states = self.epsilon_closure({self.start_state})
        for char in word:
            if char not in self.alphabet:
                return False
            curr_states = self.step(curr_states, char)
            if not curr_states:
                return False
        return bool(curr_states.intersection(self.accepting_states))

    def simulate(self, word: str) -> Dict[str, Any]:
        """
        Simulate word execution on NFA step-by-step.
        Records active state sets at every step.
        """
        trace = []
        curr_states = self.epsilon_closure({self.start_state})
        
        trace.append({
            "step": 0,
            "active_states": sorted(list(curr_states)),
            "read_char": None,
            "is_accepting": bool(curr_states.intersection(self.accepting_states)),
            "remaining_word": word
        })

        for idx, char in enumerate(word):
            if char not in self.alphabet:
                trace.append({
                    "step": idx + 1,
                    "active_states": [],
                    "read_char": char,
                    "is_accepting": False,
                    "remaining_word": word[idx + 1:],
                    "rejected_reason": f"Symbol '{char}' not in alphabet"
                })
                return {
                    "word": word,
                    "accepted": False,
                    "final_states": [],
                    "trace": trace
                }

            next_states = self.step(curr_states, char)
            remaining = word[idx + 1:]
            trace.append({
                "step": idx + 1,
                "active_states": sorted(list(next_states)),
                "read_char": char,
                "is_accepting": bool(next_states.intersection(self.accepting_states)) if remaining == "" else False,
                "remaining_word": remaining
            })
            curr_states = next_states

        is_accepted = bool(curr_states.intersection(self.accepting_states))

        return {
            "word": word,
            "accepted": is_accepted,
            "final_states": sorted(list(curr_states)),
            "trace": trace
        }

    def to_dfa(self) -> DFA:
        """
        Powerset / Subset Construction: Converts NFA to an equivalent DFA.
        """
        initial_closure = frozenset(self.epsilon_closure({self.start_state}))
        
        dfa_states_map = {initial_closure: "q0"}
        queue = deque([initial_closure])
        
        dfa_transitions: Dict[str, Dict[str, str]] = {}
        dfa_accepting: Set[str] = set()
        state_counter = 1

        while queue:
            curr_set = queue.popleft()
            curr_name = dfa_states_map[curr_set]
            dfa_transitions[curr_name] = {}

            if any(s in self.accepting_states for s in curr_set):
                dfa_accepting.add(curr_name)

            for sym in sorted(list(self.alphabet)):
                nxt_set = frozenset(self.step(set(curr_set), sym))
                if not nxt_set:
                    # Empty set state / trap state
                    if nxt_set not in dfa_states_map:
                        trap_name = f"q{state_counter}"
                        state_counter += 1
                        dfa_states_map[nxt_set] = trap_name
                        queue.append(nxt_set)
                    target_name = dfa_states_map[nxt_set]
                else:
                    if nxt_set not in dfa_states_map:
                        new_name = f"q{state_counter}"
                        state_counter += 1
                        dfa_states_map[nxt_set] = new_name
                        queue.append(nxt_set)
                    target_name = dfa_states_map[nxt_set]

                dfa_transitions[curr_name][sym] = target_name

        all_dfa_states = set(dfa_states_map.values())
        return DFA(
            states=all_dfa_states,
            alphabet=set(self.alphabet),
            transitions=dfa_transitions,
            start_state="q0",
            accepting_states=dfa_accepting
        ).rename_states("q")

    def to_dict(self) -> Dict[str, Any]:
        """Serializes NFA into JSON-compatible dictionary."""
        edge_list = []
        for src, outgoing in self.transitions.items():
            for sym, tgts in outgoing.items():
                for tgt in tgts:
                    edge_list.append({
                        "from": src,
                        "to": tgt,
                        "label": sym
                    })

        return {
            "type": "NFA",
            "states": sorted(list(self.states)),
            "alphabet": sorted(list(self.alphabet)),
            "start_state": self.start_state,
            "accepting_states": sorted(list(self.accepting_states)),
            "transitions": edge_list
        }
