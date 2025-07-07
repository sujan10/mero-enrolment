"use client";

import React from 'react';
import { Link, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useAppStore } from '../../lib/store';

const FieldMapper: React.FC = () => {
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
        <Link className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">No form fields created yet. Please build your form first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Field Mapping
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pdfs.map((pdf) => (
              <div key={pdf.id} className="border rounded-lg p-4">
                <h3 className="font-medium mb-3">{pdf.name}</h3>
                <div className="space-y-2">
                  {pdf.formFields.map((field) => (
                    <div key={field.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{field.name}</p>
                        <p className="text-sm text-gray-500">Type: {field.type}</p>
                      </div>
                      <Badge variant="secondary">PDF Field</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Form Fields</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {formFields.map((field) => (
              <div key={field.id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                <div>
                  <p className="font-medium">{field.label}</p>
                  <p className="text-sm text-gray-500">Name: {field.name}</p>
                </div>
                <Badge variant="outline">Form Field</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-gray-500">
        <p>Field mapping functionality will be implemented in the next iteration.</p>
        <p className="text-sm mt-2">This will allow you to connect form fields to PDF fields.</p>
      </div>
    </div>
  );
};

export default FieldMapper; 