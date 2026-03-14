import os
import sys
import json
import urllib.request
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.auth import create_access_token

token = create_access_token({"sub": "1"})
print("Token:", token)

url = "http://127.0.0.1:8000/chat"
data = json.dumps({"question": "someone hacked my instagram account, they changed my password", "history": []}).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={
    'Content-Type': 'application/json',
    'Authorization': f'Bearer {token}'
})

try:
    resp = urllib.request.urlopen(req)
    print("Response:", resp.read().decode())
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    print("Details:", e.read().decode())
except Exception as e:
    print("Error:", e)
