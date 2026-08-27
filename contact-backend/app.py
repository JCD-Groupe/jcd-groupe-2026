import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)

ALLOWED_ORIGIN = os.getenv('ALLOWED_ORIGIN', '*')
CORS(app, resources={
    r"/api/*": {
        "origins": ALLOWED_ORIGIN,
        "methods": ["POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

SMTP_HOST = os.getenv('SMTP_HOST', 'localhost')
SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
SMTP_USER = os.getenv('SMTP_USER', '')
SMTP_PASS = os.getenv('SMTP_PASS', '')
TO_EMAIL = os.getenv('TO_EMAIL', '')

@app.route('/api/contact', methods=['POST'])
def contact():
    data = request.get_json()
    name, email, message = data.get('name'), data.get('email'), data.get('message')

    if not name or not email or not message:
        return jsonify({'error': 'Tous les champs sont requis.'}), 400

    msg = MIMEMultipart()
    msg['From'] = SMTP_USER if SMTP_USER else email
    msg['To'] = TO_EMAIL
    msg['Subject'] = f"Nouveau message de {name}"
    
    body = f"Nom: {name}\nE-mail: {email}\n\nMessage:\n{message}"
    msg.attach(MIMEText(body, 'plain', 'utf-8'))

    try:
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        server.starttls()
        if SMTP_USER and SMTP_PASS:
            server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)
        server.quit()
        return jsonify({'success': True}), 200
    except Exception as e:
        print(f"Erreur SMTP: {e}")
        return jsonify({'error': "Échec lors de l'envoi."}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
