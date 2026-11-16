"""
Application Launcher for TOC Automata Studio.
Starts the unified FastAPI + React server on http://127.0.0.1:8000.
"""

import sys
import webbrowser
import uvicorn


def main():
    print("=" * 70)
    print("  TOC AUTOMATA STUDIO: DFA/NFA Learning & Visualization")
    print("  Grammatical Inference: RPNI, EDSM, Angluin's L* Active Learning")
    print("=" * 70)
    print("\nStarting server at http://127.0.0.1:8000 ...")
    print("Press Ctrl+C to stop.\n")

    # Optional: Automatically open browser after 1 second
    try:
        webbrowser.open("http://127.0.0.1:8000")
    except Exception:
        pass

    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, log_level="info")


if __name__ == "__main__":
    main()
