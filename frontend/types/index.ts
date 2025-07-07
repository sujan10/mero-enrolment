// PDF Document Types
export interface PDFDocument {
  id: string;
  name: string;
  file: File;
  url?: string;
  pages: PDFPage[];
  formFields: PDFFormField[];
  createdAt: Date;
}

export interface PDFPage {
  pageNumber: number;
  width: number;
  height: number;
  formFields: PDFFormField[];
}

export interface PDFFormField {
  id: string;
  name: string;
  type: 'text' | 'checkbox' | 'radio' | 'signature' | 'date' | 'select';
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumber: number;
  required?: boolean;
  options?: string[]; // For radio/select fields
  defaultValue?: string;
}

// Form Builder Types
export interface FormField {
  id: string;
  name: string; // Field name (e.g., "firstName", "email")
  label: string; // Display label (e.g., "First Name", "Email Address")
  type: 'text' | 'email' | 'number' | 'tel' | 'date' | 'checkbox' | 'radio' | 'select' | 'textarea' | 'signature';
  required: boolean;
  placeholder?: string;
  options?: string[]; // For radio/select fields
  validation?: FieldValidation;
  group?: string; // For field grouping
  order: number;
}

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  custom?: (value: any) => boolean | string;
}

// Field Mapping Types
export interface FieldMapping {
  id: string;
  formFieldId: string;
  pdfFieldId: string;
  pdfId: string;
  isRepeated: boolean;
  repeatedPages?: number[]; // For fields that appear on multiple pages
}

// Application State Types
export interface AppState {
  // PDF Management
  pdfs: PDFDocument[];
  selectedPdf: PDFDocument | null;
  
  // Form Building
  formFields: FormField[];
  fieldMappings: FieldMapping[];
  
  // Workflow
  currentStep: number;
  totalSteps: number;
  
  // Form Data
  formData: Record<string, any>;
  
  // UI State
  isLoading: boolean;
  error: string | null;
}

// Step Types
export enum WorkflowStep {
  UPLOAD_PDF = 0,
  DETECT_FIELDS = 1,
  BUILD_FORM = 2,
  MAP_FIELDS = 3,
  PREVIEW_TEST = 4,
  GENERATE_PDF = 5
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PDFUploadResponse {
  pdfId: string;
  pages: number;
  formFields: PDFFormField[];
}

export interface PDFGenerationResponse {
  downloadUrl: string;
  filename: string;
}

// Form Data Types
export interface FormSubmission {
  formData: Record<string, any>;
  fieldMappings: FieldMapping[];
  pdfIds: string[];
}

// Signature Types
export interface SignatureData {
  id: string;
  fieldId: string;
  imageData: string; // Base64 encoded signature
  timestamp: Date;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// Utility Types
export type FormFieldType = FormField['type'];
export type PDFFieldType = PDFFormField['type'];

// Component Props Types
export interface PDFViewerProps {
  pdf: PDFDocument;
  onFieldSelect?: (field: PDFFormField) => void;
  selectedFields?: PDFFormField[];
  showFieldOverlays?: boolean;
}

export interface FormBuilderProps {
  formFields: FormField[];
  onFieldAdd: (field: FormField) => void;
  onFieldUpdate: (id: string, field: Partial<FormField>) => void;
  onFieldDelete: (id: string) => void;
  onFieldReorder: (fromIndex: number, toIndex: number) => void;
}

export interface FieldMapperProps {
  formFields: FormField[];
  pdfFields: PDFFormField[];
  mappings: FieldMapping[];
  onMappingCreate: (mapping: FieldMapping) => void;
  onMappingDelete: (mappingId: string) => void;
  onMappingUpdate: (mappingId: string, updates: Partial<FieldMapping>) => void;
}

export interface SignatureCaptureProps {
  onSave: (signatureData: SignatureData) => void;
  onClear: () => void;
  fieldId: string;
} 