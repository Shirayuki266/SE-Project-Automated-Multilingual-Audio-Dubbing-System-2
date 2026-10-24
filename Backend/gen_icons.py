from PIL import Image, ImageDraw

img = Image.new("RGBA", (512, 512), (92, 43, 22, 255))
draw = ImageDraw.Draw(img)
draw.ellipse([40, 40, 472, 472], outline="#ffd700", width=12)
draw.ellipse([80, 80, 432, 432], outline="#e2c88f", width=4)
# Central text
draw.text((256, 256), "VNQT", fill="#ffd700", anchor="mm")
img.save("../Frontend/public/pwa-512x512.png")
img.resize((192, 192)).save("../Frontend/public/pwa-192x192.png")
print("PWA icons generated successfully!")
