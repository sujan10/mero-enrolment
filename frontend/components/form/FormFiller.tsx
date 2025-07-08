import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useAppStore } from '../../lib/store';

interface Section {
  id: string;
  name: string;
  fields: any[];
  repeatable?: boolean;
}

const LOCAL_STORAGE_KEY = 'formFillerProgress';

const FormFiller: React.FC = () => {
  const { formFields } = useAppStore();
  // For demo, group all fields into one section; in real use, use field groups from mapping
  const [sections, setSections] = useState<Section[]>([
    {
      id: 'main',
      name: 'Main Section',
      fields: formFields,
      repeatable: false
    }
  ]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load saved progress
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      setFormData(JSON.parse(saved));
    }
  }, []);

  // Save progress
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const validateField = (field: any, value: any): string => {
    if (field.required && !value) return 'This field is required.';
    if (field.type === 'email' && value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) return 'Invalid email.';
    if (field.type === 'date' && value && isNaN(Date.parse(value))) return 'Invalid date.';
    // Add more validation as needed
    return '';
  };

  const handleChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    const field = formFields.find(f => f.id === fieldId);
    if (field) {
      setErrors(prev => ({ ...prev, [fieldId]: validateField(field, value) }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate all fields
    const newErrors: Record<string, string> = {};
    formFields.forEach(field => {
      const err = validateField(field, formData[field.id]);
      if (err) newErrors[field.id] = err;
    });
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      alert('Form submitted!');
      // Clear progress
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {sections.map(section => (
        <Card key={section.id}>
          <CardHeader>
            <CardTitle>{section.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {section.fields.map(field => (
                <div key={field.id} className="space-y-1">
                  <Label htmlFor={field.id}>
                    {field.label} {field.required && <Badge variant="destructive">Required</Badge>}
                  </Label>
                  <Input
                    id={field.id}
                    type={field.type === 'date' ? 'date' : field.type === 'email' ? 'email' : 'text'}
                    value={formData[field.id] || ''}
                    onChange={e => handleChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                  />
                  {errors[field.id] && <div className="text-red-500 text-xs">{errors[field.id]}</div>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
      <div className="flex gap-4">
        <Button type="submit">Submit</Button>
        <Button type="button" variant="outline" onClick={() => localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formData))}>
          Save Progress
        </Button>
        <Button type="button" variant="ghost" onClick={() => { setFormData({}); setErrors({}); localStorage.removeItem(LOCAL_STORAGE_KEY); }}>
          Clear
        </Button>
      </div>
    </form>
  );
};

export default FormFiller; 