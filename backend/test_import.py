import sys
import traceback

try:
    from app.main import app
    print("SUCCESS: app.main imported successfully")
except Exception as e:
    print("FAILED TO IMPORT app.main:")
    traceback.print_exc()
