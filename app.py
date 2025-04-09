from flask import Flask, render_template, request, jsonify
import openai
import os
import tempfile
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# Initialize OpenAI client
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = Flask(__name__)

# Home route
@app.route('/')
def home():
    return render_template('home.html')

# Input page
@app.route('/input')
def input_page():
    return render_template('input.html')

# GPT result page
@app.route('/result', methods=['POST'])
def result():
    symptoms = request.form['symptoms']
    system_prompt = request.form.get('system_prompt', '').strip()

    print("💥 THIS IS THE NEW VERSION 💥")
    print("✅ System prompt received:", system_prompt)

    user_prompt = f'The user described their symptoms: "{symptoms}"'

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=500
        )

        full_response = response.choices[0].message.content.strip()

        return render_template('result.html', response_text=full_response, symptoms=symptoms)

    except Exception as e:
        print("❌ ERROR:", str(e))
        return render_template('result.html', response_text=f"❌ Error: {str(e)}", symptoms=symptoms)

# Whisper transcription endpoint
@app.route('/transcribe', methods=['POST'])
def transcribe():
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file uploaded"}), 400

    audio_file = request.files['audio']

    # Save to temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp:
        audio_file.save(temp.name)
        temp.flush()

        try:
            transcription = client.audio.transcriptions.create(
                model="whisper-1",
                file=open(temp.name, "rb"),
                response_format="text"
            )
            print("🎧 Transcription result:", transcription)
            return jsonify({"transcript": transcription})
        except Exception as e:
            print("❌ Whisper error:", str(e))
            return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)

