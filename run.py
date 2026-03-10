"""Tiny local server for Uma Agenda static web app.
Run: python run.py
Then open: http://localhost:8000
"""

import http.server
import socketserver
from pathlib import Path

PORT = 8000
ROOT = Path(__file__).resolve().parent

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)


def main():
    print(f"Serving {ROOT} at http://localhost:{PORT}")
    print("Ctrl-C to stop")
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped")


if __name__ == "__main__":
    main()
