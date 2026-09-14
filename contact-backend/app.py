import os
import smtplib
import base64
import mimetypes
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
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

PUBLIC_DIRECTUS_URL = os.getenv('PUBLIC_DIRECTUS_URL', '')
SMTP_HOST = os.getenv('SMTP_HOST', 'localhost')
SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
SMTP_USER = os.getenv('SMTP_USER', '')
SMTP_PASS = os.getenv('SMTP_PASS', '')
USE_SSL = os.getenv('SMTP_SSL', '0').lower() in ['1', 'true', 'yes']
FROM_EMAIL = os.getenv('FROM_EMAIL', '')
RECRUTEMENT_EMAIL = os.getenv('RECRUTEMENT_EMAIL', '')

def send_email_message(msg):
    """Fonction utilitaire pour l'envoi via SMTP."""
    if USE_SSL:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
            if SMTP_USER and SMTP_PASS:
                server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
    else:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            if SMTP_USER and SMTP_PASS:
                server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)

@app.route('/api/contact', methods=['POST'])
def contact():
    data = request.get_json() or {}
    name = data.get('name')
    email = data.get('email')
    message = data.get('message')
    company = data.get('company')
    phone = data.get('phone')

    if not name or not email or not message:
        return jsonify({'error': 'Formulaire incomplet.'}), 400

    msg = MIMEMultipart()
    msg['From'] = FROM_EMAIL
    msg['To'] = 'cyprien.cotinaut@jcd-groupe.fr' #TODO
    msg['Reply-To'] = email
    msg['Subject'] = "Message via jcd-groupe.fr"

    lines = [f"Nom: {name}", f"E-mail: {email}"]
    if company and company.strip():
        lines.append(f"Entreprise: {company}")
    if phone and phone.strip():
        lines.append(f"Téléphone: {phone}")
    lines.extend(["", "Message:", message])

    msg.attach(MIMEText("\n".join(lines), 'plain', 'utf-8'))

    try:
        send_email_message(msg)
        return jsonify({'success': True}), 200
    except Exception as e:
        print(f"Erreur SMTP: {e}")
        return jsonify({'error': f"Échec lors de l'envoi: {e}"}), 500

@app.route('/api/contact-recrutement', methods=['POST'])
def contact_recrutement():
    # Envoi au format Multipart/Form-Data
    prenom = request.form.get('prenom')
    nom = request.form.get('nom')
    email = request.form.get('email')
    telephone = request.form.get('telephone')
    offre_titre = request.form.get('offre_titre')
    offre_id = request.form.get('offre_id', 'N/A')
    
    cv_file = request.files.get('cv')

    if not nom or not prenom or not email or not telephone or not offre_titre:
        return jsonify({'error': 'Formulaire incomplet.'}), 400

    msg = MIMEMultipart()
    msg['From'] = FROM_EMAIL
    msg['To'] = RECRUTEMENT_EMAIL
    msg['Reply-To'] = email
    msg['Subject'] = f"Candidature : {offre_titre}"

    if offre_id and offre_id != 'N/A':
        lien_directus = f"{PUBLIC_DIRECTUS_URL}/admin/content/Offres/{offre_id}"
        header_offre = f"Pour l'offre : {offre_titre} ({lien_directus})"
    else:
        header_offre = f"Candidature spontanée pour : {offre_titre}"

    lines = [
        header_offre,
        "",
        f"Prénom : {prenom}",
        f"Nom : {nom}",
        f"E-mail : {email}",
        f"Téléphone : {telephone}"
    ]
    msg.attach(MIMEText("\n".join(lines), 'plain', 'utf-8'))

    # Gestion de la pièce jointe (PDF, DOC, DOCX)
    if cv_file and cv_file.filename != '':
        file_bytes = cv_file.read()
        filename = cv_file.filename
        
        # Détection du sous-type MIME
        maintype, subtype = (cv_file.content_type.split('/') if cv_file.content_type else ('application', 'octet-stream'))
        
        attachment = MIMEApplication(file_bytes, _subtype=subtype)
        attachment.add_header('Content-Disposition', 'attachment', filename=filename)
        msg.attach(attachment)

    try:
        send_email_message(msg)
        return jsonify({'success': True}), 200
    except Exception as e:
        print(f"Erreur SMTP (Recrutement): {e}")
        return jsonify({'error': f"Échec lors de l'envoi: {e}"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
