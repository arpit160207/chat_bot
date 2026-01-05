import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder='.')
CORS(app)

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    # Backup load
    try:
        with open('.env', 'r') as f:
            for line in f:
                if line.startswith('GEMINI_API_KEY='):
                    api_key = line.strip().split('=', 1)[1]
                    break
    except:
        pass

if not api_key:
    print("CRITICAL: GEMINI_API_KEY missing.")
else:
    print(f"DEBUG: Loaded API Key: {api_key[:5]}...{api_key[-5:] if len(api_key) > 10 else ''}")

client = genai.Client(api_key=api_key)

@app.route('/')
def home():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

# List of models to try in order (Validated for this specific API Key)
MODELS_TO_TRY = [
    'gemini-2.0-flash-lite-001', # Try Lite first for better quota
    'gemini-2.5-flash',          # Try the bleeding edge
    'gemini-2.0-flash',          # Known to be 429'd but retry anyway
    'gemini-2.0-flash-exp',
    'gemini-2.0-flash-001',
    'gemini-exp-1206'
]

# Global Chat History (In-Memory Only)
CHAT_HISTORY = []

@app.route('/api/reset', methods=['POST'])
def reset_chat():
    global CHAT_HISTORY
    CHAT_HISTORY = []
    return jsonify({"message": "Chat history cleared"})

@app.route('/api/chat', methods=['POST'])
def chat():
    global CHAT_HISTORY
    try:
        # Handle both JSON (text only) and Multipart (file upload)
        user_message = ""
        file_part = None

        if request.is_json:
            user_message = request.json.get('message')
        else:
            user_message = request.form.get('message')
            if 'file' in request.files:
                file = request.files['file']
                if file.filename != '':
                    file_bytes = file.read()
                    file_part = types.Part.from_bytes(
                        data=file_bytes,
                        mime_type=file.content_type
                    )

        if not user_message and not file_part:
             return jsonify({"error": "No message or file provided"}), 400

        # Construct current turn content
        current_parts = []
        if user_message:
            current_parts.append(types.Part.from_text(text=user_message))
        if file_part:
            current_parts.append(file_part)
            
        user_content = types.Content(role="user", parts=current_parts)

        # Prepare full history for the model
        conversation_context = CHAT_HISTORY + [user_content]

        last_error = None
        
        # Iterative fallback strategy
        for model_name in MODELS_TO_TRY:
            try:
                # print(f"Trying model: {model_name}...") 
                
                # Define system instruction for persona
                sys_instruct = "You are Arpit AI, a helpful and friendly assistant. Be polite and engaging, using emojis to keep the conversation lively, but maintain a professional tone. 🌟😊"
                
                config = types.GenerateContentConfig(
                    system_instruction=sys_instruct
                )

                response = client.models.generate_content(
                    model=model_name, 
                    contents=conversation_context,
                    config=config
                )
                
                # Success! Update global history
                CHAT_HISTORY.append(user_content)
                
                # Add model response to history
                model_text = response.text
                model_content = types.Content(role="model", parts=[types.Part.from_text(text=model_text)])
                CHAT_HISTORY.append(model_content)

                return jsonify({"response": model_text})
            except Exception as e:
                error_str = str(e)
                print(f"Model {model_name} failed: {error_str[:100]}...")
                last_error = error_str
                # If it's a 429 or 404, we continue to the next model.
                continue

        # If we get here, ALL models failed
        if "429" in str(last_error):
             return jsonify({
                 "error": "All models are currently busy or quota exceeded. Please wait a minute."
             }), 429
             
        return jsonify({"error": f"All models failed. Last error: {last_error}"}), 500

    except Exception as e:
        print(f"Server Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("Arpit AI Server Running...")
    app.run(debug=True, port=5000)
