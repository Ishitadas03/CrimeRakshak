import argparse
import os
import sys
import traceback

print("--- STARTING RUN.PY LAUNCHER ---")
sys.stdout.flush()

parser = argparse.ArgumentParser()
parser.add_argument("--port", type=int, default=None)
args, _ = parser.parse_known_args()

# Determine port from CLI arg (--port $PORT), environment variable, or default
port = args.port or int(os.environ.get("PORT") or 8000)

print(f"Resolved port: {port}")
print(f"Python version: {sys.version}")
print(f"Current working dir: {os.getcwd()}")
sys.stdout.flush()

# Ensure site-packages and current directory are in sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

user_site = os.path.expanduser("~/.local/lib/python3.11/site-packages")
if os.path.exists(user_site) and user_site not in sys.path:
    sys.path.insert(0, user_site)

try:
    import uvicorn
    import fastapi
    print("[OK] FastAPI & Uvicorn imported successfully")
    sys.stdout.flush()
except Exception as exc:
    print(f"[ERROR] CRITICAL IMPORT ERROR (fastapi/uvicorn): {exc}", file=sys.stderr)
    traceback.print_exc()
    sys.stderr.flush()
    sys.exit(1)

try:
    from app.main import app
    print("[OK] app.main imported successfully")
    sys.stdout.flush()
except Exception as exc:
    print(f"[WARN] Failed to import app.main, mounting fallback app: {exc}", file=sys.stderr)
    traceback.print_exc()
    sys.stderr.flush()
    app = fastapi.FastAPI()
    @app.get("/health")
    def fallback_health():
        return {"status": "degraded", "error": str(exc)}
    @app.get("/")
    def fallback_root():
        return {"status": "degraded", "error": str(exc)}

if __name__ == "__main__":
    print(f"Launching Uvicorn server on 0.0.0.0:{port}...")
    sys.stdout.flush()
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
