"use client";

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { uploadToBlob, listBlobFiles, deleteFromBlob, formatFileSize } from '../../lib/blob';
import { Upload, Trash2, List, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const BlobTest: React.FC = () => {
  const [files, setFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const result = await uploadToBlob(file, `test-${Date.now()}-${file.name}`);
      toast.success(`File uploaded: ${result.url}`);
      console.log('Upload result:', result);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleListFiles = async () => {
    setIsLoading(true);
    try {
      const fileList = await listBlobFiles();
      setFiles(fileList);
      toast.success(`Found ${fileList.length} files`);
    } catch (error) {
      console.error('List error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFile = async (url: string) => {
    try {
      await deleteFromBlob(url);
      setFiles(prev => prev.filter(f => f.url !== url));
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Vercel BLOB Storage Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Upload Test File
            </label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                disabled={isLoading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {isLoading && <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></span>}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleListFiles}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <List className="h-4 w-4" />
              List Files
            </Button>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">Uploaded Files:</h3>
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {file.pathname}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFile(file.url)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BlobTest; 