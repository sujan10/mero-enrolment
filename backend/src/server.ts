import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PDFDocument } from 'pdf-lib';
import jwt from 'jsonwebtoken';
import { 
  initUserDb, 
  createUser, 
  findUserByEmail, 
  updateUserStatus, 
  updateUserPassword,
  createWorkspace,
  getWorkspacesByUserId,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  createPdfFile,
  getPdfFilesByWorkspaceId,
  deletePdfFile,
  createFormField,
  getFormFieldsByWorkspaceId,
  updateFormField,
  deleteFormField,
  createFormMapping,
  getFormMappingsByWorkspaceId,
  deleteFormMapping
} from './user';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize user DB
initUserDb();

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
    // Allow PDFs and images (JPG, PNG)
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, and PNG files are allowed'));
    }
  }
});

// Auth middleware
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Missing auth token' });
  const token = authHeader.split(' ')[1];
  try {
    const user = jwt.verify(token, JWT_SECRET);
    (req as any).user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Register endpoint
app.post('/api/register', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }
  try {
    await createUser(email, password);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: 'User already exists' });
  }
});

// Login endpoint
app.post('/api/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }
  const user = await findUserByEmail(email);
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  const valid = await require('bcrypt').compare(password, user.password);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  const token = jwt.sign({ 
    sub: user.id,
    email: user.email, 
    role: user.role, 
    status: user.status 
  }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

// Change password endpoint
app.post('/api/change-password', authMiddleware, async (req: Request, res: Response) => {
  const { newPassword } = req.body;
  const user = (req as any).user;
  
  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters long' });
    return;
  }
  
  try {
    await updateUserPassword(user.email, newPassword);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// Workspaces endpoints
app.get('/api/workspaces', authMiddleware, async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const workspaces = await getWorkspacesByUserId(user.sub);
    res.json({ workspaces });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workspaces' });
  }
});

app.post('/api/workspaces', authMiddleware, async (req: Request, res: Response) => {
  const { name } = req.body;
  const user = (req as any).user;
  
  if (!name) {
    res.status(400).json({ error: 'Workspace name is required' });
    return;
  }
  
  try {
    const workspaceId = await createWorkspace(name, user.sub);
    res.json({ success: true, workspaceId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create workspace' });
  }
});

app.get('/api/workspaces/:id', authMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;
  
  try {
    const workspace = await getWorkspaceById(parseInt(id), user.sub);
    if (!workspace) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }
    res.json({ workspace });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workspace' });
  }
});

app.put('/api/workspaces/:id', authMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  const user = (req as any).user;
  
  try {
    await updateWorkspace(parseInt(id), updates);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update workspace' });
  }
});

app.delete('/api/workspaces/:id', authMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;
  
  try {
    await deleteWorkspace(parseInt(id), user.sub);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete workspace' });
  }
});

// PDF files endpoints
app.get('/api/pdfs', authMiddleware, async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    // Get all PDFs for the user (across all workspaces)
    const workspaces = await getWorkspacesByUserId(user.sub);
    const allPdfs = [];
    
    for (const workspace of workspaces) {
      const pdfs = await getPdfFilesByWorkspaceId(workspace.id, user.sub);
      allPdfs.push(...pdfs);
    }
    
    res.json({ pdfs: allPdfs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch PDF files' });
  }
});

app.get('/api/workspaces/:workspaceId/pdfs', authMiddleware, async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const user = (req as any).user;
  
  try {
    const pdfs = await getPdfFilesByWorkspaceId(parseInt(workspaceId), user.sub);
    res.json({ pdfs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch PDF files' });
  }
});

app.post('/api/pdfs', authMiddleware, async (req: Request, res: Response) => {
  const { workspaceId, fileName, originalName, blobUrl, fileSize, pages } = req.body;
  const user = (req as any).user;
  
  if (!workspaceId || !fileName || !originalName) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  
  try {
    const pdfId = await createPdfFile(
      parseInt(workspaceId), 
      user.sub, 
      fileName, 
      originalName, 
      blobUrl, 
      fileSize, 
      pages
    );
    res.json({ success: true, pdfId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create PDF file record' });
  }
});

app.delete('/api/pdfs/:id', authMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;
  
  try {
    await deletePdfFile(parseInt(id), user.sub);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete PDF file' });
  }
});

// Form fields endpoints
app.get('/api/workspaces/:workspaceId/form-fields', authMiddleware, async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const user = (req as any).user;
  
  try {
    const fields = await getFormFieldsByWorkspaceId(parseInt(workspaceId), user.sub);
    res.json({ fields });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch form fields' });
  }
});

app.post('/api/workspaces/:workspaceId/form-fields', authMiddleware, async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const fieldData = req.body;
  const user = (req as any).user;
  
  try {
    const fieldId = await createFormField(parseInt(workspaceId), fieldData);
    res.json({ success: true, fieldId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create form field' });
  }
});

// Form mappings endpoints
app.get('/api/workspaces/:workspaceId/mappings', authMiddleware, async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const user = (req as any).user;
  
  try {
    const mappings = await getFormMappingsByWorkspaceId(parseInt(workspaceId), user.sub);
    res.json({ mappings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch form mappings' });
  }
});

app.post('/api/workspaces/:workspaceId/mappings', authMiddleware, async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const { formFieldId, pdfFieldId, pdfFileId, isRepeated, repeatedPages } = req.body;
  const user = (req as any).user;
  
  try {
    const mappingId = await createFormMapping(
      parseInt(workspaceId), 
      formFieldId, 
      pdfFieldId, 
      parseInt(pdfFileId), 
      isRepeated, 
      repeatedPages
    );
    res.json({ success: true, mappingId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create form mapping' });
  }
});

// Invite endpoint (admin only)
app.post('/api/invite', authMiddleware, async (req: Request, res: Response) => {
  const { email, tempPassword, role } = req.body;
  const user = (req as any).user;
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  try {
    await createUser(email, tempPassword, role || 'user');
    // TODO: Send invite email with tempPassword
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: 'User already exists' });
  }
});

// Helper function to get field type
function getFieldType(field: any): string {
  const fieldType = field.constructor.name;
  switch (fieldType) {
    case 'PDFCheckBox':
      return 'checkbox';
    case 'PDFRadioGroup':
      return 'radio';
    case 'PDFDropdown':
      return 'select';
    case 'PDFSignature':
      return 'signature';
    case 'PDFDate':
      return 'date';
    default:
      return 'text';
  }
}

// PDF upload endpoint
app.post('/api/upload-pdf', authMiddleware, upload.single('pdf'), async (req: Request, res: Response) => {
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
app.post('/api/generate-pdf', authMiddleware, async (req: Request, res: Response) => {
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
app.get('/api/download/:filename', authMiddleware, (req: Request, res: Response) => {
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
  
  // Handle file type errors
  if (error.message === 'Only PDF files are allowed') {
    res.status(400).json({ error: 'Only PDF files are allowed' });
    return;
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
}); 