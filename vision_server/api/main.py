from flask import Flask, jsonify, request, Response
from flask_cors import CORS
import os
import numpy as np
import face_recognition
import base64
from PIL import Image
import io
import cv2

app = Flask(__name__)
CORS(
 app,
 resources={
  r"/*": {
   "origins": "*",
   "methods": [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
   ],
   "allow_headers": [
    "Content-Type",
    "Authorization",
    "Access-Control-Allow-Origin"
   ],
  }
 },
)


def allowed_file(filename):
    '''Check if the uploaded file has an allowed extension'''
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def np_from_img(file):
     '''converts a buffer from a tar file in np.array'''
     nparr = np.frombuffer(file.read(), np.uint8)
     img_np = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
     return img_np


@app.before_request
def before_request():
    pass
    #here, we can establish DB connection and init anything

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file and allowed_file(file.filename):
        img_np = np_from_img(file)
        # do something with the image
        return jsonify({'message': 'File uploaded successfully'}), 200
    return jsonify({'error': 'Invalid file type'}), 400

if __name__ == '__main__':
    app.run(debug=True)