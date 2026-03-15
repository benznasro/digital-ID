import cv2
import numpy as np
from PIL import Image
from rembg import remove

# Load image
input_path = 'passport_photos/passport_photo_1.jpg'
image = cv2.imread(input_path)
print(f"Original image shape: {image.shape}")

# Convert to PIL
image_pil = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))

# Process with rembg
output = remove(image_pil)

print(f"Output type: {type(output)}")
print(f"Output size: {output.size}")
print(f"Output mode: {output.mode}")

# Convert to numpy
output_arr = np.array(output)
print(f"Output array shape: {output_arr.shape}")
print(f"Output dtype: {output_arr.dtype}")

if output_arr.shape[2] == 4:
    # RGBA
    alpha = output_arr[:, :, 3]
    print(f"Alpha channel - min: {alpha.min()}, max: {alpha.max()}")
    print(f"Alpha == 0 count: {np.sum(alpha == 0)}")
    print(f"Alpha > 0 count: {np.sum(alpha > 0)}")
    print(f"Alpha > 128 count: {np.sum(alpha > 128)}")
    
    # Check corners in alpha
    print(f"Alpha at (0,0): {alpha[0,0]}")
    print(f"Alpha at (0,-1): {alpha[0,-1]}")
    print(f"Alpha at (-1,0): {alpha[-1,0]}")
    print(f"Alpha at (-1,-1): {alpha[-1,-1]}")
    
    # Check RGB at corners
    print(f"RGB at (0,0): {output_arr[0,0,:3]}")
    print(f"RGB at (0,-1): {output_arr[0,-1,:3]}")
