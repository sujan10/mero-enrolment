"use client";

import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { PenTool, RotateCcw, Download, Upload } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { SignatureData } from '../../types';
import toast from 'react-hot-toast';

interface SignatureCaptureProps {
  onSave: (signatureData: SignatureData) => void;
  onClear: () => void;
  fieldId: string;
  initialValue?: string;
}

const SignatureCapture: React.FC<SignatureCaptureProps> = ({
  onSave,
  onClear,
  fieldId,
  initialValue
}) => {
  const signatureRef = useRef<SignatureCanvas>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const handleBegin = () => {
    setIsDrawing(true);
  };

  const handleEnd = () => {
    setIsDrawing(false);
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      setHasSignature(true);
    }
  };

  const handleClear = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setHasSignature(false);
      onClear();
    }
  };

  const handleSave = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      const signatureData: SignatureData = {
        id: Math.random().toString(36).substr(2, 9),
        fieldId,
        imageData: signatureRef.current.getTrimmedCanvas().toDataURL('image/png'),
        timestamp: new Date()
      };
      
      onSave(signatureData);
      toast.success('Signature saved successfully');
    } else {
      toast.error('Please draw a signature first');
    }
  };

  const handleDownload = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      const canvas = signatureRef.current.getTrimmedCanvas();
      const link = document.createElement('a');
      link.download = `signature-${fieldId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Signature downloaded');
    } else {
      toast.error('No signature to download');
    }
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            if (signatureRef.current) {
              const canvas = signatureRef.current.getCanvas();
              const ctx = canvas.getContext('2d');
              if (ctx) {
                // Clear the canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Calculate scaling to fit the signature
                const scale = Math.min(
                  canvas.width / img.width,
                  canvas.height / img.height
                );
                
                const scaledWidth = img.width * scale;
                const scaledHeight = img.height * scale;
                const x = (canvas.width - scaledWidth) / 2;
                const y = (canvas.height - scaledHeight) / 2;
                
                ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
                setHasSignature(true);
                toast.success('Signature uploaded successfully');
              }
            }
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        toast.error('Please select an image file');
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PenTool className="h-5 w-5" />
          Signature Capture
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Signature Canvas */}
        <div className="border rounded-lg overflow-hidden">
          <SignatureCanvas
            ref={signatureRef}
            canvasProps={{
              className: 'w-full h-64 border-0',
              style: {
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem'
              }
            }}
            backgroundColor="white"
            penColor="black"
            onBegin={handleBegin}
            onEnd={handleEnd}
          />
        </div>

        {/* Drawing Status */}
        {isDrawing && (
          <div className="text-sm text-blue-600 flex items-center gap-2">
            <div className="animate-pulse w-2 h-2 bg-blue-600 rounded-full"></div>
            Drawing...
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Clear
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={!hasSignature}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>

          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          </div>

          <Button
            onClick={handleSave}
            disabled={!hasSignature}
            className="flex items-center gap-2"
          >
            <PenTool className="h-4 w-4" />
            Save Signature
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
          <p className="font-medium mb-1">Instructions:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Draw your signature in the box above</li>
            <li>Use the Clear button to start over</li>
            <li>Upload an image of your signature if preferred</li>
            <li>Download your signature as a PNG file</li>
            <li>Click Save Signature when finished</li>
          </ul>
        </div>

        {/* Signature Preview */}
        {initialValue && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <Label className="text-sm font-medium mb-2 block">Current Signature:</Label>
            <img 
              src={initialValue} 
              alt="Current signature" 
              className="max-w-full h-32 object-contain border rounded"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SignatureCapture; 