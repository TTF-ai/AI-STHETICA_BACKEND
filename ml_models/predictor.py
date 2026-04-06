import os
import json
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.image import load_img, img_to_array

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model.keras")
INDICES_PATH = os.path.join(BASE_DIR, "class_indices.json")

_model = None
_index_to_class = None

def load_model_instance():
    global _model, _index_to_class
    if _model is None:
        print(f"Loading Keras Model from {MODEL_PATH}...")
        _model = tf.keras.models.load_model(MODEL_PATH, safe_mode=False)
        with open(INDICES_PATH, 'r') as f:
            class_indices = json.load(f)
            _index_to_class = {v: k for k, v in class_indices.items()}

def predict_lesion(img_path):
    load_model_instance()
    
    IMG_HEIGHT = 75
    IMG_WIDTH = 100
    
    img = load_img(img_path, target_size=(IMG_HEIGHT, IMG_WIDTH))
    img_array = img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)

    predictions = _model.predict(img_array)[0]
    
    top_idx = int(np.argmax(predictions))
    top_class = _index_to_class[top_idx]
    confidence = float(predictions[top_idx] * 100) 
    
    return top_class, confidence
