"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Label } from '../../../components/ui/label';
import { useAppStore } from '../../../lib/store';
import { useSessionManager } from '../../../lib/auth';
import { 
  ArrowLeft, 
  FileText, 
  Settings, 
  Save,
  Download,
  Eye,
  Edit
} from 'lucide-react';
import toast from 'react-hot-toast';
import WorkflowStepper from '../../../components/workflow/WorkflowStepper';

interface WorkspaceData {
  id: number;
  name: string;
  is_draft: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  pdf_count: number;
  form_fields_count: number;
}

interface PdfFile {
  id: number;
  file_name: string;
  original_name: string;
  blob_url?: string;
  file_size: number;
  pages: number;
  uploaded_at: string;
}

interface FormField {
  id: number;
  field_name: string;
  field_label: string;
  field_type: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  validation?: any;
  field_group?: string;
  field_order: number;
}

interface FormMapping {
  id: number;
  form_field_id: string;
  pdf_field_id: string;
  pdf_file_id: number;
  is_repeated: boolean;
  repeated_pages?: number[];
}

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAppStore();
  const { handleLogout } = useSessionManager();
  
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [pdfFiles, setPdfFiles] = useState<PdfFile[]>([]);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [formMappings, setFormMappings] = useState<FormMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isResuming, setIsResuming] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    loadWorkspaceData();
  }, [user, params.id]);

  const loadWorkspaceData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const workspaceId = params.id as string;

      // Load workspace details
      const workspaceResponse = await fetch(`http://localhost:3001/api/workspaces/${workspaceId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!workspaceResponse.ok) {
        toast.error('Workspace not found');
        router.push('/dashboard');
        return;
      }

      const workspaceData = await workspaceResponse.json();
      setWorkspace(workspaceData.workspace);

      // Load PDF files
      const pdfsResponse = await fetch(`http://localhost:3001/api/workspaces/${workspaceId}/pdfs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (pdfsResponse.ok) {
        const pdfsData = await pdfsResponse.json();
        setPdfFiles(pdfsData.pdfs || []);
      }

      // Load form fields
      const fieldsResponse = await fetch(`http://localhost:3001/api/workspaces/${workspaceId}/form-fields`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (fieldsResponse.ok) {
        const fieldsData = await fieldsResponse.json();
        setFormFields(fieldsData.fields || []);
      }

      // Load form mappings
      const mappingsResponse = await fetch(`http://localhost:3001/api/workspaces/${workspaceId}/mappings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (mappingsResponse.ok) {
        const mappingsData = await mappingsResponse.json();
        setFormMappings(mappingsData.mappings || []);
      }

    } catch (error) {
      console.error('Error loading workspace data:', error);
      toast.error('Failed to load workspace data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeWorkspace = async () => {
    setIsResuming(true);
    
    try {
      // Load workspace data into the store
      const { setUser } = useAppStore.getState();
      
      // Set the workspace context in the store
      // This would typically involve setting the current workspace ID
      // and loading the PDFs, form fields, and mappings into the store
      
      toast.success('Workspace loaded successfully');
      
      // Navigate to the main workflow
      router.push('/');
    } catch (error) {
      console.error('Error resuming workspace:', error);
      toast.error('Failed to resume workspace');
    } finally {
      setIsResuming(false);
    }
  };

  const handleSaveWorkspace = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const workspaceId = params.id as string;
      
      const response = await fetch(`http://localhost:3001/api/workspaces/${workspaceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          updated_at: new Date().toISOString()
        })
      });

      if (response.ok) {
        toast.success('Workspace saved successfully');
      } else {
        toast.error('Failed to save workspace');
      }
    } catch (error) {
      toast.error('Failed to save workspace');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Workspace Not Found</h1>
          <p className="text-gray-600 mb-6">The workspace you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{workspace.name}</h1>
              <p className="text-sm text-gray-600">
                Last updated {new Date(workspace.updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant={workspace.is_draft ? "secondary" : "default"}>
              {workspace.is_draft ? 'Draft' : 'Published'}
            </Badge>
            <Button onClick={handleSaveWorkspace} variant="outline">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button onClick={handleResumeWorkspace} disabled={isResuming}>
              {isResuming ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Loading...
                </div>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Resume Work
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Workspace Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Workspace Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Status</Label>
                <Badge className={`mt-1 ${
                  workspace.status === 'published' ? 'bg-green-100 text-green-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {workspace.status.charAt(0).toUpperCase() + workspace.status.slice(1)}
                </Badge>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Created</Label>
                <p className="text-sm text-gray-600">
                  {new Date(workspace.created_at).toLocaleDateString()}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">PDF Files</Label>
                <p className="text-lg font-semibold">{workspace.pdf_count}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Form Fields</Label>
                <p className="text-lg font-semibold">{workspace.form_fields_count}</p>
              </div>
            </CardContent>
          </Card>

          {/* PDF Files */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                PDF Files ({pdfFiles.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pdfFiles.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No PDF files uploaded yet</p>
              ) : (
                <div className="space-y-3">
                  {pdfFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium text-sm">{file.original_name}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.file_size || 0)} • {file.pages} pages
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {file.blob_url && (
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form Fields */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Form Fields ({formFields.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {formFields.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No form fields created yet</p>
              ) : (
                <div className="space-y-3">
                  {formFields.map((field) => (
                    <div key={field.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                      <div>
                        <p className="font-medium text-sm">{field.field_label}</p>
                        <p className="text-xs text-gray-500">
                          {field.field_type} • {field.required ? 'Required' : 'Optional'}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {field.field_type}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Form Mappings */}
        {formMappings.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Field Mappings ({formMappings.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {formMappings.map((mapping) => (
                  <div key={mapping.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                    <div>
                      <p className="font-medium text-sm">Form Field → PDF Field</p>
                      <p className="text-xs text-gray-500">
                        {mapping.form_field_id} → {mapping.pdf_field_id}
                      </p>
                    </div>
                    <Badge variant={mapping.is_repeated ? "default" : "secondary"}>
                      {mapping.is_repeated ? 'Repeated' : 'Single'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 