from flask import Flask, jsonify, request, Response
from flask_cors import CORS
import os
import numpy as np
import face_recognition
import base64
from PIL import Image
import io
import cv2
import time
from face import SimpleFacerec
import requests
import pytesseract
import os
import re

from dotenv import load_dotenv

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


@app.before_request
def before_request():
    load_dotenv()
    global sfr
    sfr = SimpleFacerec()
    #here, we can establish DB connection and init anything
    #maybe cache face embeddings?
    global known_embeddings
    global known_uids
    global recognized_faces
    global old_recognized_faces
    known_embeddings=[]
    known_uids=[]
    recognized_faces=[]
    old_recognized_faces=[]

    response = requests.get("https://mementoai-backend-528890859039.us-central1.run.app/embeddings?includeVector=true")
    
    
    # response = requests.get("https://mementoai-backend-528890859039.us-central1.run.app/xxx")
    
    #print(response.json())
    items = (response.json()['items'])
    for item in items:
        print(item)
        if item['vector'] is not None and item['uid'] is not None:
            known_embeddings.append(item['vector'])
            known_uids.append(item['uid'])

    # print('known embeddings:', known_embeddings)
    # print('known uids:', known_uids)

@app.route('/', methods=['GET'])
def index():
    return "Hello, World!"

@app.route('/upload', methods=['POST'])
def upload_file():
    global recognized_faces, known_embeddings, known_uids, sfr
    
    print("File received!")
    print(f"Request files: {list(request.files.keys())}")
    print(f"Request form: {list(request.form.keys())}")
    print(f"Content type: {request.content_type}")
    
    try:
        # Check if any file field exists in the form data
        if not request.files:
            print("Error: No files found in request")
            return jsonify({'error': 'No files in request'}), 400
        
        # Get the first file regardless of field name
        file_key = list(request.files.keys())[0]
        file = request.files[file_key]
        print(f"Found file with key: {file_key}")
        
        # Check if file was actually uploaded
        print(f"File filename: '{file.filename}'")
        # Allow empty filenames for Blob uploads from JavaScript
        # if file.filename == '':
        #     print("Error: Empty filename")
        #     return jsonify({'error': 'No file selected'}), 400
            
        # Read the file data
        file_data = file.read()
        print(f"File data length: {len(file_data)}")
        if not file_data:
            print("Error: Empty file data")
            return jsonify({'error': 'Empty file'}), 400
            
        # Convert to numpy array and validate it's a valid image
        try:
            # filename = 'test.jpg'
            nparr = np.frombuffer(file_data, np.uint8)
            img_np = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img_np is None:
                print("Error: cv2.imdecode returned None - invalid image format")
                return jsonify({'error': 'Invalid image format'}), 400
                
            print(f"Image shape: {img_np.shape}")
            print("Image decoded successfully!")
            
            # Save the image to file instead of displaying (cv2.imshow may not work in headless environment)
            output_filename = f"received_image_{int(time.time())}.jpg"
            cv2.imwrite(output_filename, img_np)
            print(f"Image saved as: {output_filename}")

            # Perform OCR
            # Convert BGR to RGB for PIL
            img_rgb = cv2.cvtColor(img_np, cv2.COLOR_BGR2RGB)
            image = Image.fromarray(img_rgb)
            text = pytesseract.image_to_string(image)
            api_key = os.getenv('ANTHROPIC_API_KEY') # Set up the API key (make sure to set your ANTHROPIC_API_KEY environment variable)

            # Define the URL and headers
            url = "https://api.anthropic.com/v1/messages"
            headers = {
                "Content-Type": "application/json",
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01"
            }

            data = { # Define the request payload
                "model": "claude-sonnet-4-20250514",
                "max_tokens": 1000,
                "messages": [
                    {
                        "role": "user",
                        "content": f"You are an expert text cleaner and name extractor. Input OCR text: \"\"\"{text}\"\"\"Tasks: 1. Correct OCR errors (fix spelling, spacing, and obvious formatting issues) while preserving meaning. 2. Detect a personal name (first, last, or both). If none is found, leave blank. Output format (exactly two lines, nothing else): CLEANED: <cleaned text> NAME: <name or leave blank. If the cleaned text is not useful, LEAVE IT BLANK."
                    }
                ]
            }

            response = requests.post(url, headers=headers, json=data)
            if response.status_code == 200:
                result = response.json()
                output = result['content'][0]['text']

                cleaned = re.search(r"CLEANED:\s*(.*)", output).group(1)
                name = re.search(r"NAME:\s*(.*)", output).group(1) or None
                print(cleaned, name)

                body = {
                    "name": name,
                    "raw_text": cleaned,
                }

                #send OCRd text to backend
                #response = requests.post("https://mementoai-backend-528890859039.us-central1.run.app/xxx", json=body)

            else:
                print(f"Error: {response.status_code}")
                print(response.text)
        
            # Detect faces
            #frame = cv2.imread(filename)
            face_locations, face_encodings = sfr.detect_known_faces(img_np)
            if face_locations.size != 0: # if there is a face present!

                if(len(known_embeddings)!=0):
                    for face_encoding in face_encodings:
                        face_distances = face_recognition.face_distance(known_embeddings, face_encoding)
                        best_match_index = np.argmin(face_distances)
                        if(face_distances[best_match_index] < 0.6): #thresholding faces
                            ind = best_match_index
                            print("Face recognized!")
                            print(f"UID: {known_uids[ind]}")
                            recognized_faces.append(known_uids[ind])
                        else:
                            print("NO Face recognized!")
                            
                    
                    #endpoint for mentraOS!
                        
                    #compare this face to the rest in the DB
                    # body = {
                    #     "queryVector": face_encoding.tolist(), # 512-dimensional query vector
                    #     "numNeighbors": 10,
                    # }
                    
                    # response = requests.post("https://mementoai-backend-528890859039.us-central1.run.app/search", json=body)
                    # print(f"Response status code: {response.status_code}")
                    # print(f"Response headers: {response.headers}")
                    # print(f"Response text: {response.text}")

                    # response = requests.post("https://mementoai-backend-528890859039.us-central1.run.app/searchFaces", json=body)
                    # print(f"Response status code: {response.status_code}")
                    # print(f"Response headers: {response.headers}")
                    # print(f"Response text: {response.text}")

                # Calculate areas for each face and sort by largest area
                areas = [(loc[2] - loc[0]) * (loc[3] - loc[1]) for loc in face_locations]
                sorted_indices = sorted(range(len(areas)), key=lambda i: areas[i], reverse=True)
                
                # Get the largest face (main face in frame)
                face_location = face_locations[sorted_indices[0]]
                face_encoding = face_encodings[sorted_indices[0]]
                y1, x2, y2, x1 = face_location[0], face_location[1], face_location[2], face_location[3]


                body = {
                    "uid": "vision_server",
                    "sessionId": "session_1",
                    "vectors": [face_encoding.tolist()],
                    "model": "face-recognition-128d",
                    "modality": "face",
                    "storeVector": True
                }

                print("Sending face embedding to API...")
                
                try:
                    response = requests.post("https://mementoai-backend-528890859039.us-central1.run.app/bulkUpsertEmbeddings", json=body)
                    print(f"Response status code: {response.status_code}")
                    print(f"Response headers: {response.headers}")
                    print(f"Response text: {response.text}")
                    
                    if response.status_code == 200:
                        if response.text.strip():  # Check if response has content
                            response_data = response.json()
                            print(f"API Response: {response_data}")
                        else:
                            print("API returned empty response")
                    elif response.status_code == 500:
                        print("Backend server error (500) - continuing with local processing")
                        print("Face embedding extracted successfully but not stored remotely")
                    else:
                        print(f"API request failed with status {response.status_code}")
                        print(f"Error response: {response.text}")
                        
                except requests.exceptions.RequestException as e:
                    print(f"Request error: {e}")
                except ValueError as e:
                    print(f"JSON parsing error: {e}")
                    print(f"Raw response: {response.text}")
                
                #sfr.compare_faces(face_encoding, known_embeddings)
            
            return jsonify({
                'message': 'Image processed successfully',
                'image_shape': img_np.shape,
                'image_size': len(file_data)
            }), 200
            
        except Exception as img_error:
            print(f"Image processing error: {img_error}")
            return jsonify({'error': f'Failed to process image: {str(img_error)}'}), 400
            
    except Exception as e:
        print(f"Upload error: {e}")
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500

@app.route('/recognized_faces', methods=['GET'])
def get_recognized_faces():
    global recognized_faces, old_recognized_faces
    
    if recognized_faces == old_recognized_faces:
        return jsonify({
            'message': 'No new faces recognized'
        }), 205
    else:
        old_recognized_faces = recognized_faces.copy()  # Use copy() to avoid reference issues
        return jsonify({
            'message': 'New face recognized!'
        }), 201

if __name__ == '__main__':
    app.run(debug=True)