import os
import asyncio
import numpy as np
import websockets
import json
from fastapi import FastAPI, File, UploadFile, HTTPException, WebSocket, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import tempfile
from scipy.io import wavfile  # Use scipy instead of soundfile
from groq import Groq
from starlette.websockets import WebSocketDisconnect
import shutil
import httpx
import re
from urllib.parse import quote
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

load_dotenv()
app = FastAPI()

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

@app.get("/")
async def health_check():
    return {"message": "Backend is running!"}

@app.post('/transcribe')
async def transcribe_audio(audio: UploadFile = File(...)):
    if not audio:
        raise HTTPException(status_code=400, detail="No audio file provided")
    if audio.filename == '':
        raise HTTPException(status_code=400, detail="No selected file")

    temp_audio_path = f"temp/{audio.filename}"
    os.makedirs(os.path.dirname(temp_audio_path), exist_ok=True)
    with open(temp_audio_path, "wb") as buffer:
        shutil.copyfileobj(audio.file, buffer)

    try:
        with open(temp_audio_path, "rb") as file:
            transcription = client.audio.transcriptions.create(
                file=(audio.filename, file.read()),
                model="whisper-large-v3",
                response_format="json",
                language="en",
            )
        os.remove(temp_audio_path)
        return JSONResponse(content={"transcription": transcription.text}, status_code=200)
    except Exception as e:
        if os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/webrtc")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_text(json.dumps({"type": "status", "message": "WebSocket connected"}))
    buffer = bytearray()
    chunk_counter = 0
    last_transcribe_time = asyncio.get_event_loop().time()
    transcribe_interval = 2.0  # seconds
    try:
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_bytes(), timeout=transcribe_interval)
                buffer.extend(data)
                await websocket.send_text(json.dumps({"type": "status", "message": f"Received {len(data)} bytes, buffer now {len(buffer)} bytes"}))
            except asyncio.TimeoutError:
                pass
            now = asyncio.get_event_loop().time()
            if len(buffer) > 0 and (now - last_transcribe_time >= transcribe_interval):
                chunk_counter += 1
                await websocket.send_text(json.dumps({"type": "status", "message": f"Transcribing {len(buffer)} bytes from last {transcribe_interval} seconds (chunk {chunk_counter})"}))
                with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                    arr = np.frombuffer(buffer, dtype=np.int16)
                    await websocket.send_text(json.dumps({"type": "status", "message": f"Chunk {chunk_counter} RMS: {float(np.abs(arr).mean()):.5f}"}))
                    if np.abs(arr).mean() < 100:
                        await websocket.send_text(json.dumps({"type": "status", "message": f"Chunk {chunk_counter} is silent, skipping transcription"}))
                        buffer = bytearray()
                        last_transcribe_time = now
                        continue
                    wavfile.write(tmp.name, 16000, arr.astype(np.int16))  # Use scipy to write wav
                    tmp.flush()
                    try:
                        await websocket.send_text(json.dumps({"type": "status", "message": f"Sending chunk {chunk_counter} for transcription..."}))
                        with open(tmp.name, "rb") as audio_file:
                            audio_bytes = audio_file.read()
                            await websocket.send_text(json.dumps({"type": "status", "message": f"Chunk {chunk_counter} size for transcription: {len(audio_bytes)} bytes"}))
                            transcription = client.audio.transcriptions.create(
                                file=("audio.wav", audio_bytes),
                                model="whisper-large-v3",
                                response_format="json",
                                language="en",
                            )
                        result_text = transcription.text
                        await websocket.send_text(json.dumps({"type": "transcription", "text": result_text}))
                        await websocket.send_text(json.dumps({"type": "status", "message": f"Chunk {chunk_counter} transcription sent."}))
                    except Exception as e:
                        await websocket.send_text(json.dumps({"type": "status", "message": f"Transcription error for chunk {chunk_counter}: {str(e)}"}))
                buffer = bytearray()
                last_transcribe_time = now
    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_text(json.dumps({"type": "status", "message": f"Error: {str(e)}"}))
        except Exception:
            pass
    finally:
        try:
            await websocket.close()
        except Exception:
            pass

@app.post("/gemma-chat")
async def gemma_chat(request: Request):
    data = await request.json()
    prompt = data.get("prompt", "how is the weather today?")
    completion = client.chat.completions.create(
        model="gemma2-9b-it",
        messages=[{"role": "user", "content": prompt}],
        temperature=1,
        max_tokens=1024,  # <-- CORRECT
        top_p=1,
        stream=True,
        stop=None,
    )
    result = ""
    for chunk in completion:
        result += chunk.choices[0].delta.content or ""
    return JSONResponse(content={"response": result})

@app.post("/gemma-python")
async def gemma_python(request: Request):
    data = await request.json()
    prompt = data.get("prompt", "")
    # Use the global client
    result = ""
    completion = client.chat.completions.create(
        model="gemma2-9b-it",
        messages=[{"role": "user", "content": prompt}],
        temperature=1,
        top_p=1,
        stream=True,
        stop=None,
    )
    for chunk in completion:
        result += chunk.choices[0].delta.content or ""
    return {"response": result}

@app.post("/web-search")
async def web_search(request: Request):
    data = await request.json()
    query = data.get("query", "")
    # Set up headless Chrome
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
    driver = webdriver.Chrome(options=chrome_options)
    try:
        driver.get(f"https://www.google.com/search?q={quote(query)}")
        # Try to get the featured snippet or first result
        try:
            # Try featured snippet
            answer = driver.find_element(By.CSS_SELECTOR, 'div[data-attrid="wa:/description"]').text
        except Exception:
            try:
                # Try knowledge panel short description
                answer = driver.find_element(By.CSS_SELECTOR, 'div[data-attrid="kc:/location/location:short_description"]').text
            except Exception:
                try:
                    # Try direct answer
                    answer = driver.find_element(By.CSS_SELECTOR, 'div[data-attrid="hw:/collection/knowledge_panels/has_answer:answer"]').text
                except Exception:
                    try:
                        # Try first organic result snippet
                        answer = driver.find_element(By.CSS_SELECTOR, 'div[data-snc] span, div[data-content-feature="1"] span, div[data-ved] span').text
                    except Exception:
                        try:
                            # Try first result link text
                            answer = driver.find_element(By.CSS_SELECTOR, 'a h3').text
                        except Exception:
                            try:
                                # Try People Also Ask
                                answer = driver.find_element(By.CSS_SELECTOR, 'div[jsname="Cpkphb"] span').text
                            except Exception:
                                # Return the full page source for debugging if no answer found
                                print("\n--- GOOGLE SEARCH HTML RESPONSE START ---\n")
                                print(driver.page_source)
                                print("\n--- GOOGLE SEARCH HTML RESPONSE END ---\n")
                                return JSONResponse(content={"answer": "No answer found.", "html": driver.page_source}, status_code=200)
        # Clean up whitespace
        answer = ' '.join(answer.split())
        print(f"Google Search Answer: {answer}")
        return {"answer": answer}
    finally:
        driver.quit()