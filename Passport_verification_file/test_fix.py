import cv2
import numpy as np
from passport_photo_app import PassportPhotoApp

# Create app instance
app = PassportPhotoApp()

# Process existing image
input_path = 'passport_photos/passport_photo_1.jpg'
output_path = 'passport_photos/passport_photo_white.jpg'

print(f"Processing: {input_path}")
result = app.process_image_file(input_path, output_path)

if result:
    print(f"Saved to: {result}")
    
    # Check the output image
    img = cv2.imread(output_path)
    if img is not None:
        print(f"Output shape: {img.shape}")
        print(f"Top-left corner (0,0): {img[0,0]}")
        print(f"Top-right corner (0,-1): {img[0,-1]}")
        print(f"Bottom-left corner (-1,0): {img[-1,0]}")
        print(f"Bottom-right corner (-1,-1): {img[-1,-1]}")
        
        # Check if it's white (255,255,255)
        corner = img[0,0]
        if np.all(corner == 255):
            print("✅ Background is white!")
        else:
            print(f"❌ Background is NOT white: {corner}")
else:
    print("Processing failed")
