"use client";

import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// Set workerSrc for pdfjs
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const PdfUploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
      setNumPages(null);
    } else {
      setError('Please select a valid PDF file.');
      setFile(null);
      setNumPages(null);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  return (
    <div className="p-4 border rounded shadow-md max-w-xl mx-auto mt-8">
      <h2 className="text-lg font-bold mb-4">Upload and View PDF</h2>
      <input
        type="file"
        accept="application/pdf"
        onChange={onFileChange}
        className="mb-4"
      />
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {file && (
        <div className="mb-4">
          <strong>File Name:</strong> {file.name} <br />
          <strong>File Size:</strong> {(file.size / 1024).toFixed(2)} KB <br />
          {numPages !== null && <><strong>Pages:</strong> {numPages}</>}
        </div>
      )}
      {file && (
        <div className="border p-2 bg-gray-50">
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={() => setError('Failed to load PDF.')}
          >
            {Array.from(new Array(numPages), (el, index) => (
              <Page key={`page_${index + 1}`} pageNumber={index + 1} />
            ))}
          </Document>
        </div>
      )}
    </div>
  );
};

export default PdfUploader; 