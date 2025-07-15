"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { useAppStore, useUser } from '../../lib/store';
import { useSessionManager } from '../../lib/auth';
import { 
  User, 
  FileText, 
  Settings, 
  Edit, 
  Save, 
  X, 
  Download,
  Trash2,
  Plus,
  FolderOpen,
  Calendar,
  HardDrive
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Workspace {
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
  workspace_id: number;
}

export default function ProfilePage() {
  const user = useUser();
  const { handleLogout } = useSessionManager();
  const router = useRouter();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [name, setName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [pdfFiles, setPdfFiles] = useState<PdfFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    // Initialize name from user data
    setName(user.name || user.email.split('@')[0] || '');
    
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }

      // Load workspaces
      const workspacesResponse = await fetch(`http://localhost:3001/api/workspaces`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (workspacesResponse.ok) {
        const workspacesData = await workspacesResponse.json();
        setWorkspaces(workspacesData.workspaces || []);
      }

      // Load PDF files
      const pdfsResponse = await fetch(`http://localhost:3001/api/pdfs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (pdfsResponse.ok) {
        const pdfsData = await pdfsResponse.json();
        setPdfFiles(pdfsData.pdfs || []);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:3001/api/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        const updatedUser = { ...user, name };
        const { setUser } = useAppStore.getState();
        setUser(updatedUser);
        toast.success('Profile updated successfully');
        setIsEditing(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setIsSaving(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:3001/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword }),
      });

      if (response.ok) {
        toast.success('Password updated successfully');
        setNewPassword('');
        setConfirmPassword('');
        setIsEditingPassword(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update password');
      }
    } catch (error) {
      toast.error('Failed to update password');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResumeWorkspace = (workspaceId: number) => {
    // In a real app, this would load the workspace state
    toast.success(`Resuming workspace ${workspaceId}`);
    router.push(`/workspace/${workspaceId}`);
  };

  const handleDeleteWorkspace = async (workspaceId: number) => {
    if (!confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3001/api/workspaces/${workspaceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Workspace deleted successfully');
        loadUserData(); // Reload data
      } else {
        toast.error('Failed to delete workspace');
      }
    } catch (error) {
      toast.error('Failed to delete workspace');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Email</Label>
                <p className="text-lg font-semibold">{user.email}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Name</Label>
                {!isEditing ? (
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold">{name || 'Not set'}</p>
                    <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleProfileUpdate} className="space-y-3">
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      required
                    />
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setIsEditing(false);
                          setName(user.name || user.email.split('@')[0] || '');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Role</Label>
                <Badge className={`mt-1 ${
                  user.role === 'admin' ? 'bg-green-100 text-green-800' :
                  user.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </Badge>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Status</Label>
                <Badge className={`mt-1 ${
                  user.status === 'active' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                </Badge>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Member Since</Label>
                <p className="text-sm text-gray-600">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isEditingPassword ? (
                <Button onClick={() => setIsEditingPassword(true)} variant="outline" className="w-full">
                  <Edit className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              ) : (
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={isSaving}>
                      {isSaving ? 'Saving...' : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </>
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setIsEditingPassword(false);
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Workspaces</span>
                <span className="font-semibold">{workspaces.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">PDF Files</span>
                <span className="font-semibold">{pdfFiles.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Storage</span>
                <span className="font-semibold">
                  {formatFileSize(pdfFiles.reduce((acc, file) => acc + (file.file_size || 0), 0))}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Workspaces */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Your Workspaces
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading workspaces...</p>
              </div>
            ) : workspaces.length === 0 ? (
              <div className="text-center py-8">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No workspaces yet</p>
                <Button onClick={() => router.push('/dashboard')} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Workspace
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workspaces.map((workspace) => (
                  <Card key={workspace.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-lg">{workspace.name}</h3>
                        <Badge variant={workspace.is_draft ? "secondary" : "default"}>
                          {workspace.is_draft ? 'Draft' : 'Published'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {workspace.pdf_count} PDF files
                        </div>
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          {workspace.form_fields_count} form fields
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Updated {new Date(workspace.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleResumeWorkspace(workspace.id)}
                          className="flex-1"
                        >
                          Resume
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteWorkspace(workspace.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* PDF Files */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Uploaded PDF Files
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading PDF files...</p>
              </div>
            ) : pdfFiles.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No PDF files uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pdfFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">{file.original_name}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(file.file_size || 0)} • {file.pages} pages
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {file.blob_url && (
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 