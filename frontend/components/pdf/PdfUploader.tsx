"use client";

import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, AlertCircle, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useAppStore } from '../../lib/store';
import { PDFDocument, PDFFormField, PDFPage } from '../../types';
import toast from 'react-hot-toast';
import { PDFDocument as PDFLibDocument } from 'pdf-lib';
import Tesseract from 'tesseract.js';

// Dynamic imports for react-pdf components
let Document: any = null;
let Page: any = null;
let pdfjs: any = null;

// Add a new type for file status
interface UploadFileStatus {
  id: string;
  name: string;
  type: string;
  status: 'processing' | 'success' | 'error';
  message?: string;
}

const PdfUploader: React.FC = () => {
  const { pdfs, addPdf, removePdf, setLoading, setError } = useAppStore();
  const [processingPdfs, setProcessingPdfs] = useState<Set<string>>(new Set());
  const [fileStatuses, setFileStatuses] = useState<UploadFileStatus[]>([]);
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
      // Accept PDF, JPG, PNG
      const isPdf = file.type === 'application/pdf';
      const isJpg = file.type === 'image/jpeg';
      const isPng = file.type === 'image/png';
      if (!isPdf && !isJpg && !isPng) {
        toast.error(`${file.name} is not a supported file type (PDF, JPG, PNG only)`);
        setFileStatuses(prev => [...prev, { id: file.name + Date.now(), name: file.name, type: file.type, status: 'error', message: 'Unsupported file type' }]);
        continue;
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error(`${file.name} is too large. Maximum size is 10MB`);
        setFileStatuses(prev => [...prev, { id: file.name + Date.now(), name: file.name, type: file.type, status: 'error', message: 'File too large' }]);
        continue;
      }

      const pdfId = Math.random().toString(36).substr(2, 9);
      setProcessingPdfs(prev => new Set(prev).add(pdfId));
      setFileStatuses(prev => [...prev, { id: pdfId, name: file.name, type: file.type, status: 'processing' }]);

      try {
        let pdfDoc: PDFDocument;
        if (isPdf) {
          pdfDoc = {
            id: pdfId,
            name: file.name,
            file,
            pages: [],
            formFields: [],
            createdAt: new Date(),
            originalName: file.name,
            originalType: file.type
          };
          await processPdf(pdfDoc);
        } else {
          const pdfFile = await convertImageToPdf(file);
          toast('Running OCR to detect fields...');
          const ocrText = await runOcr(file);
          pdfDoc = {
            id: pdfId,
            name: file.name,
            file: pdfFile,
            pages: [],
            formFields: [],
            createdAt: new Date(),
            originalName: file.name,
            originalType: file.type
          };
          // Populate pages dimensions from generated PDF so viewer can render
          await processPdf(pdfDoc);

          if (!ocrText.trim()) {
            setError(`No fillable fields detected in ${file.name}. Please add fields manually.`);
            toast.error(`No fillable fields detected in ${file.name}. Please add fields manually.`);
            setFileStatuses(prev => prev.map(f => f.id === pdfId ? { ...f, status: 'error', message: 'No fillable fields detected' } : f));
            continue;
          }
        }
        addPdf(pdfDoc);
        toast.success(`${file.name} uploaded successfully`);
        setFileStatuses(prev => prev.map(f => f.id === pdfId ? { ...f, status: 'success' } : f));
      } catch (error: any) {
        if (error?.message?.toLowerCase().includes('encrypted')) {
          toast.error(`${file.name} is encrypted and cannot be processed.`);
          setError(`${file.name} is encrypted and cannot be processed.`);
          setFileStatuses(prev => prev.map(f => f.id === pdfId ? { ...f, status: 'error', message: 'Encrypted PDF' } : f));
        } else {
          console.error('Error processing file:', error);
          toast.error(`Failed to process ${file.name}`);
          setError(`Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setFileStatuses(prev => prev.map(f => f.id === pdfId ? { ...f, status: 'error', message: 'Processing error' } : f));
        }
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

  const convertImageToPdf = async (file: File): Promise<File> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFLibDocument.create();
    const imageBytes = new Uint8Array(arrayBuffer);
    let imageEmbed, dims;
    if (file.type === 'image/jpeg') {
      imageEmbed = await pdfDoc.embedJpg(imageBytes);
      dims = imageEmbed.scale(1);
    } else if (file.type === 'image/png') {
      imageEmbed = await pdfDoc.embedPng(imageBytes);
      dims = imageEmbed.scale(1);
    } else {
      throw new Error('Unsupported image type');
    }
    const page = pdfDoc.addPage([dims.width, dims.height]);
    page.drawImage(imageEmbed, { x: 0, y: 0, width: dims.width, height: dims.height });
    const pdfBytes = await pdfDoc.save();
    return new File([pdfBytes], file.name.replace(/\.(jpg|jpeg|png)$/i, '.pdf'), { type: 'application/pdf' });
  };

  const runOcr = async (file: File): Promise<string> => {
    const { data } = await Tesseract.recognize(file, 'eng');
    return data.text;
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
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    multiple: true,
    disabled: !isClient
  });

  const handleRemovePdf = (pdfId: string) => {
    removePdf(pdfId);
    toast.success('PDF removed');
  };

  const handleRemoveFileStatus = (id: string) => {
    setFileStatuses(prev => prev.filter(f => f.id !== id));
  };

  // Show loading state while PDF components are loading
  if (!isClient) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading PDF processing components...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div>
        <div className="mt-4">
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
            {isDragActive ? (
              <p className="text-lg font-medium text-blue-600">Drop the files here...</p>
            ) : (
              <div>
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Drag & drop PDF, JPG, or PNG files here, or click to select
                </p>
                <p className="text-sm text-gray-500">
                  Supports multiple files up to 10MB each
                </p>
              </div>
            )}
          </div>
          {/* File Status List */}
          {fileStatuses.filter(file => file.status !== 'success').length > 0 && (
            <div className="mt-6 space-y-2">
              {fileStatuses.filter(file => file.status !== 'success').map(file => (
                <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    {file.status === 'processing' && <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></span>}
                    {file.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {file.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                    <span className="font-medium text-gray-900">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      ({file.type === 'application/pdf' ? 'PDF' : file.type === 'image/jpeg' ? 'JPG' : file.type === 'image/png' ? 'PNG' : file.type.toUpperCase()})
                    </span>
                    {file.message && <span className="text-xs text-red-500 ml-2">{file.message}</span>}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveFileStatus(file.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        {pdfs.length > 0 && (
          <Card className="mt-8 relative">
            {/* Title without cross icons */}
            <div className="absolute top-4 left-6 text-xl font-bold">
              Uploaded documents <span className="text-base text-gray-500">({pdfs.length})</span>
            </div>
            <CardContent className="flex flex-col items-center justify-center pt-12">
              <div className="space-y-4 w-full">
                {pdfs.map((pdf) => {
                  const displayName = pdf.originalName || pdf.name;
                  const displayType = pdf.originalType || pdf.file.type;
                  const extension = displayName.split('.').pop()?.toUpperCase() || '';
                  return (
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
                          {displayType === 'application/pdf' ? (
                            <FileText className="h-5 w-5 text-gray-500" />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{displayName} <span className="text-xs text-gray-500">({extension})</span></p>
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
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default PdfUploader; 