# TOC Automata Studio: Learning & Visualizing DFA/NFA Models from Training Data

An interactive educational platform designed to learn approximate finite-state automata from labeled strings, visualize states and transitions, simulate string acceptance step-by-step, and explore empirical grammatical inference properties.

---

## 🎯 Project Objectives & Capabilities

1. **Regular Language Dataset Generator**:
   - Synthesizes balanced positive ($S^+$) and negative ($S^−$) training/test samples over configurable alphabets (e.g. $\Sigma = \{0, 1\}$ or $\Sigma = \{a, b\}$).
   - Built-in classic TOC benchmark languages:
     - Even number of `0`s ($L = \{w \mid |w|_0 \equiv 0 \pmod 2\}$)
     - Ends with `01` ($L = \{w \mid w = x01\}$)
     - Contains substring `101` ($L = \{w \mid 101 \text{ is a substring of } w\}$)
     - Binary number divisible by 3 ($L = \{w \mid \text{val}(w) \equiv 0 \pmod 3\}$)
     - Fibonacci language: No consecutive `1`s
     - Starts and ends with same symbol
     - Language $(ab)^*$
   - Supports user-defined custom strings and interactive label editing.

2. **Core TOC Automata Engine**:
   - **DFA Representation**: 5-tuple $(Q, \Sigma, \delta, q_0, F)$ with complete transition tables, unreachable state trimming, and canonical state renaming.
   - **NFA Representation**: 5-tuple $(Q, \Sigma, \Delta, q_0, F)$ with $\epsilon$-closure computation and active state tracking.
   - **Subset Construction (Powerset Construction)**: Formal algorithm converting any NFA to its equivalent deterministic counterpart (DFA).
   - **Myhill-Nerode Minimization**: Table-filling algorithm computing the pairwise distinguishability matrix to produce the unique minimal canonical DFA.
   - **Automata Equivalence Verification**: Formal symmetric difference cross-product automaton ($L(M_1) \oplus L(M_2) = \emptyset$). If not equivalent, computes the **shortest distinguishing counterexample** via BFS.

3. **Grammatical Inference Algorithms**:
   - **Prefix Tree Acceptor (PTA)**: Builds the maximal prefix tree automaton accepting $S^+$.
   - **RPNI (Regular Positive and Negative Inference)**: Canonical shortlex state merging with quotient determinization folding and consistency check against negative constraints ($S^−$).
   - **EDSM (Evidence-Driven State Merging)**: Selects merge candidates based on highest statistical evidence scores.
   - **Angluin's $L^*$ (Active Learning)**: Minimally Adequate Teacher (MAT) framework maintaining an interactive Observation Table $T(S, E)$ with closedness and consistency checks.

4. **Interactive Educational Visualizations**:
   - Canvas-accelerated graph renderer (Cytoscape.js) displaying states (circles, start arrow, double circles for accepting states) and transitions.
   - **Live Step-by-Step Simulator**: Step forward/backward, auto-play, inspect active states with glowing highlights, and compare Inferred DFA vs. Reference Ground Truth side-by-side.
   - **Myhill-Nerode Distinguishability Matrix**: Triangular grid showing distinguishable state pairs $(p, q)$ with step-by-step diagnostic reasoning.
   - **Merge History Timeline**: Step-by-step log of RPNI merges (accepted vs rolled back due to negative conflict).
   - **Observation Table Explorer**: Interactive matrix of Angluin's $L^*$ prefixes and test suffixes.

5. **Empirical Noise & Sample Size Studies**:
   - **Sample Quantity Learning Curve**: Generalization accuracy and state count vs. training set size $N$.
   - **Label Noise Sensitivity**: State complexity explosion and accuracy degradation under corrupted labels ($\eta \in [0\%, 30\%]$).
   - **ML Exploratory Clustering**: 2D PCA projection of strings based on character n-grams and DFA state visitation profiles.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+ (already bundled/built)

### 1. Launch Unified Application (FastAPI + React)
Run the launcher script from the project root:
```bash
python run.py
```
Open your browser at **`http://127.0.0.1:8000`**.

### 2. Run Backend Unit Tests
To verify all TOC formal algorithms, equivalence checkers, and learning pipelines:
```bash
python -m unittest discover -s backend/tests -p "test_*.py"
```

### 3. Frontend Development Mode (Optional)
If you wish to edit frontend React components with live hot-reloading:
```bash
cd frontend
npm run dev
```
Access the dev server at `http://localhost:5173`.

---

## 📁 Repository Structure

```
d:\TOC/
├── backend/
│   ├── main.py                  # FastAPI application entry point & static server
│   ├── api.py                   # REST API endpoints
│   ├── automata/
│   │   ├── dfa.py               # DFA model, simulation trace, state completion
│   │   ├── nfa.py               # NFA model, epsilon closure, subset construction
│   │   ├── minimization.py      # Myhill-Nerode Table-Filling minimization
│   │   └── equivalence.py       # Cross-product automaton equivalence & counterexamples
│   ├── datasets/
│   │   ├── benchmarks.py        # Preset classic TOC languages & reference DFAs
│   │   └── generator.py         # Balanced sampler, noise injector, train/test split
│   ├── learning/
│   │   ├── pta.py               # Prefix Tree Acceptor (PTA) construction
│   │   ├── rpni.py              # RPNI algorithm with quotient folding & rollback
│   │   ├── edsm.py              # Evidence-Driven State Merging (EDSM)
│   │   └── active_learning.py   # Angluin's L* Active Learning & Observation Table
│   ├── analysis/
│   │   ├── metrics.py           # Classification metrics & confusion matrix
│   │   ├── noise_study.py       # Sample size & label noise empirical experiments
│   │   └── clustering.py        # ML PCA 2D embedding & K-Means clustering
│   └── tests/
│       ├── test_automata.py     # Unit tests for DFA, NFA, minimization, equivalence
│       ├── test_inference.py    # Unit tests for RPNI, EDSM, Angluin L*
│       └── test_api.py          # FastAPI endpoint integration tests
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── dist/                    # Compiled production static bundle
│   └── src/
│       ├── App.jsx              # Main dashboard state & coordination
│       └── components/
│           ├── Navbar.jsx       # Studio navigation
│           ├── AutomataGraph.jsx# Cytoscape.js automata visualizer
│           ├── DatasetPanel.jsx # Dataset generator & editor
│           ├── LearningPanel.jsx# Inference runner & merge inspector
│           ├── SimulationPanel.jsx # Step-by-step string acceptance debugger
│           ├── TOCVerificationPanel.jsx # Equivalence & Myhill-Nerode matrix
│           └── NoiseStudyPanel.jsx # Learning curves & 2D PCA clustering
└── run.py                       # Single-command launcher
```
