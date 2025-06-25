import os
import asyncio
import numpy as np
import websockets
import json
from fastapi import FastAPI, File, UploadFile, HTTPException, WebSocket
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import tempfile
import soundfile as sf
from groq import Groq

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
                # No data received for transcribe_interval seconds, proceed to transcribe
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
                    sf.write(tmp.name, arr, 16000, subtype='PCM_16')
                    tmp.flush()
                    try:
                        await websocket.send_text(json.dumps({"type": "status", "message": f"Sending chunk {chunk_counter} for transcription..."}))
                        with open(tmp.name, "rb") as audio_file:
                            transcription = client.audio.transcriptions.create(
                                file=("audio.wav", audio_file.read()),
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
    except Exception as e:
        await websocket.send_text(json.dumps({"type": "status", "message": f"Error: {str(e)}"}))
    finally:
        await websocket.close()