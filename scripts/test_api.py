import urllib.request
import json
import sys

base_url = "https://muyuan.do/v1"
token = "sk-lk6DH3QdEEUsBvUk44MMqBVCFJ5GmqJPpm6N3HWazIGHaYf3"
model = "gpt-5.5"

user_agents = [
    "Cursor/0.45.0",
    "Go-http-client/1.1",
    "Go-http-client/2.0",
    "Chatbox/1.0.0",
    "LobeChat/1.0.0",
    "NextChat/1.0.0",
    "CherryStudio/1.0.0",
    "PostmanRuntime/7.32.3",
    "VSCode/1.85.0",
    "curl/7.81.0",
    "python-requests/2.28.1"
]

data = {
    "model": model,
    "messages": [
        {"role": "user", "content": "1+1="}
    ]
}

for ua in user_agents:
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "User-Agent": ua
    }

    req = urllib.request.Request(
        f"{base_url}/chat/completions",
        data=json.dumps(data).encode("utf-8"),
        headers=headers,
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            res = json.loads(response.read().decode("utf-8"))
            print(f"Success with User-Agent '{ua}'!")
            print(res["choices"][0]["message"]["content"])
            break
    except Exception as e:
        print(f"Failed with User-Agent '{ua}': {e}")
