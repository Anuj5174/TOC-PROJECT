"""
Deterministic Finite Automaton (DFA) representation and simulation.
Formal definition: M = (Q, Sigma, delta, q0, F)
"""

from typing import Dict, Set, List, Any, Optional, Tuple
from collections import deque


class DFA:
    def __init__(
        self,
        states: Set[str],
        alphabet: Set[str],
        transitions: Dict[str, Dict[str, str]],
        start_state: str,
        accepting_states: Set[str]
    ):
        self.states = {str(s) for s in states}
        self.alphabet = {str(a) for a in alphabet}
        self.start_state = str(start_state)
        self.accepting_states = {str(s) for s in accepting_states}
        
        # transitions: {state: {symbol: next_state}}
        self.transitions: Dict[str, Dict[str, str]] = {}
        for s in self.states:
            self.transitions[s] = {}
        
        for s, outgoing in transitions.items():
            s_str = str(s)
            if s_str not in self.transitions:
                self.transitions[s_str] = {}
            for sym, nxt in outgoing.items():
                sym_str = str(sym)
                self.transitions[s_str][sym_str] = str(nxt)

    def accepts(self, word: str) -> bool:
        curr = self.start_state
        for char in word:
            if char not in self.alphabet:
                return False
            if curr not in self.transitions or char not in self.transitions[curr]:
                return False
            curr = self.transitions[curr][char]
        return curr in self.accepting_states

    def simulate(self, word: str) -> Dict[str, Any]:
        """
        Simulate word execution step-by-step.
        Returns detailed step trace, whether word was accepted, and final state.
        """
        trace = []
        curr = self.start_state
        
        # Initial step
        trace.append({
            "step": 0,
            "state": curr,
            "read_char": None,
            "next_state": curr,
            "is_accepting": curr in self.accepting_states,
            "remaining_word": word
        })

        rejected_early = False
        reason = None

        for idx, char in enumerate(word):
            if char not in self.alphabet:
                rejected_early = True
                reason = f"Symbol '{char}' not in alphabet {sorted(list(self.alphabet))}"
                break
            
            if curr not in self.transitions or char not in self.transitions[curr]:
                rejected_early = True
                reason = f"No transition defined from state '{curr}' on symbol '{char}'"
                break
                
            nxt = self.transitions[curr][char]
            remaining = word[idx + 1:]
            trace.append({
                "step": idx + 1,
                "state": curr,
                "read_char": char,
                "next_state": nxt,
                "is_accepting": nxt in self.accepting_states if remaining == "" else False,
                "remaining_word": remaining
            })
            curr = nxt

        is_accepted = (not rejected_early) and (curr in self.accepting_states)

        return {
            "word": word,
            "accepted": is_accepted,
            "final_state": curr if not rejected_early else None,
            "rejected_early": rejected_early,
            "rejection_reason": reason,
            "trace": trace
        }

    def reachable_states(self) -> Set[str]:
        """Finds all states reachable from the start state via BFS."""
        visited = set()
        queue = deque([self.start_state])
        if self.start_state in self.states:
            visited.add(self.start_state)

        while queue:
            curr = queue.popleft()
            for sym, nxt in self.transitions.get(curr, {}).items():
                if nxt in self.states and nxt not in visited:
                    visited.add(nxt)
                    queue.append(nxt)
        return visited

    def trim(self) -> 'DFA':
        """Returns a new DFA with unreachable states removed."""
        reach = self.reachable_states()
        new_transitions = {
            s: {a: nxt for a, nxt in self.transitions[s].items() if nxt in reach}
            for s in reach
        }
        return DFA(
            states=reach,
            alphabet=set(self.alphabet),
            transitions=new_transitions,
            start_state=self.start_state,
            accepting_states=self.accepting_states.intersection(reach)
        )

    def complete(self, sink_name: str = "DEAD") -> 'DFA':
        """
        Returns a complete DFA where every state has an outgoing transition
        for every symbol in Sigma (introducing a sink/dead state if needed).
        """
        needs_sink = False
        new_transitions = {s: dict(outgoing) for s, outgoing in self.transitions.items()}
        new_states = set(self.states)
        
        # Check if sink is needed
        for s in self.states:
            for sym in self.alphabet:
                if sym not in new_transitions.get(s, {}):
                    needs_sink = True
                    break
            if needs_sink:
                break

        if needs_sink:
            # Ensure unique sink name
            actual_sink = sink_name
            idx = 1
            while actual_sink in new_states:
                actual_sink = f"{sink_name}_{idx}"
                idx += 1
            
            new_states.add(actual_sink)
            new_transitions[actual_sink] = {sym: actual_sink for sym in self.alphabet}
            
            for s in self.states:
                if s not in new_transitions:
                    new_transitions[s] = {}
                for sym in self.alphabet:
                    if sym not in new_transitions[s]:
                        new_transitions[s][sym] = actual_sink

        return DFA(
            states=new_states,
            alphabet=set(self.alphabet),
            transitions=new_transitions,
            start_state=self.start_state,
            accepting_states=set(self.accepting_states)
        )

    def rename_states(self, prefix: str = "q") -> 'DFA':
        """
        Canonically renames states to prefix_0, prefix_1, ...
        with start_state always mapped to prefix_0, followed by BFS order.
        """
        mapping: Dict[str, str] = {self.start_state: f"{prefix}0"}
        counter = 1
        queue = deque([self.start_state])
        
        visited = {self.start_state}
        while queue:
            curr = queue.popleft()
            for sym in sorted(list(self.alphabet)):
                nxt = self.transitions.get(curr, {}).get(sym)
                if nxt and nxt not in mapping:
                    mapping[nxt] = f"{prefix}{counter}"
                    counter += 1
                    visited.add(nxt)
                    queue.append(nxt)

        # In case there are unreachable states
        for s in sorted(list(self.states)):
            if s not in mapping:
                mapping[s] = f"{prefix}{counter}"
                counter += 1

        new_states = {mapping[s] for s in self.states}
        new_start = mapping[self.start_state]
        new_accepting = {mapping[s] for s in self.accepting_states if s in mapping}
        new_transitions = {}
        for s, outgoing in self.transitions.items():
            mapped_s = mapping[s]
            new_transitions[mapped_s] = {}
            for sym, nxt in outgoing.items():
                if nxt in mapping:
                    new_transitions[mapped_s][sym] = mapping[nxt]

        return DFA(
            states=new_states,
            alphabet=set(self.alphabet),
            transitions=new_transitions,
            start_state=new_start,
            accepting_states=new_accepting
        )

    def to_dict(self) -> Dict[str, Any]:
        """Serializes DFA into JSON-compatible dictionary."""
        edge_list = []
        for src, outgoing in self.transitions.items():
            for sym, tgt in outgoing.items():
                edge_list.append({
                    "from": src,
                    "to": tgt,
                    "label": sym
                })

        return {
            "type": "DFA",
            "states": sorted(list(self.states)),
            "alphabet": sorted(list(self.alphabet)),
            "start_state": self.start_state,
            "accepting_states": sorted(list(self.accepting_states)),
            "transitions": edge_list,
            "transition_table": self.transitions
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'DFA':
        """Constructs DFA from serialized dictionary."""
        states = set(data["states"])
        alphabet = set(data["alphabet"])
        start_state = data["start_state"]
        accepting_states = set(data["accepting_states"])
        
        transitions = {}
        if "transition_table" in data and data["transition_table"]:
            transitions = data["transition_table"]
        elif "transitions" in data:
            for edge in data["transitions"]:
                src = edge["from"]
                tgt = edge["to"]
                lbl = edge["label"]
                if src not in transitions:
                    transitions[src] = {}
                transitions[src][lbl] = tgt

        return cls(
            states=states,
            alphabet=alphabet,
            transitions=transitions,
            start_state=start_state,
            accepting_states=accepting_states
        )
