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

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message')
        
        if not user_message:
            return jsonify({"error": "No message provided"}), 400

        last_error = None
        
        # Iterative fallback strategy
        for model_name in MODELS_TO_TRY:
            try:
                # print(f"Trying model: {model_name}...") 
                response = client.models.generate_content(
                    model=model_name, 
                    contents=user_message
                )
                # If successful, return immediately
                return jsonify({"response": response.text})
            except Exception as e:
                error_str = str(e)
                print(f"Model {model_name} failed: {error_str[:100]}...")
                last_error = error_str
                # If it's a 429 or 404, we continue to the next model.
                # If it's something else (like auth), it might fail for all, but we try anyway.
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
