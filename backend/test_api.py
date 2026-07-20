import subprocess
import time
import requests
import sys

print("Starting uvicorn in background...")
proc = subprocess.Popen([sys.executable, "-m", "uvicorn", "app.main:app", "--port", "8123"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
time.sleep(3)

print("Attempting to login...")
try:
    login_res = requests.post("http://localhost:8123/api/v1/auth/login", data={"username": "admin", "password": "ChangeMe123!"})
    if login_res.status_code == 200:
        token = login_res.json()["access_token"]
        print("Login successful! Token acquired.")
        
        print("Fetching network-full...")
        headers = {"Authorization": f"Bearer {token}"}
        net_res = requests.get("http://localhost:8123/api/v1/graph/network-full", headers=headers)
        print(f"Status: {net_res.status_code}")
        print(f"Response: {net_res.text[:500]}")
    else:
        print(f"Login failed: {login_res.status_code} {login_res.text}")
except Exception as e:
    print(f"Request failed: {e}")

print("Terminating server...")
proc.terminate()
try:
    stdout, stderr = proc.communicate(timeout=2)
    print("STDOUT:")
    print(stdout)
    print("STDERR:")
    print(stderr)
except subprocess.TimeoutExpired:
    proc.kill()
