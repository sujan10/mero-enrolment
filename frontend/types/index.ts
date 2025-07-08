// PDF Document Types
export interface PDFDocument {
  id: string;
  name: string;
  file: File;
  url?: string;
  pages: PDFPage[];
  formFields: PDFFormField[];
  createdAt: Date;
  originalName?: string;
  originalType?: string;
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

// User Role Types
export type UserRole = 'client' | 'admin' | 'owner';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
  createdBy?: string; // For tracking who created this user
}

// Step Types - Role-based workflows
export enum WorkflowStep {
  // Client Workflow (End User)
  CLIENT_FILL_FORM = 0,
  CLIENT_REVIEW_DATA = 1,
  CLIENT_SUBMIT = 2,

  // Admin Workflow (Form Builder)
  ADMIN_UPLOAD_PDF = 0,
  ADMIN_DETECT_FIELDS = 1,
  ADMIN_BUILD_FORM = 2,
  ADMIN_MAP_FIELDS = 3,
  ADMIN_PREVIEW_TEST = 4,
  ADMIN_PUBLISH_FORM = 5,

  // Owner Workflow (System Management)
  OWNER_DASHBOARD = 0,
  OWNER_MANAGE_ADMINS = 1,
  OWNER_MONITOR_LOGS = 2,
  OWNER_SYSTEM_SETTINGS = 3
}

// Role-specific workflow configurations
export const WORKFLOW_CONFIG = {
  client: {
    steps: [
      { id: WorkflowStep.CLIENT_FILL_FORM, title: 'Fill Form', description: 'Complete the form with your information' },
      { id: WorkflowStep.CLIENT_REVIEW_DATA, title: 'Review Data', description: 'Review your information before submission' },
      { id: WorkflowStep.CLIENT_SUBMIT, title: 'Submit', description: 'Submit your completed form' }
    ]
  },
  admin: {
    steps: [
      { id: WorkflowStep.ADMIN_UPLOAD_PDF, title: 'Upload PDF', description: 'Upload your PDF documents' },
      { id: WorkflowStep.ADMIN_DETECT_FIELDS, title: 'Detect Fields', description: 'Review and edit detected form fields' },
      { id: WorkflowStep.ADMIN_MAP_FIELDS, title: 'Map Fields', description: 'Connect form fields to PDF fields' },
      { id: WorkflowStep.ADMIN_BUILD_FORM, title: 'Build Form', description: 'Create your web form' },
      { id: WorkflowStep.ADMIN_PREVIEW_TEST, title: 'Preview & Test', description: 'Test the form before publishing' },
      { id: WorkflowStep.ADMIN_PUBLISH_FORM, title: 'Publish Form', description: 'Make the form available to clients' }
    ]
  },
  owner: {
    steps: [
      { id: WorkflowStep.OWNER_DASHBOARD, title: 'Dashboard', description: 'System overview and analytics' },
      { id: WorkflowStep.OWNER_MANAGE_ADMINS, title: 'Manage Admins', description: 'Create and manage admin users' },
      { id: WorkflowStep.OWNER_MONITOR_LOGS, title: 'Monitor Logs', description: 'View system activity and logs' },
      { id: WorkflowStep.OWNER_SYSTEM_SETTINGS, title: 'System Settings', description: 'Configure system-wide settings' }
    ]
  }
} as const;

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