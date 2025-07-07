"use client";

import React from 'react';
import { Download, FileText, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useAppStore } from '../../lib/store';

const PdfGenerator: React.FC = () => {
  const { pdfs, formFields, fieldMappings } = useAppStore();

  if (pdfs.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">No PDFs uploaded yet. Please upload PDFs first.</p>
      </div>
    );
  }

  if (formFields.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">No form fields created yet. Please build your form first.</p>
      </div>
    );
  }

  if (fieldMappings.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">No field mappings configured yet. Please map your form fields to PDF fields first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Generation Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            PDF Generation Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold text-blue-600">{pdfs.length}</p>
              <p className="text-sm text-gray-600">PDF Documents</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold text-green-600">{formFields.length}</p>
              <p className="text-sm text-gray-600">Form Fields</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Download className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold text-purple-600">{fieldMappings.length}</p>
              <p className="text-sm text-gray-600">Field Mappings</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PDF List */}
      <Card>
        <CardHeader>
          <CardTitle>PDFs to Generate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pdfs.map((pdf) => (
              <div key={pdf.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">{pdf.name}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{pdf.pages.length} pages</span>
                      <span>{pdf.formFields.length} form fields</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Ready</Badge>
                  <Button variant="outline" size="sm" disabled>
                    <Download className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Generation Options */}
      <Card>
        <CardHeader>
          <CardTitle>Generation Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Include form data</p>
                <p className="text-sm text-gray-500">Fill PDF fields with form data</p>
              </div>
              <Badge variant="secondary">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Generate multiple PDFs</p>
                <p className="text-sm text-gray-500">Create separate PDF for each uploaded document</p>
              </div>
              <Badge variant="secondary">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Download as ZIP</p>
                <p className="text-sm text-gray-500">Bundle all generated PDFs in a ZIP file</p>
              </div>
              <Badge variant="outline">Optional</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Button className="flex-1" disabled>
              <Download className="h-4 w-4 mr-2" />
              Generate All PDFs
            </Button>
            <Button variant="outline" disabled>
              <FileText className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-gray-500">
        <p>PDF generation functionality will be implemented in the next iteration.</p>
        <p className="text-sm mt-2">This will use pdf-lib to fill PDF forms with your form data.</p>
      </div>
    </div>
  );
};

export default PdfGenerator; 