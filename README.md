# Problem 8: Learning and Visualizing DFA/NFA Models from Training Data

An interactive educational platform designed to learn approximate finite-state automata from labeled strings, visualize states and transitions, simulate string acceptance step-by-step, compare predictions with reference labels, and investigate how training quantity, diversity, and quality affect the inferred model.

---

## 🎯 Problem Statement & Objectives

### Problem Statement
> Develop an educational application that learns an approximate finite-state automaton from labeled strings and provides an interactive visualization of the inferred machine. Users should be able to enter training examples, inspect the resulting states and transitions, test new strings, and compare predictions with reference labels. The application should investigate how the quantity, diversity, and quality of training examples affect the inferred model.

### Key Objectives
1. **Design a dataset generator for regular languages over configurable alphabets**:
   - Synthesizes balanced positive ($S^+$) and negative ($S^−$) training and test samples over configurable alphabets (e.g. $\Sigma = \{0, 1\}$ or $\Sigma = \{a, b\}$).
   - Built-in classic benchmark languages (Even 0s, Ends with 01, Contains substring 101, Divisible by 3, Fibonacci language, etc.).
   - Interactive user input for custom labeled strings and sample adjustments.

2. **Implement DFA and NFA representations and string-acceptance simulation**:
   - **DFA Representation**: Complete 5-tuple $(Q, \Sigma, \delta, q_0, F)$ with transition tables and unreachable state trimming.
   - **NFA Representation**: Complete 5-tuple $(Q, \Sigma, \Delta, q_0, F)$ with $\epsilon$-closure computation, active state tracking, and Subset Construction (NFA $\to$ DFA determinization).
   - **Simulation Engine**: Step-by-step trace recording active states, symbol consumed, remaining string, and final acceptance verdict.

3. **Develop or integrate an automata-inference algorithm**:
   - **Prefix Tree Acceptor (PTA)**: Maximal tree hypothesis accepting $S^+$.
   - **RPNI (Regular Positive and Negative Inference)**: Shortlex state merging with deterministic quotient folding and negative conflict rollback.

4. **Visualize states, transitions, accepting states, and execution paths**:
   - Canvas-accelerated interactive graph visualizer powered by **Cytoscape.js**.
   - Circular states, start state pointer, double-bordered accepting states, and labeled transition arcs.
   - Live step-by-step string simulation with glowing active states and side-by-side comparison between inferred model and reference labels.

5. **Measure model accuracy, state count, and generalization on unseen strings**:
   - Quantitative classification metrics: Accuracy, Precision, Recall, F1-Score, and 2x2 Confusion Matrix.
   - Inferred state count vs. reference state count comparison.
   - Generalization performance tested on an independent, unseen test set.

6. **Study the effects of noisy or insufficient training examples**:
   - **Quantity Study**: Evaluates learning efficiency as sample size $N$ scales from insufficient to sufficient ($N \in [6, 100]$).
   - **Quality Study**: Demonstrates how corrupted labels ($\eta \in [0\%, 30\%]$) degrade test accuracy and trigger state complexity explosion (overfitting).
   - **Diversity Study**: Analyzes how string length diversity (varying maximum string length) affects the inferred model's ability to learn loops and cycles.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Modern Web Browser

### 1. Launch Application (FastAPI + React)
Run the launcher script from the project root:
```bash
python run.py
```
Open your browser at **`http://127.0.0.1:8000`**.

### 2. Run Backend Unit Tests
To verify all DFA/NFA operations, subset construction, RPNI, and experiment endpoints:
```bash
python -m unittest discover -s backend/tests -p "test_*.py"
```

### 3. Frontend Development Mode (Optional)
If you wish to edit frontend React components with live hot-reloading:
```bash
cd frontend
npm run dev
```

---

## 📁 Repository Structure

```
d:\TOC/
├── backend/
│   ├── main.py                  # FastAPI application entry point & static server
│   ├── api.py                   # REST API endpoints
│   ├── automata/
│   │   ├── dfa.py               # DFA model, simulation trace, state completion
│   │   └── nfa.py               # NFA model, epsilon closure, subset construction
│   ├── datasets/
│   │   ├── benchmarks.py        # Preset classic benchmark languages & reference models
│   │   └── generator.py         # Balanced sampler, noise injector, train/test split
│   ├── learning/
│   │   ├── pta.py               # Prefix Tree Acceptor (PTA) construction
│   │   └── rpni.py              # RPNI algorithm with quotient folding & rollback
│   ├── analysis/
│   │   ├── metrics.py           # Classification metrics & confusion matrix
│   │   └── noise_study.py       # Empirical experiments: quantity, diversity, noise
│   └── tests/
│       ├── test_automata.py     # Unit tests for DFA, NFA, subset construction
│       ├── test_inference.py    # Unit tests for RPNI
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
│           └── NoiseStudyPanel.jsx # Empirical study on quantity, diversity, noise
└── run.py                       # Single-command launcher
```
