"use client";

import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useAppStore } from '../../lib/store';
import { PDFDocument, PDFFormField, PDFPage } from '../../types';
import toast from 'react-hot-toast';

// Dynamic imports for react-pdf components
let Document: any = null;
let Page: any = null;
let pdfjs: any = null;

const PdfUploader: React.FC = () => {
  const { pdfs, addPdf, removePdf, setLoading, setError } = useAppStore();
  const [processingPdfs, setProcessingPdfs] = useState<Set<string>>(new Set());
  const [isClient, setIsClient] = useState(false);

  // Load react-pdf components only on client side
  useEffect(() => {
    const loadPdfComponents = async () => {
      try {
        const reactPdf = await import('react-pdf');
        Document = reactPdf.Document;
        Page = reactPdf.Page;
        pdfjs = reactPdf.pdfjs;
        
        // Set workerSrc for pdfjs to use local worker
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
        
        setIsClient(true);
      } catch (error) {
        console.error('Failed to load PDF components:', error);
        setError('Failed to load PDF processing components');
      }
    };

    loadPdfComponents();
  }, [setError]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!isClient || !pdfjs) {
      toast.error('PDF processing is not ready yet. Please wait a moment and try again.');
      return;
    }

    setLoading(true);
    setError(null);

    for (const file of acceptedFiles) {
      if (file.type !== 'application/pdf') {
        toast.error(`${file.name} is not a valid PDF file`);
        continue;
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error(`${file.name} is too large. Maximum size is 10MB`);
        continue;
      }

      const pdfId = Math.random().toString(36).substr(2, 9);
      setProcessingPdfs(prev => new Set(prev).add(pdfId));

      try {
        // Create PDF document object
        const pdfDoc: PDFDocument = {
          id: pdfId,
          name: file.name,
          file,
          pages: [],
          formFields: [],
          createdAt: new Date()
        };

        // Process PDF to extract form fields
        await processPdf(pdfDoc);
        
        addPdf(pdfDoc);
        toast.success(`${file.name} uploaded successfully`);
      } catch (error) {
        console.error('Error processing PDF:', error);
        toast.error(`Failed to process ${file.name}`);
        setError(`Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setProcessingPdfs(prev => {
          const newSet = new Set(prev);
          newSet.delete(pdfId);
          return newSet;
        });
      }
    }

    setLoading(false);
  }, [addPdf, setLoading, setError, isClient, pdfjs]);

  const processPdf = async (pdfDoc: PDFDocument): Promise<void> => {
    if (!pdfjs) {
      throw new Error('PDF processing not available');
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
          
          const pages: PDFPage[] = [];
          const allFormFields: PDFFormField[] = [];
          
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 1.0 });
            
            pages.push({
              pageNumber: pageNum,
              width: viewport.width,
              height: viewport.height,
              formFields: []
            });

            // Extract form fields from the page
            const annotations = await page.getAnnotations();
            const pageFormFields: PDFFormField[] = annotations
              .filter((annotation: any) => annotation.subtype === 'Widget')
              .map((annotation: any, index: number) => ({
                id: `${pdfDoc.id}_page${pageNum}_field${index}`,
                name: annotation.fieldName || `field_${index}`,
                type: getFieldType(annotation),
                x: annotation.rect[0],
                y: annotation.rect[1],
                width: annotation.rect[2] - annotation.rect[0],
                height: annotation.rect[3] - annotation.rect[1],
                pageNumber: pageNum,
                required: false,
                options: annotation.fieldValue ? [annotation.fieldValue] : undefined
              }));

            allFormFields.push(...pageFormFields);
            pages[pageNum - 1].formFields = pageFormFields;
          }

          pdfDoc.pages = pages;
          pdfDoc.formFields = allFormFields;
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(pdfDoc.file);
    });
  };

  const getFieldType = (annotation: any): PDFFormField['type'] => {
    const fieldType = annotation.fieldType;
    
    switch (fieldType) {
      case 'Tx': return 'text';
      case 'Btn':
        return annotation.checkBox ? 'checkbox' : 'radio';
      case 'Ch': return 'select';
      case 'Sig': return 'signature';
      default: return 'text';
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: true,
    disabled: !isClient
  });

  const handleRemovePdf = (pdfId: string) => {
    removePdf(pdfId);
    toast.success('PDF removed');
  };

  // Show loading state while PDF components are loading
  if (!isClient) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload PDF Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading PDF processing components...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload PDF Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            {isDragActive ? (
              <p className="text-lg font-medium text-blue-600">Drop the PDF files here...</p>
            ) : (
              <div>
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Drag & drop PDF files here, or click to select
                </p>
                <p className="text-sm text-gray-500">
                  Supports multiple PDF files up to 10MB each
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Uploaded PDFs */}
      {pdfs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Uploaded PDFs ({pdfs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pdfs.map((pdf) => (
                <div
                  key={pdf.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {processingPdfs.has(pdf.id) ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      <FileText className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{pdf.name}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{(pdf.file.size / 1024 / 1024).toFixed(2)} MB</span>
                        <span>{pdf.pages.length} pages</span>
                        <span>{pdf.formFields.length} form fields</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemovePdf(pdf.id)}
                    disabled={processingPdfs.has(pdf.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PdfUploader; 