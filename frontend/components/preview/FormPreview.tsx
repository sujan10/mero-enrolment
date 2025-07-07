"use client";

import React, { useState } from 'react';
import { Eye, Download, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { useAppStore } from '../../lib/store';
import { FormField } from '../../types';
import toast from 'react-hot-toast';

const FormPreview: React.FC = () => {
  const { formFields, fieldMappings } = useAppStore();
  const [formData, setFormData] = useState<Record<string, any>>({});

  if (formFields.length === 0) {
    return (
      <div className="text-center py-8">
        <Eye className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">No form fields created yet. Please build your form first.</p>
      </div>
    );
  }

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const missingFields = formFields
      .filter(field => field.required && !formData[field.id])
      .map(field => field.label);

    if (missingFields.length > 0) {
      toast.error(`Please fill in required fields: ${missingFields.join(', ')}`);
      return;
    }

    toast.success('Form submitted successfully!');
    console.log('Form data:', formData);
  };

  const renderField = (field: FormField) => {
    const value = formData[field.id] || '';

    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <Input
            type={field.type}
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        );
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="w-full p-2 border rounded-md resize-none"
            rows={3}
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
          />
        );
      case 'select':
        return (
          <Select value={value} onValueChange={(val) => handleInputChange(field.id, val)}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={value}
              onCheckedChange={(checked) => handleInputChange(field.id, checked)}
              required={field.required}
            />
            <Label className="text-sm">{field.placeholder || 'Check this option'}</Label>
          </div>
        );
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  required={field.required}
                  className="text-blue-600"
                />
                <Label className="text-sm">{option}</Label>
              </div>
            ))}
          </div>
        );
      case 'signature':
        return (
          <div className="w-full h-20 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
            <span className="text-gray-500 text-sm">
              {value ? 'Signature captured' : 'Click to sign'}
            </span>
          </div>
        );
      default:
        return <Input value={value} onChange={(e) => handleInputChange(field.id, e.target.value)} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Form Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Form Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formFields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id} className="flex items-center gap-2">
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </Label>
                {renderField(field)}
              </div>
            ))}
            
            <Button type="submit" className="w-full">
              <CheckCircle className="h-4 w-4 mr-2" />
              Submit Form
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Form Data Display */}
      {Object.keys(formData).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Form Data</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-auto">
              {JSON.stringify(formData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Field Mappings Info */}
      {fieldMappings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Field Mappings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              {fieldMappings.length} field mappings configured
            </p>
            <div className="space-y-2">
              {fieldMappings.map((mapping) => (
                <div key={mapping.id} className="text-sm text-gray-500">
                  Form field → PDF field mapping
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-center text-gray-500">
        <p>PDF generation functionality will be implemented in the next iteration.</p>
        <p className="text-sm mt-2">This will allow you to generate filled PDFs from your form data.</p>
      </div>
    </div>
  );
};

export default FormPreview; 