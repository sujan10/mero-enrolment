"use client";

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  AppState, 
  PDFDocument, 
  FormField, 
  FieldMapping, 
  WorkflowStep,
  PDFFormField 
} from '../types';

interface AppStore extends AppState {
  // PDF Management Actions
  addPdf: (pdf: PDFDocument) => void;
  removePdf: (pdfId: string) => void;
  selectPdf: (pdf: PDFDocument | null) => void;
  updatePdfFields: (pdfId: string, fields: PDFFormField[]) => void;
  
  // Form Building Actions
  addFormField: (field: FormField) => void;
  updateFormField: (id: string, updates: Partial<FormField>) => void;
  removeFormField: (id: string) => void;
  reorderFormFields: (fromIndex: number, toIndex: number) => void;
  
  // Field Mapping Actions
  addFieldMapping: (mapping: FieldMapping) => void;
  updateFieldMapping: (mappingId: string, updates: Partial<FieldMapping>) => void;
  removeFieldMapping: (mappingId: string) => void;
  
  // Workflow Actions
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  resetWorkflow: () => void;
  
  // Form Data Actions
  updateFormData: (fieldId: string, value: any) => void;
  clearFormData: () => void;
  
  // UI State Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useAppStore = create<AppStore>()(
  devtools(
    (set, get) => ({
      // Initial State
      pdfs: [],
      selectedPdf: null,
      formFields: [],
      fieldMappings: [],
      currentStep: WorkflowStep.UPLOAD_PDF,
      totalSteps: Object.keys(WorkflowStep).length / 2, // Divide by 2 because enum has both keys and values
      formData: {},
      isLoading: false,
      error: null,

      // PDF Management Actions
      addPdf: (pdf) => set((state) => ({
        pdfs: [...state.pdfs, pdf],
        selectedPdf: state.selectedPdf || pdf
      })),

      removePdf: (pdfId) => set((state) => ({
        pdfs: state.pdfs.filter(pdf => pdf.id !== pdfId),
        selectedPdf: state.selectedPdf?.id === pdfId ? null : state.selectedPdf,
        fieldMappings: state.fieldMappings.filter(mapping => mapping.pdfId !== pdfId)
      })),

      selectPdf: (pdf) => set({ selectedPdf: pdf }),

      updatePdfFields: (pdfId, fields) => set((state) => ({
        pdfs: state.pdfs.map(pdf => 
          pdf.id === pdfId 
            ? { ...pdf, formFields: fields }
            : pdf
        ),
        selectedPdf: state.selectedPdf?.id === pdfId 
          ? { ...state.selectedPdf, formFields: fields }
          : state.selectedPdf
      })),

      // Form Building Actions
      addFormField: (field) => set((state) => ({
        formFields: [...state.formFields, { ...field, id: field.id || generateId() }]
      })),

      updateFormField: (id, updates) => set((state) => ({
        formFields: state.formFields.map(field =>
          field.id === id ? { ...field, ...updates } : field
        )
      })),

      removeFormField: (id) => set((state) => ({
        formFields: state.formFields.filter(field => field.id !== id),
        fieldMappings: state.fieldMappings.filter(mapping => mapping.formFieldId !== id)
      })),

      reorderFormFields: (fromIndex, toIndex) => set((state) => {
        const newFields = [...state.formFields];
        const [movedField] = newFields.splice(fromIndex, 1);
        newFields.splice(toIndex, 0, movedField);
        
        // Update order property
        const updatedFields = newFields.map((field, index) => ({
          ...field,
          order: index
        }));

        return { formFields: updatedFields };
      }),

      // Field Mapping Actions
      addFieldMapping: (mapping) => set((state) => ({
        fieldMappings: [...state.fieldMappings, { ...mapping, id: mapping.id || generateId() }]
      })),

      updateFieldMapping: (mappingId, updates) => set((state) => ({
        fieldMappings: state.fieldMappings.map(mapping =>
          mapping.id === mappingId ? { ...mapping, ...updates } : mapping
        )
      })),

      removeFieldMapping: (mappingId) => set((state) => ({
        fieldMappings: state.fieldMappings.filter(mapping => mapping.id !== mappingId)
      })),

      // Workflow Actions
      setCurrentStep: (step) => set({ currentStep: step }),

      nextStep: () => set((state) => ({
        currentStep: Math.min(state.currentStep + 1, state.totalSteps - 1)
      })),

      previousStep: () => set((state) => ({
        currentStep: Math.max(state.currentStep - 1, 0)
      })),

      resetWorkflow: () => set({
        currentStep: WorkflowStep.UPLOAD_PDF,
        formData: {},
        error: null
      }),

      // Form Data Actions
      updateFormData: (fieldId, value) => set((state) => ({
        formData: { ...state.formData, [fieldId]: value }
      })),

      clearFormData: () => set({ formData: {} }),

      // UI State Actions
      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'pdf-form-automation-store',
    }
  )
);

// Selector hooks for better performance
export const usePdfs = () => useAppStore((state) => state.pdfs);
export const useSelectedPdf = () => useAppStore((state) => state.selectedPdf);
export const useFormFields = () => useAppStore((state) => state.formFields);
export const useFieldMappings = () => useAppStore((state) => state.fieldMappings);
export const useCurrentStep = () => useAppStore((state) => state.currentStep);
export const useFormData = () => useAppStore((state) => state.formData);
export const useIsLoading = () => useAppStore((state) => state.isLoading);
export const useError = () => useAppStore((state) => state.error); 