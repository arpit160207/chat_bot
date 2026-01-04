# Arpit AI 🤖

**Arpit AI** is a next-generation AI chatbot featuring a stunning glassmorphism UI and powered by Google's Gemini 2.0 Flash models. It supports real-time conversation, Markdown rendering, and multimodal file uploads (images, PDFs).

![Arpit AI Banner](https://via.placeholder.com/1200x600/050510/6c5ce7?text=Arpit+AI)

## ✨ Features

- **🧠 Advanced AI**: Powered by Google Gemini 2.0 Flash & Pro models.
- **🎨 Glassmorphism Design**: Beautiful, modern UI with animated backgrounds and blur effects.
- **📎 Multimodal Support**: Upload images and files for the AI to analyze.
- **⚡ High Performance**: Optimized CSS animations running at 60 FPS with hardware acceleration.
- **📝 Markdown Support**: Renders code blocks, tables, and formatted text perfectly.
- **🛡️ Robust Fallback**: Automatically switches between model versions (2.0 -> 1.5) if quotas are hit.

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- A Google Gemini API Key (Get one [here](https://aistudio.google.com/app/apikey))

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/arpit160207/chat_bot.git
    cd chat_bot
    ```

2.  **Install dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

3.  **Set up environment**:
    - Rename `.env.example` to `.env`:
      ```bash
      mv .env.example .env  # or just rename manually
      ```
    - Open `.env` and paste your API key:
      ```env
      GEMINI_API_KEY=your_actual_api_key_here
      ```

### Running the App

Start the Flask server:
```bash
python app.py
```

Open your browser and navigate to:
```
http://localhost:5000
```

## 🛠️ Built With

- **Backend**: Python, Flask, Google GenAI SDK
- **Frontend**: HTML5, CSS3 (Variables, Flexbox), JavaScript (Vanilla)

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---
*Created by [Arpit](https://github.com/arpit160207)*
