"use client";

import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, AlertCircle, CheckCircle, Image as ImageIcon, AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { useAppStore } from '../../lib/store';
import { PDFDocument, PDFFormField, PDFPage } from '../../types';
import toast from 'react-hot-toast';
import { PDFDocument as PDFLibDocument } from 'pdf-lib';
import Tesseract from 'tesseract.js';
import { FieldNameManager, generateUniqueFieldId } from '../../lib/utils';
import { uploadToBlob, validateFile, deleteFromBlob } from '../../lib/blob';

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

interface LocalFile {
  id: string;
  file: File;
  name: string;
  type: string;
  size: number;
  status: 'pending' | 'processing' | 'ready' | 'error' | 'uploaded';
  message?: string;
  pdfDoc?: PDFDocument;
  pages?: number;
  formFields?: number;
  isUploading?: boolean;
}

interface PdfUploaderProps {
  onFilesReady?: (readyFiles: LocalFile[]) => void;
  onUploadComplete?: () => void;
  triggerUpload?: boolean;
}

const PdfUploader: React.FC<PdfUploaderProps> = ({ onFilesReady, onUploadComplete, triggerUpload }) => {
  const { pdfs, addPdf, removePdf, setLoading, setError } = useAppStore();
  const [localFiles, setLocalFiles] = useState<LocalFile[]>([]);
  const [processingFiles, setProcessingFiles] = useState<Set<string>>(new Set());
  const [isClient, setIsClient] = useState(false);
  const [deletingFiles, setDeletingFiles] = useState<Set<string>>(new Set());
  const [deleteProgress, setDeleteProgress] = useState<Record<string, number>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

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

  // Check for duplicate files - only against currently active files
  const isDuplicateFile = (file: File): boolean => {
    // Check against local files that are currently being processed or ready
    const localDuplicate = localFiles.some(localFile => 
      localFile.name === file.name && 
      localFile.size === file.size &&
      localFile.type === file.type &&
      (localFile.status === 'pending' || localFile.status === 'processing' || localFile.status === 'ready')
    );
    
    if (localDuplicate) return true;
    
    // Check against uploaded files that are currently in the store
    const uploadedDuplicate = pdfs.some(pdf => {
      const pdfName = pdf.originalName || pdf.name;
      return pdfName === file.name;
    });
    
    return uploadedDuplicate;
  };

  // Check for duplicate file types (different files with same name but different extensions)
  const isDuplicateFileType = (file: File): boolean => {
    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    
    // Check against local files that are currently active
    const localDuplicate = localFiles.some(localFile => {
      const localFileNameWithoutExt = localFile.name.replace(/\.[^/.]+$/, "");
      return localFileNameWithoutExt === fileNameWithoutExt && 
             localFile.name !== file.name &&
             (localFile.status === 'pending' || localFile.status === 'processing' || localFile.status === 'ready');
    });
    
    if (localDuplicate) return true;
    
    // Check against uploaded files that are currently in the store
    const uploadedDuplicate = pdfs.some(pdf => {
      const pdfName = pdf.originalName || pdf.name;
      const pdfNameWithoutExt = pdfName.replace(/\.[^/.]+$/, "");
      return pdfNameWithoutExt === fileNameWithoutExt && pdfName !== file.name;
    });
    
    return uploadedDuplicate;
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!isClient || !pdfjs) {
      toast.error('PDF processing is not ready yet. Please wait a moment and try again.');
      return;
    }

    setError(null);

    for (const file of acceptedFiles) {
      // Check for duplicate files
      if (isDuplicateFile(file)) {
        toast.error(`${file.name} is already added. Please select a different file.`);
        continue;
      }

      // Check for duplicate file types
      if (isDuplicateFileType(file)) {
        toast.error(`${file.name} conflicts with an existing file. Please use a different name.`);
        continue;
      }

      // Validate file using Vercel BLOB utilities
      if (!validateFile(file)) {
        toast.error(`${file.name} failed validation. Please try a different file.`);
        continue;
      }

      // Accept PDF, JPG, PNG
      const isPdf = file.type === 'application/pdf';
      const isJpg = file.type === 'image/jpeg';
      const isPng = file.type === 'image/png';
      if (!isPdf && !isJpg && !isPng) {
        toast.error(`${file.name} is not a supported file type (PDF, JPG, PNG only)`);
        continue;
      }

      const fileId = Math.random().toString(36).substr(2, 9);
      
      // Add file to local storage
      const localFile: LocalFile = {
        id: fileId,
        file,
        name: file.name,
        type: file.type,
        size: file.size,
        status: 'pending'
      };

      setLocalFiles(prev => [...prev, localFile]);
      setProcessingFiles(prev => new Set(prev).add(fileId));

      try {
        let pdfDoc: PDFDocument;
        if (isPdf) {
          pdfDoc = {
            id: fileId,
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
          const ocrData = await runOcr(file);
          pdfDoc = {
            id: fileId,
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

          // Generate candidate fields from OCR words
          const page0 = pdfDoc.pages[0];
          if(page0 && ocrData?.words){
            const ocrFields: PDFFormField[] = [];
            const isCandidate = (w:any)=>{
              const txt=w.text.trim();
              const boxWidth=w.bbox.x1-w.bbox.x0;
              if(/^[_\-]+$/.test(txt)) return true; // underline/dash
              if(txt.length<=2 && w.confidence<60 && boxWidth>30) return true; // blank-ish or low confidence
              return false;
            };
            
            // Create field name manager for OCR fields
            const { pdfs: existingPdfs } = useAppStore.getState();
            const fieldNameManager = new FieldNameManager(
              existingPdfs.flatMap(pdf => pdf.formFields)
            );
            
            ocrData.words.forEach((w:any, idx:number)=>{
              if(!isCandidate(w)) return;
              const x=w.bbox.x0;
              const yTop=w.bbox.y0;
              const width=w.bbox.x1-w.bbox.x0;
              const height=w.bbox.y1-w.bbox.y0;
              const pdfX=x;
              const pdfY = page0.height - (yTop + height);
              
              // Generate unique field name for OCR field
              const uniqueName = fieldNameManager.generateUniqueName(
                null, // No original name for OCR fields
                'text',
                'ocr_field'
              );
              
              // Generate unique field ID
              const uniqueId = generateUniqueFieldId(
                fileId,
                1, // OCR fields are always on page 1
                idx,
                uniqueName
              );
              
              ocrFields.push({
                id: uniqueId,
                name: uniqueName,
                type:'text',
                x:pdfX,
                y:pdfY,
                width,
                height,
                pageNumber:1
              });
            });
            pdfDoc.formFields.push(...ocrFields);
            page0.formFields.push(...ocrFields);
          }
          if (!ocrData || !ocrData.text.trim()) {
            setError(`No fillable fields detected in ${file.name}. Please add fields manually.`);
            toast.error(`No fillable fields detected in ${file.name}. Please add fields manually.`);
            setLocalFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'error', message: 'No fillable fields detected' } : f));
            continue;
          }
        }

        // Update local file with processed PDF document and details
        setLocalFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { 
                ...f, 
                status: 'ready', 
                pdfDoc,
                pages: pdfDoc.pages.length,
                formFields: pdfDoc.formFields.length
              } 
            : f
        ));

        toast.success(`${file.name} processed successfully`);
      } catch (error: any) {
        if (error?.message?.toLowerCase().includes('encrypted')) {
          toast.error(`${file.name} is encrypted and cannot be processed.`);
          setError(`${file.name} is encrypted and cannot be processed.`);
          setLocalFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'error', message: 'Encrypted PDF' } : f));
        } else {
          console.error('Error processing file:', error);
          toast.error(`Failed to process ${file.name}`);
          setError(`Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setLocalFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'error', message: 'Processing error' } : f));
        }
      } finally {
        setProcessingFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(fileId);
          return newSet;
        });
      }
    }
  }, [isClient, pdfjs, localFiles]);

  // Notify parent when files are ready
  useEffect(() => {
    const readyFiles = localFiles.filter(f => f.status === 'ready');
    onFilesReady?.(readyFiles);
  }, [localFiles, onFilesReady]);

  // Trigger upload when parent requests it
  useEffect(() => {
    if (triggerUpload) {
      handleBatchUpload();
    }
  }, [triggerUpload]);

  // Individual upload function with cancel capability
  const handleIndividualUpload = async (localFile: LocalFile) => {
    if (localFile.status !== 'ready') {
      toast.error('File is not ready for upload.');
      return;
    }

    if (!localFile.pdfDoc) {
      toast.error('No PDF document to upload.');
      return;
    }

    // If already uploading, cancel the upload
    if (localFile.isUploading) {
      setLocalFiles(prev => prev.map(f => 
        f.id === localFile.id ? { ...f, isUploading: false } : f
      ));
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[localFile.id];
        return newProgress;
      });
      toast('Upload cancelled');
      return;
    }

    // Start upload with progress tracking
    setLocalFiles(prev => prev.map(f => 
      f.id === localFile.id ? { ...f, isUploading: true } : f
    ));
    setUploadProgress(prev => ({ ...prev, [localFile.id]: 0 }));

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const current = prev[localFile.id] || 0;
          if (current < 90) {
            return { ...prev, [localFile.id]: current + 10 };
          }
          return prev;
        });
      }, 100);

      // Upload to Vercel BLOB storage
      const blobResult = await uploadToBlob(localFile.pdfDoc.file, `${localFile.id}-${localFile.name}`);
      localFile.pdfDoc.blobUrl = blobResult.url;
      
      // Complete progress
      setUploadProgress(prev => ({ ...prev, [localFile.id]: 100 }));
      
      // Small delay to show completion
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Add to store
      addPdf(localFile.pdfDoc);
      
      // Remove from local files after successful upload
      setLocalFiles(prev => prev.filter(f => f.id !== localFile.id));
      
      toast.success(`${localFile.name} uploaded successfully`);
    } catch (blobError) {
      console.error('Error uploading to BLOB:', blobError);
      // Still add the PDF to local state even if BLOB upload fails
      addPdf(localFile.pdfDoc!);
      setLocalFiles(prev => prev.map(f => 
        f.id === localFile.id ? { ...f, status: 'uploaded', isUploading: false } : f
      ));
      toast.success(`${localFile.name} processed successfully (local storage only)`);
    } finally {
      // Clean up progress
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[localFile.id];
        return newProgress;
      });
    }
  };

  // Batch upload function - called when Next button is clicked
  const handleBatchUpload = async () => {
    const readyFiles = localFiles.filter(f => f.status === 'ready');
    
    if (readyFiles.length === 0) {
      toast.error('No files ready for upload. Please wait for processing to complete.');
      return;
    }

    // Upload all files simultaneously
    const uploadPromises = readyFiles.map(localFile => handleIndividualUpload(localFile));
    
    try {
      await Promise.all(uploadPromises);
      // Call the upload complete callback
      onUploadComplete?.();
    } catch (error) {
      console.error('Some uploads failed:', error);
      // Still call the callback even if some uploads failed
      onUploadComplete?.();
    }
  };

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
          
          // Create field name manager to ensure unique names across all PDFs
          const { pdfs: existingPdfs } = useAppStore.getState();
          const fieldNameManager = new FieldNameManager(
            existingPdfs.flatMap(pdf => pdf.formFields)
          );
          
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 1.0 });
            
            pages.push({
              pageNumber: pageNum,
              width: viewport.width,
              height: viewport.height,
              formFields: []
            });
          }

          // Process form fields
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const annotations = await page.getAnnotations();
            
            const pageFormFields: PDFFormField[] = [];
            
            annotations.forEach((annotation: any, index: number) => {
              if (annotation.subtype === 'Widget') {
                const fieldType = getFieldType(annotation);
                const fieldName = annotation.fieldName || `field_${pageNum}_${index}`;
                
                // Generate unique field name
                const uniqueName = fieldNameManager.generateUniqueName(
                  fieldName,
                  fieldType,
                  'pdf_field'
                );
                
                // Generate unique field ID
                const uniqueId = generateUniqueFieldId(
                  pdfDoc.id,
                  pageNum,
                  index,
                  uniqueName
                );
                
                const rect = annotation.rect;
                const field: PDFFormField = {
                  id: uniqueId,
                  name: uniqueName,
                  type: fieldType,
                  x: rect[0],
                  y: rect[1],
                  width: rect[2] - rect[0],
                  height: rect[3] - rect[1],
                  pageNumber: pageNum,
                  required: false
                };
                
                pageFormFields.push(field);
              }
            });
            
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

  const runOcr = async (file: File): Promise<any> => {
    const { data } = await Tesseract.recognize(file, 'eng', {
      tessjs_create_tsv: '1',
    } as any);
    return data;
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

  const handleRemoveLocalFile = (fileId: string) => {
    setLocalFiles(prev => prev.filter(f => f.id !== fileId));
    toast.success('File removed');
  };

  // Handle deletion of uploaded files from BLOB storage with progress
  const handleRemoveUploadedFile = async (pdf: PDFDocument) => {
    const pdfId = pdf.id;
    
    // Start deletion process
    setDeletingFiles(prev => new Set(prev).add(pdfId));
    setDeleteProgress(prev => ({ ...prev, [pdfId]: 0 }));

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setDeleteProgress(prev => {
          const current = prev[pdfId] || 0;
          if (current < 90) {
            return { ...prev, [pdfId]: current + 10 };
          }
          return prev;
        });
      }, 100);

      // Remove from BLOB storage if it has a blobUrl
      if (pdf.blobUrl) {
        await deleteFromBlob(pdf.blobUrl);
      }
      
      // Complete progress
      setDeleteProgress(prev => ({ ...prev, [pdfId]: 100 }));
      
      // Small delay to show completion
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Remove from store
      removePdf(pdf.id);
      toast.success('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      // Still remove from store even if BLOB deletion fails
      removePdf(pdf.id);
      toast.success('File removed from local storage');
    } finally {
      // Clean up
      setDeletingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(pdfId);
        return newSet;
      });
      setDeleteProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[pdfId];
        return newProgress;
      });
    }
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

  const readyFiles = localFiles.filter(f => f.status === 'ready');
  const hasReadyFiles = readyFiles.length > 0;
  const hasProcessingFiles = processingFiles.size > 0;

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

          {/* Local Files List */}
          {localFiles.length > 0 && (
            <div className="mt-6 space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Selected Files ({localFiles.length})
              </h3>
              {localFiles.map(file => (
                <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    {processingFiles.has(file.id) && <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></span>}
                    {file.status === 'ready' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {file.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                    {file.status === 'pending' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                    {file.status === 'uploaded' && <CheckCircle className="h-4 w-4 text-blue-500" />}
                    
                    <div>
                      <span className="font-medium text-gray-900">{file.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({file.type === 'application/pdf' ? 'PDF' : file.type === 'image/jpeg' ? 'JPG' : file.type === 'image/png' ? 'PNG' : file.type.toUpperCase()})
                      </span>
                      {file.pages && (
                        <div className="text-xs text-gray-500 mt-1">
                          {(file.size / 1024 / 1024).toFixed(2)} MB • {file.pages} pages • {file.formFields || 0} form fields
                        </div>
                      )}
                      {file.message && <span className="text-xs text-red-500 ml-2">{file.message}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {file.status === 'ready' && (
                      <div className="flex items-center gap-2">
                        {file.isUploading && (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                            <span className="text-xs text-blue-500">Uploading...</span>
                            <div className="w-16">
                              <Progress value={uploadProgress[file.id] || 0} className="h-1" />
                            </div>
                          </div>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleIndividualUpload(file)}
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                          disabled={file.isUploading}
                        >
                          <Upload className="h-4 w-4" />
                          <span className="ml-1 text-xs">Upload</span>
                        </Button>
                      </div>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleRemoveLocalFile(file.id)}
                      disabled={processingFiles.has(file.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Processing Status */}
          {hasProcessingFiles && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Please wait for all files to finish processing...
              </p>
            </div>
          )}
        </div>

        {/* Previously Uploaded Files */}
        {pdfs.length > 0 && (
          <Card className="mt-8 relative">
            <div className="absolute top-4 left-6 text-xl font-bold">
              Uploaded documents <span className="text-base text-gray-500">({pdfs.length})</span>
            </div>
            <CardContent className="flex flex-col items-center justify-center pt-12">
              <div className="space-y-4 w-full">
                {pdfs.map((pdf) => {
                  const displayName = pdf.originalName || pdf.name;
                  const displayType = pdf.originalType || pdf.file.type;
                  const extension = displayName.split('.').pop()?.toUpperCase() || '';
                  const isDeleting = deletingFiles.has(pdf.id);
                  const deleteProgressValue = deleteProgress[pdf.id] || 0;
                  
                  return (
                    <div
                      key={pdf.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
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
                      <div className="flex items-center gap-2">
                        {isDeleting && (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                            <span className="text-xs text-red-500">Deleting...</span>
                            <div className="w-16">
                              <Progress value={deleteProgressValue} className="h-1" />
                            </div>
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveUploadedFile(pdf)}
                          disabled={isDeleting}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="ml-1 text-xs">Delete</span>
                        </Button>
                      </div>
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