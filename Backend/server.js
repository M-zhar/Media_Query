const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');

const router = express.Router();

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure Multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

// Temporary storage for image links
let links = {};

// Endpoint for image uploads
router.post('/upload', upload.array('images'), (req, res) => {
  const linkId = uuidv4();
  const images = req.files.map((file) => ({
    url: `http://localhost:8000/uploads/${file.filename}`,
    filename: file.filename,
    originalname: file.originalname,
  }));

  links[linkId] = images;

  console.log(`Uploaded images for linkId: ${linkId}`);
  console.log(images);

  res.json({ linkId, images });
});

// Endpoint to retrieve images by link ID
router.get('/gallery/:linkId', (req, res) => {
  const { linkId } = req.params;
  const images = links[linkId];

  if (images) {
    console.log(`Serving gallery for linkId: ${linkId}`);
    res.send(
      `<html>
        <head>
          <title>Gallery</title>
          <style>
  /* Gallery container */
  .gallery {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    justify-content: center;
    padding: 20px;
    background-color: #f9f9f9;
    border-radius: 10px;
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  }

  /* Individual gallery item */
  .gallery-item {
    text-align: center;
    border: 2px solid #ddd;
    border-radius: 10px;
    padding: 10px;
    background-color: #ffffff;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  }

  .gallery-item:hover {
    transform: translateY(-5px);
    box-shadow: 0px 6px 12px rgba(0, 0, 0, 0.15);
  }

  /* Gallery image styling */
  .gallery-image {
    max-width: 300px;
    height: auto;
    border-radius: 8px;
    margin-bottom: 10px;
    transition: opacity 0.3s ease;
  }

  .gallery-image:hover {
    opacity: 0.9;
  }

  /* Download button */
  .download-link {
    margin-top: 10px;
    padding: 8px 15px;
    background-color: #28a745;
    color: #ffffff;
    text-decoration: none;
    font-weight: bold;
    border-radius: 20px;
    transition: background-color 0.3s ease, transform 0.3s ease;
  }

  .download-link:hover {
    background-color: #218838;
    transform: scale(1.1);
  }
</style>

        </head>
        <body>
          <h1>Gallery</h1>
          <div class="gallery">
            ${images
              .map(
                (image) => `<div class="gallery-item">
                  <img src="${image.url}" alt="${image.originalname}" class="gallery-image" />
                  <a href="/api/download/${image.filename}" class="download-link">Download</a>
                </div>`
              )
              .join('')}
          </div>
        </body>
      </html>`
    );
  } else {
    console.error(`No images found for linkId: ${linkId}`);
    res.status(404).send('Images not found');
  }
});

// Endpoint to serve the image for download
router.get('/download/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.resolve(uploadDir, filename);

  if (fs.existsSync(filePath)) {
    const mimeType = mime.lookup(filePath) || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    fs.createReadStream(filePath).pipe(res);
  } else {
    console.error(`File not found: ${filename}`);
    res.status(404).send('File not found');
  }
});

module.exports = router;
