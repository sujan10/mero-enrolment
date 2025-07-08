import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useAppStore } from '../../lib/store';

const FormReview: React.FC = () => {
  const { formFields } = useAppStore();
  // For demo, group all fields into one section; in real use, use field groups from mapping
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const saved = localStorage.getItem('formFillerProgress');
    return saved ? JSON.parse(saved) : {};
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(true);

  const validateField = (field: any, value: any): string => {
    if (field.required && !value) return 'This field is required.';
    if (field.type === 'email' && value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) return 'Invalid email.';
    if (field.type === 'date' && value && isNaN(Date.parse(value))) return 'Invalid date.';
    return '';
  };

  const handleChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    const field = formFields.find(f => f.id === fieldId);
    if (field) {
      setErrors(prev => ({ ...prev, [fieldId]: validateField(field, value) }));
    }
    localStorage.setItem('formFillerProgress', JSON.stringify({ ...formData, [fieldId]: value }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader onClick={() => setOpen(o => !o)} className="cursor-pointer flex items-center justify-between">
          <CardTitle>Review Your Data</CardTitle>
          {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </CardHeader>
        {open && (
          <CardContent>
            <div className="space-y-4">
              {formFields.map(field => (
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
        )}
      </Card>
      <div className="text-center text-gray-500 text-sm">
        <p>You can edit any field above. Changes are saved automatically.</p>
        <p>No download option is available for end users.</p>
      </div>
    </div>
  );
};

export default FormReview; 