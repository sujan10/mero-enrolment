"use client";

import React, { useState } from 'react';
import { Plus, Trash2, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { useAppStore } from '../../lib/store';
import { FormField, FormFieldType } from '../../types';
import toast from 'react-hot-toast';
import { Badge } from '../ui/badge';

const FormBuilder: React.FC = () => {
  const { formFields, addFormField, updateFormField, removeFormField } = useAppStore();
  const [newField, setNewField] = useState<Partial<FormField>>({
    name: '',
    label: '',
    type: 'text',
    required: false,
    placeholder: ''
  });

  const fieldTypes: { value: FormFieldType; label: string }[] = [
    { value: 'text', label: 'Text Input' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'email', label: 'Email' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Dropdown' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'radio', label: 'Radio Buttons' },
    { value: 'signature', label: 'Signature' }
  ];

  const handleAddField = () => {
    if (!newField.name || !newField.label) {
      toast.error('Please fill in both name and label');
      return;
    }

    const field: FormField = {
      id: Math.random().toString(36).substr(2, 9),
      name: newField.name,
      label: newField.label,
      type: newField.type || 'text',
      required: newField.required || false,
      placeholder: newField.placeholder || '',
      options: newField.type === 'select' || newField.type === 'radio' ? ['Option 1'] : undefined,
      validation: newField.validation || {}
    };

    addFormField(field);
    setNewField({
      name: '',
      label: '',
      type: 'text',
      required: false,
      placeholder: ''
    });
    toast.success('Field added successfully');
  };

  const handleRemoveField = (fieldId: string) => {
    removeFormField(fieldId);
    toast.success('Field removed');
  };

  const handleFieldUpdate = (fieldId: string, updates: Partial<FormField>) => {
    updateFormField(fieldId, updates);
  };

  const renderFieldPreview = (field: FormField) => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <Input
            placeholder={field.placeholder}
            disabled
            className="bg-gray-50"
          />
        );
      case 'textarea':
        return (
          <textarea
            placeholder={field.placeholder}
            disabled
            className="w-full p-2 border rounded-md bg-gray-50 resize-none"
            rows={3}
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            disabled
            className="bg-gray-50"
          />
        );
      case 'select':
        return (
          <Select disabled>
            <SelectTrigger className="bg-gray-50">
              <SelectValue placeholder="Select an option" />
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
            <Checkbox disabled />
            <Label className="text-sm text-gray-500">Checkbox option</Label>
          </div>
        );
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input type="radio" disabled className="text-blue-600" />
                <Label className="text-sm text-gray-500">{option}</Label>
              </div>
            ))}
          </div>
        );
      case 'signature':
        return (
          <div className="w-full h-20 border-2 border-dashed border-gray-300 rounded-md bg-gray-50 flex items-center justify-center">
            <span className="text-gray-500 text-sm">Signature area</span>
          </div>
        );
      default:
        return <Input disabled className="bg-gray-50" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Add New Field */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Field
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fieldName">Field Name</Label>
              <Input
                id="fieldName"
                value={newField.name}
                onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                placeholder="e.g., firstName"
              />
            </div>
            <div>
              <Label htmlFor="fieldLabel">Display Label</Label>
              <Input
                id="fieldLabel"
                value={newField.label}
                onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                placeholder="e.g., First Name"
              />
            </div>
            <div>
              <Label htmlFor="fieldType">Field Type</Label>
              <Select
                value={newField.type}
                onValueChange={(value: FormFieldType) => setNewField({ ...newField, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fieldTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="fieldPlaceholder">Placeholder</Label>
              <Input
                id="fieldPlaceholder"
                value={newField.placeholder}
                onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
                placeholder="Optional placeholder text"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="fieldRequired"
                checked={newField.required}
                onCheckedChange={(checked) => setNewField({ ...newField, required: !!checked })}
              />
              <Label htmlFor="fieldRequired">Required field</Label>
            </div>
          </div>
          <Button onClick={handleAddField} className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Add Field
          </Button>
        </CardContent>
      </Card>

      {/* Form Fields List */}
      {formFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Form Fields ({formFields.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {formFields.map((field) => (
                <div key={field.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{field.label}</h3>
                        {field.required && (
                          <span className="text-red-500 text-sm">*</span>
                        )}
                        <Badge variant="secondary">{field.type}</Badge>
                      </div>
                      <p className="text-sm text-gray-500">Name: {field.name}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveField(field.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    {renderFieldPreview(field)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {formFields.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No form fields added yet. Start by adding your first field above.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FormBuilder; 