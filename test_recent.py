import glob, json
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.image import load_img, img_to_array

model = tf.keras.models.load_model('ml_models/model.keras', safe_mode=False)

image_files = sorted(glob.glob(r'D:\AI-STHETICA_BACKEND\media\scans\*.*'), key=lambda x: -1 * __import__('os').path.getmtime(x))[:3]

results = {}
for file in image_files:
    img = load_img(file, target_size=(224, 224))
    img_array = img_to_array(img) / 255.0
    preds = model.predict(np.expand_dims(img_array, axis=0), verbose=0)[0]
    results[file] = {
        'max_conf': round(float(np.max(preds)*100), 2),
        'top_class_idx': int(np.argmax(preds)),
        'all_probs': [round(float(p)*100, 2) for p in preds]
    }

with open('test_recent.json', 'w') as f:
    json.dump(results, f, indent=2)
