"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Settings, 
  Link, 
  Eye, 
  Download,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Circle,
  Users,
  UserCheck,
  Shield,
  Crown,
  BarChart3,
  Cog,
  LogOut,
  Menu,
  X,
  FileSpreadsheet,
  Save,
  Home,
  User
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useAppStore, useUser, useUserRole, useCurrentStep } from '../../lib/store';
import { WorkflowStep, WORKFLOW_CONFIG, UserRole, PDFFormField } from '../../types';
import { useSessionManager } from '../../lib/auth';

import toast from 'react-hot-toast';
import PdfUploader from '../pdf/PdfUploader';
import dynamic from 'next/dynamic';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogPortal, DialogOverlay } from '../ui/dialog';
const WarnOnNavigate = dynamic(() => import("../common/WarnOnNavigate"), { ssr: false });

const DetectFieldsStep = dynamic(() => import('../detect/DetectFieldsStep'), {
  ssr: false,
  loading: () => <div className="text-center py-8">Loading Detect Fields…</div>,
});

const BuildFormStep = dynamic(() => import('../build/BuildFormStep'), { 
  ssr: false, 
  loading: () => <div className="text-center py-8">Loading Build Form…</div> 
});
const MapFieldsStep = dynamic(() => import('../mapping/MapFieldsStep'), { 
  ssr: false, 
  loading: () => <div className="text-center py-8">Loading Map Fields…</div> 
});

const FormPreview = dynamic(() => import('../preview/FormPreview'), { 
  ssr: false, 
  loading: () => <div className="text-center py-8">Loading Form Preview…</div> 
});

// Dynamic imports for components that use PDF libraries
let FormBuilder: any = null;
let FieldMapper: any = null;
let FormFiller: any = null;
let FormReview: any = null;
let PdfGenerator: any = null;
let AdminDashboard: any = null;
let UserManagement: any = null;
let SystemLogs: any = null;
let SystemSettings: any = null;

