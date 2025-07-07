import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PDFDocument } from 'pdf-lib';

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// PDF upload endpoint
app.post('/api/upload-pdf', upload.single('pdf'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No PDF file uploaded' });
      return;
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;

    // Process the PDF to extract form fields
    const pdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    const formFields = fields.map((field, index) => ({
      id: `field_${index}`,
      name: field.getName(),
      type: getFieldType(field),
      required: false,
      pageNumber: 1, // Default to page 1, could be enhanced to detect actual page
    }));

    res.json({
      success: true,
      data: {
        pdfId: req.file.filename,
        fileName,
        filePath,
        pages: pdfDoc.getPageCount(),
        formFields
      }
    });
  } catch (error) {
    console.error('Error processing PDF:', error);
    res.status(500).json({ 
      error: 'Failed to process PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PDF generation endpoint
app.post('/api/generate-pdf', async (req: Request, res: Response) => {
  try {
    const { pdfId, formData, fieldMappings } = req.body;

    if (!pdfId || !formData || !fieldMappings) {
      res.status(400).json({ error: 'Missing required parameters' });
      return;
    }

    const filePath = path.join(__dirname, '../uploads', pdfId);
    
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'PDF file not found' });
      return;
    }

    // Load the PDF
    const pdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    // Fill the form fields
    for (const mapping of fieldMappings) {
      const formFieldValue = formData[mapping.formFieldId];
      if (formFieldValue === undefined || formFieldValue === '') continue;

      const pdfField = fields.find(field => field.getName() === mapping.pdfFieldId);
      if (!pdfField) continue;

      try {
        fillField(pdfField, formFieldValue);
      } catch (error) {
        console.warn(`Failed to fill field ${mapping.pdfFieldId}:`, error);
      }
    }

    // Save the filled PDF
    const filledPdfBytes = await pdfDoc.save();
    
    // Create a temporary file for the filled PDF
    const outputFileName = `filled_${pdfId}`;
    const outputPath = path.join(__dirname, '../uploads', outputFileName);
    fs.writeFileSync(outputPath, filledPdfBytes);

    res.json({
      success: true,
      data: {
        downloadUrl: `/api/download/${outputFileName}`,
        filename: outputFileName
      }
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ 
      error: 'Failed to generate PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PDF download endpoint
app.get('/api/download/:filename', (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads', filename);
    
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    res.download(filePath, filename);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Helper function to get field type
function getFieldType(field: any): string {
  if (field.constructor.name === 'PDFTextField') {
    return 'text';
  } else if (field.constructor.name === 'PDFCheckBox') {
    return 'checkbox';
  } else if (field.constructor.name === 'PDFRadioGroup') {
    return 'radio';
  } else if (field.constructor.name === 'PDFDropdown') {
    return 'select';
  } else if (field.constructor.name === 'PDFSignature') {
    return 'signature';
  }
  return 'text';
}

// Helper function to fill field
function fillField(field: any, value: any) {
  if (field.constructor.name === 'PDFTextField') {
    field.setText(String(value));
  } else if (field.constructor.name === 'PDFCheckBox') {
    if (value === true || value === 'true') {
      field.check();
    } else {
      field.uncheck();
    }
  } else if (field.constructor.name === 'PDFRadioGroup') {
    field.select(String(value));
  } else if (field.constructor.name === 'PDFDropdown') {
    field.select(String(value));
  }
  // Note: PDF signatures would require additional handling with image data
}

// Error handling middleware
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
      return;
    }
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
}); 