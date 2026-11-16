"""
Benchmark Regular Languages and their canonical Reference DFAs for TOC education.
Includes languages with varying complexity (state count 2 to 5).
"""

from typing import Dict, Any, Callable
from backend.automata.dfa import DFA


class BenchmarkLanguage:
    def __init__(
        self,
        id: str,
        name: str,
        alphabet: list,
        description: str,
        formal_definition: str,
        reference_dfa: DFA,
        oracle_func: Callable[[str], bool]
    ):
        self.id = id
        self.name = name
        self.alphabet = alphabet
        self.description = description
        self.formal_definition = formal_definition
        self.reference_dfa = reference_dfa
        self.oracle_func = oracle_func

    def accepts(self, word: str) -> bool:
        return self.oracle_func(word)


def _build_benchmarks() -> Dict[str, BenchmarkLanguage]:
    benchmarks = {}

    # 1. Even number of 0s over {0, 1}
    dfa_even_0s = DFA(
        states={"q0", "q1"},
        alphabet={"0", "1"},
        transitions={
            "q0": {"0": "q1", "1": "q0"},
            "q1": {"0": "q0", "1": "q1"}
        },
        start_state="q0",
        accepting_states={"q0"}
    )
    benchmarks["even_zeros"] = BenchmarkLanguage(
        id="even_zeros",
        name="Even Number of 0s",
        alphabet=["0", "1"],
        description="Accepts binary strings containing an even number of 0s (0, 2, 4, ...).",
        formal_definition="L = { w ∈ {0, 1}* | |w|_0 ≡ 0 (mod 2) }",
        reference_dfa=dfa_even_0s,
        oracle_func=lambda w: w.count("0") % 2 == 0
    )

    # 2. Ends with '01' over {0, 1}
    dfa_ends_01 = DFA(
        states={"q0", "q1", "q2"},
        alphabet={"0", "1"},
        transitions={
            "q0": {"0": "q1", "1": "q0"},
            "q1": {"0": "q1", "1": "q2"},
            "q2": {"0": "q1", "1": "q0"}
        },
        start_state="q0",
        accepting_states={"q2"}
    )
    benchmarks["ends_with_01"] = BenchmarkLanguage(
        id="ends_with_01",
        name="Ends with '01'",
        alphabet=["0", "1"],
        description="Accepts all binary strings ending with the suffix '01'.",
        formal_definition="L = { w ∈ {0, 1}* | w = x01 for some x ∈ {0, 1}* }",
        reference_dfa=dfa_ends_01,
        oracle_func=lambda w: w.endswith("01")
    )

    # 3. Contains substring '101'
    dfa_contains_101 = DFA(
        states={"q0", "q1", "q2", "q3"},
        alphabet={"0", "1"},
        transitions={
            "q0": {"0": "q0", "1": "q1"},
            "q1": {"0": "q2", "1": "q1"},
            "q2": {"0": "q0", "1": "q3"},
            "q3": {"0": "q3", "1": "q3"}
        },
        start_state="q0",
        accepting_states={"q3"}
    )
    benchmarks["contains_101"] = BenchmarkLanguage(
        id="contains_101",
        name="Contains Substring '101'",
        alphabet=["0", "1"],
        description="Accepts binary strings that contain '101' as a contiguous substring.",
        formal_definition="L = { w ∈ {0, 1}* | w contains '101' }",
        reference_dfa=dfa_contains_101,
        oracle_func=lambda w: "101" in w
    )

    # 4. Binary number divisible by 3 (empty string = 0 divisible by 3)
    # Transitions track modulo remainder: q0=0 mod 3, q1=1 mod 3, q2=2 mod 3
    dfa_mod3 = DFA(
        states={"q0", "q1", "q2"},
        alphabet={"0", "1"},
        transitions={
            "q0": {"0": "q0", "1": "q1"},
            "q1": {"0": "q2", "1": "q0"},
            "q2": {"0": "q1", "1": "q2"}
        },
        start_state="q0",
        accepting_states={"q0"}
    )
    benchmarks["divisible_by_3"] = BenchmarkLanguage(
        id="divisible_by_3",
        name="Binary Divisible by 3",
        alphabet=["0", "1"],
        description="Interprets binary string as integer value (MSB to LSB). Accepts if divisible by 3.",
        formal_definition="L = { w ∈ {0, 1}* | val(w) ≡ 0 (mod 3) }",
        reference_dfa=dfa_mod3,
        oracle_func=lambda w: (int(w, 2) % 3 == 0) if w else True
    )

    # 5. No consecutive 1s (Fibonacci language)
    dfa_no_consecutive_1s = DFA(
        states={"q0", "q1", "q_dead"},
        alphabet={"0", "1"},
        transitions={
            "q0": {"0": "q0", "1": "q1"},
            "q1": {"0": "q0", "1": "q_dead"},
            "q_dead": {"0": "q_dead", "1": "q_dead"}
        },
        start_state="q0",
        accepting_states={"q0", "q1"}
    )
    benchmarks["no_consecutive_1s"] = BenchmarkLanguage(
        id="no_consecutive_1s",
        name="No Consecutive 1s",
        alphabet=["0", "1"],
        description="Accepts binary strings that never contain '11'.",
        formal_definition="L = { w ∈ {0, 1}* | w does not contain '11' }",
        reference_dfa=dfa_no_consecutive_1s,
        oracle_func=lambda w: "11" not in w
    )

    # 6. Starts and ends with same symbol over {a, b}
    dfa_same_start_end = DFA(
        states={"q0", "qa", "qa_ok", "qb", "qb_ok"},
        alphabet={"a", "b"},
        transitions={
            "q0": {"a": "qa_ok", "b": "qb_ok"},
            "qa_ok": {"a": "qa_ok", "b": "qa"},
            "qa": {"a": "qa_ok", "b": "qa"},
            "qb_ok": {"a": "qb", "b": "qb_ok"},
            "qb": {"a": "qb", "b": "qb_ok"}
        },
        start_state="q0",
        accepting_states={"qa_ok", "qb_ok"}
    )
    benchmarks["same_start_end"] = BenchmarkLanguage(
        id="same_start_end",
        name="Starts and Ends with Same Symbol",
        alphabet=["a", "b"],
        description="Accepts strings over {a, b} of length >= 1 that begin and end with the same letter.",
        formal_definition="L = { w ∈ {a, b}+ | w[0] = w[-1] }",
        reference_dfa=dfa_same_start_end,
        oracle_func=lambda w: len(w) >= 1 and w[0] == w[-1]
    )

    # 7. (ab)* over {a, b}
    dfa_ab_star = DFA(
        states={"q0", "q1", "q_trap"},
        alphabet={"a", "b"},
        transitions={
            "q0": {"a": "q1", "b": "q_trap"},
            "q1": {"a": "q_trap", "b": "q0"},
            "q_trap": {"a": "q_trap", "b": "q_trap"}
        },
        start_state="q0",
        accepting_states={"q0"}
    )
    benchmarks["ab_star"] = BenchmarkLanguage(
        id="ab_star",
        name="Language (ab)*",
        alphabet=["a", "b"],
        description="Accepts alternating sequences of 'ab', including the empty string ε.",
        formal_definition="L = { (ab)^k | k >= 0 }",
        reference_dfa=dfa_ab_star,
        oracle_func=lambda w: len(w) % 2 == 0 and all(w[i:i+2] == "ab" for i in range(0, len(w), 2))
    )

    return benchmarks


BENCHMARKS = _build_benchmarks()


def get_benchmark(benchmark_id: str) -> BenchmarkLanguage:
    if benchmark_id not in BENCHMARKS:
        raise ValueError(f"Unknown benchmark ID '{benchmark_id}'. Available: {list(BENCHMARKS.keys())}")
    return BENCHMARKS[benchmark_id]


def list_benchmarks() -> list:
    return [
        {
            "id": b.id,
            "name": b.name,
            "alphabet": b.alphabet,
            "description": b.description,
            "formal_definition": b.formal_definition,
            "state_count": len(b.reference_dfa.states)
        }
        for b in BENCHMARKS.values()
    ]
