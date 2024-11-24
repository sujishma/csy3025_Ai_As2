from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import cv2
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array

# Initializ
app = Flask(__name__)
CORS(app)

# Load
model = load_model('emotion_recognition_model.keras')
EMOTIONS = ['Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral']  # Replace with your labels

# Helper Function
def predict_emotion(image):
    image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    image = cv2.resize(image, (48, 48))
    image = img_to_array(image) / 255.0
    image = np.expand_dims(image, axis=0)
    predictions = model.predict(image)
    emotion_idx = np.argmax(predictions)
    return EMOTIONS[emotion_idx], predictions[0].tolist()

#  Image Upload
@app.route('/predict-image', methods=['POST'])
def predict_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    file = request.files['file']
    image = np.array(cv2.imdecode(np.frombuffer(file.read(), np.uint8), cv2.IMREAD_COLOR))
    emotion, probabilities = predict_emotion(image)
    return jsonify({'emotion': emotion, 'probabilities': probabilities})

# Live Camera Feed
@app.route('/predict-live', methods=['GET'])
def predict_live():
    cap = cv2.VideoCapture(0)  
    if not cap.isOpened():
        return jsonify({'error': 'Unable to access the camera.'}), 500

    ret, frame = cap.read()
    cap.release()

    if not ret:
        return jsonify({'error': 'Failed to capture an image from the camera.'}), 500

    try:
        #  face detection and prediction
        emotion, probabilities = predict_emotion_with_face_detection(frame)
        return jsonify({'emotion': emotion, 'probabilities': probabilities})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def predict_emotion_with_face_detection(frame):
    #  for face detection
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    
   
    gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    
    # Detect faces
    faces = face_cascade.detectMultiScale(gray_frame, scaleFactor=1.1, minNeighbors=5, minSize=(48, 48))
    
    if len(faces) == 0:
        return "No face detected", []

    # Use the first detected face
    x, y, w, h = faces[0]
    face = gray_frame[y:y+h, x:x+w]
    
    # face for prediction
    resized_face = cv2.resize(face, (48, 48))
    image_array = img_to_array(resized_face) / 255.0
    image_array = np.expand_dims(image_array, axis=0)
    
    # Predict 
    predictions = model.predict(image_array)
    emotion_idx = np.argmax(predictions)
    return EMOTIONS[emotion_idx], predictions[0].tolist()

#  home
@app.route('/')
def home():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)