const WorkflowStepper: React.FC = () => {
  const { 
    currentStep, 
    totalSteps, 
    nextStep, 
    previousStep, 
    setCurrentStep,
    setUser,
    logout,
    pdfs,
    selectedPdf
  } = useAppStore();
  
  const user = useUser();
  const userRole = useUserRole();
  const { handleLogout } = useSessionManager();
  const [isClient, setIsClient] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [readyFiles, setReadyFiles] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Handle click outside to collapse sidebar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setSidebarExpanded(false);
      }
    };

    if (sidebarExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarExpanded]);

  // Load components dynamically on client side
  useEffect(() => {
    const loadComponents = async () => {
      try {
        const [
          formBuilderModule,
          fieldMapperModule,
          formFillerModule,
          formReviewModule,
          pdfGeneratorModule,
          adminDashboardModule,
          userManagementModule,
          systemLogsModule,
          systemSettingsModule
        ] = await Promise.all([
          import('../form/FormBuilder'),
          import('../mapping/FieldMapper'),
          import('../form/FormFiller'),
          import('../form/FormReview'),
          import('../generator/PdfGenerator'),
          import('../admin/AdminDashboard'),
          import('../admin/UserManagement'),
          import('../admin/SystemLogs'),
          import('../admin/SystemSettings')
        ]);

        FormBuilder = formBuilderModule.default;
        FieldMapper = fieldMapperModule.default;
        FormFiller = formFillerModule.default;
        FormReview = formReviewModule.default;
        PdfGenerator = pdfGeneratorModule.default;
        AdminDashboard = adminDashboardModule.default;
        UserManagement = userManagementModule.default;
        SystemLogs = systemLogsModule.default;
        SystemSettings = systemSettingsModule.default;

        setIsClient(true);
      } catch (error) {
        console.error('Failed to load components:', error);
      }
    };

    loadComponents();
  }, []);

  // If no user is logged in, redirect to login
  if (!user || !userRole) {
    // Check if we have a token but no user state (page refresh)
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        const user = {
          id: tokenPayload.sub || '1',
          email: tokenPayload.email,
          role: tokenPayload.role,
          status: tokenPayload.status || 'active',
          createdAt: new Date(),
        };
        setUser(user);
        return null; // Will re-render with user
      } catch (error) {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
        return null;
      }
    } else {
      window.location.href = '/login';
      return null;
    }
  }

  // Show loading while components are being loaded
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  const workflowConfig = WORKFLOW_CONFIG[userRole];
  const currentStepConfig = workflowConfig.steps[currentStep];

  const getStepStatus = (step: number) => {
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'current';
    return 'upcoming';
  };

  const handleStepClick = (step: number) => {
    if (step <= currentStep) {
      setCurrentStep(step);
    }
  };

  const getCurrentComponent = () => {
    if (!isClient) return null;

    switch (userRole) {
      case 'client':
        return getClientComponent(currentStep);
      case 'admin':
        return getAdminComponent(currentStep);
      case 'owner':
        return getOwnerComponent(currentStep);
      default:
        return null;
    }
  };

  const getClientComponent = (step: number) => {
    switch (step) {
      case 0: return FormFiller;
      case 1: return FormReview;
      case 2: return PdfGenerator;
      default: return null;
    }
  };

  const getAdminComponent = (step: number) => {
    switch (step) {
      case 0: return null; // PdfUploader is rendered separately
      case 1: return DetectFieldsStep;
      case 2: return BuildFormStep;
      case 3: return MapFieldsStep;
      case 4: return FormPreview;
      case 5: return PdfGenerator;
      default: return null;
    }
  };

  const getOwnerComponent = (step: number) => {
    switch (step) {
      case 0: return AdminDashboard;
      case 1: return UserManagement;
      case 2: return SystemLogs;
      case 3: return SystemSettings;
      default: return null;
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'client': return <UserCheck className="h-3 w-3" />;
      case 'admin': return <Shield className="h-3 w-3" />;
      case 'owner': return <Crown className="h-3 w-3" />;
      default: return <User className="h-3 w-3" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'client': return 'bg-blue-100 text-blue-800';
      case 'admin': return 'bg-green-100 text-green-800';
      case 'owner': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStepIcon = (stepTitle: string) => {
    switch (stepTitle) {
      case 'Upload PDF':
        return <Upload className="h-4 w-4" />;
      case 'Detect Fields':
        return <FileText className="h-4 w-4" />;
      case 'Build Form':
        return <Settings className="h-4 w-4" />;
      case 'Map Fields':
        return <Link className="h-4 w-4" />;
      case 'Preview & Test':
        return <Eye className="h-4 w-4" />;
      case 'Publish Form':
        return <Download className="h-4 w-4" />;
      case 'Dashboard':
        return <BarChart3 className="h-4 w-4" />;
      case 'User Management':
        return <Users className="h-4 w-4" />;
      case 'System Logs':
        return <Cog className="h-4 w-4" />;
      case 'System Settings':
        return <Settings className="h-4 w-4" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  const CurrentComponent = getCurrentComponent();

  const isDetectFieldsStep = userRole === 'admin' && currentStep === 1;
  const currentPdf = selectedPdf || pdfs[0];
  const detectStepHasFields = currentPdf ? currentPdf.formFields.length>0 : false;
  const hasUploadedDocuments = pdfs.length > 0;
  const hasSelectedFiles = readyFiles.length > 0;
  const hasAnyFiles = hasUploadedDocuments || hasSelectedFiles;
  const disableNext = (currentStep === 0 && !hasAnyFiles) || (isDetectFieldsStep && !detectStepHasFields);

  const handleNextStep = () => {
    if (currentStep === 0) {
      if (!hasAnyFiles) {
        toast.error('Please add at least one document before proceeding.');
        return;
      }
      
      // If there are files to upload, trigger upload
      if (hasSelectedFiles) {
        setIsUploading(true);
        return;
      }
      
      // If there are no files to upload but there are uploaded documents, just proceed
      if (hasUploadedDocuments) {
        nextStep();
        return;
      }
      
      return;
    }
    
    if (isDetectFieldsStep && !detectStepHasFields) {
      toast.error('Please detect or add fields before proceeding.');
      return;
    }
    
    // Proceed with normal next step
    nextStep();
  };

  const handleSave = () => {
    // Save current state and progress
    const currentState = {
      currentStep,
      pdfs,
      selectedPdf,
      user,
      userRole,
      timestamp: new Date().toISOString()
    };
    
    // Save to localStorage for persistence
    localStorage.setItem('pdfFormAutomation_state', JSON.stringify(currentState));
    toast.success('Progress saved successfully!');
  };

  const handleSaveAndExit = () => {
    // Save current state
    handleSave();
    
    // Exit to main dashboard (reset to step 0)
    setCurrentStep(0);
    toast.success('Progress saved and returned to dashboard!');
  };

  return (
    <>
      <WarnOnNavigate />
      <div className="h-screen flex overflow-hidden">
        {/* Collapsible Sidebar */}
        <div 
          ref={sidebarRef}
          className={`${sidebarExpanded ? 'w-64' : 'w-16'} flex-shrink-0 bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col`}
        >
          {/* Header */}
          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {sidebarExpanded ? (
                <>
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                    <h1 className="text-sm font-bold text-gray-900 truncate">PDF Form Automation</h1>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarExpanded(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarExpanded(true)}
                  className="h-6 w-6 p-0 mx-auto"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {sidebarExpanded ? (
              <div className="mt-2 flex items-center gap-2">
                <Badge className={`${getRoleColor(userRole)} text-xs`}>
                  {getRoleIcon(userRole)}
                  <span className="ml-1 capitalize">{userRole}</span>
                </Badge>
              </div>
            ) : (
              <div className="mt-2 flex justify-center">
                <div className={`${getRoleColor(userRole)} text-xs p-1 rounded`}>
                  {getRoleIcon(userRole)}
                </div>
              </div>
            )}
          </div>

          {/* Workflow Steps */}
          <div className="flex-1 p-2">
            <div className="space-y-1">
              {workflowConfig.steps.map((step, index) => {
                const status = getStepStatus(index);
                const StepIcon = getStepIcon(step.title);
                
                return (
                  <div
                    key={step.id}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left text-sm ${
                      status === 'completed' 
                        ? 'bg-green-100 text-green-700' 
                        : status === 'current'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-400'
                    } ${sidebarExpanded ? 'justify-start' : 'justify-center'}`}
                    title={sidebarExpanded ? undefined : step.title}
                  >
                    <div className={`flex-shrink-0 flex items-center justify-center ${sidebarExpanded ? 'w-6 h-6' : 'w-6 h-6'}`}>
                      {StepIcon}
                    </div>
                    {sidebarExpanded && (
                      <span className="font-medium truncate">{step.title}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

                            {/* Profile and Logout Buttons */}
                  <div className="p-2 border-t border-gray-200 space-y-2">
                    <Button
                      variant="outline"
                      onClick={() => window.location.href = '/profile'}
                      className="w-full flex items-center gap-2 text-sm"
                      title={sidebarExpanded ? undefined : "Profile"}
                    >
                      <User className="h-4 w-4" />
                      {sidebarExpanded && <span>Profile</span>}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 text-sm"
                      title={sidebarExpanded ? undefined : "Logout"}
                    >
                      <LogOut className="h-4 w-4" />
                      {sidebarExpanded && <span>Logout</span>}
                    </Button>
                  </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Navigation */}
          <div className="flex items-center justify-between py-2 border-b border-gray-200 bg-white px-4">
            {/* Left side - Previous button */}
            <Button
              onClick={previousStep}
              disabled={currentStep === 0}
              variant="outline"
              className="flex items-center gap-2 text-sm bg-red-50 hover:bg-red-100 text-red-700 border-red-200 hover:border-red-300"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>

            {/* Center - Current stage */}
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-900">
                {currentStepConfig.title}
              </span>
            </div>

            {/* Right side - Next and Save & Exit buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleSaveAndExit}
                className="flex items-center gap-2 text-sm bg-purple-600 hover:bg-purple-700 text-white border-purple-600 hover:border-purple-700"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Save & Exit</span>
              </Button>

              <Button
                onClick={handleNextStep}
                disabled={currentStep === totalSteps - 1 || disableNext}
                className="flex items-center gap-2 text-sm bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Current Step Content */}
          <div className="flex-1 overflow-hidden bg-gray-50">
            <div className="h-full p-4">
              <Card className="h-full flex flex-col">
                {/* Hide header for steps where we omit title/subtitle */}
                {!( ['Upload PDF','Detect Fields','Build Form','Map Fields','Preview & Test','Publish Form'].includes(currentStepConfig.title) ) && (
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      {currentStepConfig.title}
                    </CardTitle>
                    <p className="text-gray-600">{currentStepConfig.description}</p>
                  </CardHeader>
                )}
                <CardContent className={`${['Upload PDF','Detect Fields','Build Form','Map Fields','Preview & Test','Publish Form'].includes(currentStepConfig.title)?'pt-6':'pt-0'} flex-1 overflow-auto`}>
                  {userRole === 'admin' && currentStep === 0 ? (
                    <PdfUploader 
                      onFilesReady={setReadyFiles}
                      onUploadComplete={() => {
                        setIsUploading(false);
                        nextStep();
                      }}
                      triggerUpload={isUploading}
                    />
                  ) : CurrentComponent ? (
                    <CurrentComponent />
                  ) : (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading component...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Role Selection Component
const RoleSelection: React.FC<{ onRoleSelect: (role: UserRole) => void }> = ({ onRoleSelect }) => {
  const [notification, setNotification] = useState<string | null>(null);

  // Hide notification after 2 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleButtonClick = (role: UserRole, buttonText: string) => {
    if (role === 'admin') {
      onRoleSelect('admin');
    } else {
      setNotification(buttonText);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6 relative">
      {/* Notification */}
      {notification && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-black bg-opacity-80 text-white px-8 py-4 rounded-xl shadow-lg text-2xl font-semibold animate-fade-in-out">
            {notification}
          </div>
        </div>
      )}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">PDF Form Automation</h1>
        <p className="text-lg text-gray-600">Select your role to get started</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
        {/* Client Role */}
        <Card className="shadow border-2 border-transparent">
          <CardHeader className="flex flex-col items-center pt-8 pb-4">
            <UserCheck className="h-14 w-14 text-blue-500 mb-2" />
            <CardTitle className="text-xl font-bold">Client</CardTitle>
            <Badge className="mt-2 bg-blue-100 text-blue-800 pointer-events-none select-none">End User</Badge>
          </CardHeader>
          <CardContent className="text-center pb-8">
            <p className="text-gray-600 mb-6">Fill out forms and submit your information. Simple and straightforward process.</p>
            <div className="flex flex-col gap-3 items-center mb-6">
              <div className="flex items-center gap-2 text-base">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Fill web-based forms
              </div>
              <div className="flex items-center gap-2 text-base">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Review your data
              </div>
              <div className="flex items-center gap-2 text-base">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Submit completed forms
              </div>
            </div>
            <button
              className="w-full py-2 rounded-lg font-semibold text-white bg-blue-500 hover:bg-blue-600 transition-colors text-lg shadow"
              type="button"
              onClick={() => handleButtonClick('client', 'Begin!')}
            >
              Begin!
            </button>
          </CardContent>
        </Card>
        {/* Admin Role */}
        <Card className="shadow border-2 border-transparent">
          <CardHeader className="flex flex-col items-center pt-8 pb-4">
            <Shield className="h-14 w-14 text-green-500 mb-2" />
            <CardTitle className="text-xl font-bold">Admin</CardTitle>
            <Badge className="mt-2 bg-green-100 text-green-800 pointer-events-none select-none">Form Builder</Badge>
          </CardHeader>
          <CardContent className="text-center pb-8">
            <p className="text-gray-600 mb-6">Upload PDFs, build forms, and manage the entire form creation process.</p>
            <div className="flex flex-col gap-3 items-center mb-6">
              <div className="flex items-center gap-2 text-base">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Upload and process PDFs
              </div>
              <div className="flex items-center gap-2 text-base">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Build custom forms
              </div>
              <div className="flex items-center gap-2 text-base">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Manage form publishing
              </div>
            </div>
            <button
              className="w-full py-2 rounded-lg font-semibold text-white bg-green-500 hover:bg-green-600 transition-colors text-lg shadow"
              type="button"
              onClick={() => handleButtonClick('admin', `Let's Go!`)}
            >
              Let's Go!
            </button>
          </CardContent>
        </Card>
        {/* Owner Role */}
        <Card className="shadow border-2 border-transparent">
          <CardHeader className="flex flex-col items-center pt-8 pb-4">
            <Crown className="h-14 w-14 text-purple-500 mb-2" />
            <CardTitle className="text-xl font-bold">Owner</CardTitle>
            <Badge className="mt-2 bg-purple-100 text-purple-800 pointer-events-none select-none">System Manager</Badge>
          </CardHeader>
          <CardContent className="text-center pb-8">
            <p className="text-gray-600 mb-6">Manage the entire system, create admin users, and monitor all activities.</p>
            <div className="flex flex-col gap-3 items-center mb-6">
              <div className="flex items-center gap-2 text-base">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Create admin users
              </div>
              <div className="flex items-center gap-2 text-base">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Monitor system logs
              </div>
              <div className="flex items-center gap-2 text-base">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Configure system settings
              </div>
            </div>
            <button
              className="w-full py-2 rounded-lg font-semibold text-white bg-purple-500 hover:bg-purple-600 transition-colors text-lg shadow"
              type="button"
              onClick={() => handleButtonClick('owner', 'Go!')}
            >
              Go!
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorkflowStepper; 