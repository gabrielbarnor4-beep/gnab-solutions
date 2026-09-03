"""Static server with SPA fallback: unknown paths serve index.html."""
import http.server
import os
import socketserver
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 3000
DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'dist'))


class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIST, **kwargs)

    def send_head(self):
        path = self.translate_path(self.path)
        if not os.path.exists(path) or (
            os.path.isdir(path) and not os.path.exists(os.path.join(path, 'index.html'))
        ):
            self.path = '/index.html'
        return super().send_head()

    def log_message(self, *args):
        pass


class Server(socketserver.TCPServer):
    allow_reuse_address = True


if __name__ == '__main__':
    with Server(('0.0.0.0', PORT), SPAHandler) as httpd:
        print(f'Serving {DIST} on http://localhost:{PORT} (SPA mode)')
        httpd.serve_forever()
