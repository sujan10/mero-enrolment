"use client";

import React, { useState, useEffect } from 'react';
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
  AlertCircle,
  Users,
  UserCheck,
  Shield,
  Crown,
  BarChart3,
  Cog,
  LogOut
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useAppStore, useUser, useUserRole, useCurrentStep } from '../../lib/store';
import { WorkflowStep, WORKFLOW_CONFIG, UserRole } from '../../types';
import PdfUploader from '../pdf/PdfUploader';
import dynamic from 'next/dynamic';
const WarnOnNavigate = dynamic(() => import("../common/WarnOnNavigate"), { ssr: false });

const DetectFieldsStep = dynamic(() => import('../detect/DetectFieldsStep'), {
  ssr: false,
  loading: () => <div className="text-center py-8">Loading Detect Fields…</div>,
});

const BuildFormStep = dynamic(()=>import('../build/BuildFormStep'),{ ssr:false, loading:()=> <div className="text-center py-8">Loading Build Form…</div> });
const MapFieldsStep = dynamic(()=>import('../mapping/MapFieldsStep'),{ ssr:false, loading:()=> <div className="text-center py-8">Loading Map Fields…</div> });

// Dynamic imports for components that use PDF libraries
let FormBuilder: any = null;
let FieldMapper: any = null;
let FormPreview: any = null;
let PdfGenerator: any = null;
let FormFiller: any = null;
let FormReview: any = null;
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
  const [isClient, setIsClient] = useState(false);

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

  // If no user is logged in, show login/role selection
  if (!user || !userRole) {
    return <RoleSelection onRoleSelect={(role) => setUser({ id: '1', email: 'demo@example.com', role, status: 'active', createdAt: new Date() })} />;
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
      case WorkflowStep.CLIENT_FILL_FORM:
        return FormFiller;
      case WorkflowStep.CLIENT_REVIEW_DATA:
        return FormReview;
      case WorkflowStep.CLIENT_SUBMIT:
        return <div className="text-center py-8">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
          <h3 className="text-lg font-medium mb-2">Form Submitted Successfully!</h3>
          <p className="text-gray-600">Your form has been submitted and is being processed.</p>
        </div>;
      default:
        return null;
    }
  };

  const getAdminComponent = (step: number) => {
    switch (step) {
      case 0: return PdfUploader;
      case 1: return DetectFieldsStep;
      case 2: return MapFieldsStep;
      case 3: return BuildFormStep;
      default: return null;
    }
  };

  const getOwnerComponent = (step: number) => {
    switch (step) {
      case WorkflowStep.OWNER_DASHBOARD:
        return AdminDashboard;
      case WorkflowStep.OWNER_MANAGE_ADMINS:
        return UserManagement;
      case WorkflowStep.OWNER_MONITOR_LOGS:
        return SystemLogs;
      case WorkflowStep.OWNER_SYSTEM_SETTINGS:
        return SystemSettings;
      default:
        return null;
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'client':
        return <UserCheck className="h-5 w-5" />;
      case 'admin':
        return <Shield className="h-5 w-5" />;
      case 'owner':
        return <Crown className="h-5 w-5" />;
      default:
        return <Users className="h-5 w-5" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'client':
        return 'bg-blue-100 text-blue-800';
      case 'admin':
        return 'bg-green-100 text-green-800';
      case 'owner':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Determine section title for workflow card
  const roleTitle = userRole === 'client' ? 'Form Filling' : userRole === 'admin' ? '' : 'System Management';

  const CurrentComponent = getCurrentComponent();

  const isDetectFieldsStep = userRole === 'admin' && currentStep === 1;
  const currentPdf = selectedPdf || pdfs[0];
  const detectStepHasFields = currentPdf ? currentPdf.formFields.length>0 : false;
  const disableNext = isDetectFieldsStep && !detectStepHasFields;

  return (
    <>
      <WarnOnNavigate />
      <div className="max-w-7xl mx-auto p-6">
        {/* Header with user info and logout */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">PDF Form Automation</h1>
            <Badge className={getRoleColor(userRole)}>
              {getRoleIcon(userRole)}
              <span className="ml-1 capitalize">{userRole}</span>
            </Badge>
          </div>
          <Button variant="outline" onClick={logout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Workflow Steps */}
        <Card className="mb-6">
          {roleTitle && (
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getRoleIcon(userRole)}
                {roleTitle}
              </CardTitle>
            </CardHeader>
          )}
          <CardContent className={`${!roleTitle ? 'py-4' : ''}`}>
            <div className="flex items-center justify-between">
              {workflowConfig.steps.map((step, index) => {
                const status = getStepStatus(index);
                const Icon = step.id === currentStep ? CheckCircle : Circle;
                
                return (
                  <div key={step.id} className="flex items-center">
                    <button
                      type="button"
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors pointer-events-none ${
                        status === 'completed' 
                          ? 'bg-green-100 text-green-700' 
                          : status === 'current'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{step.title}</span>
                    </button>
                    {index < workflowConfig.steps.length - 1 && (
                      <div className="w-8 h-0.5 bg-gray-300 mx-2" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Current Step Content */}
        <Card>
          {/* Hide header for steps where we omit title/subtitle */}
          {!( ['Upload PDF','Detect Fields','Build Form','Map Fields','Preview & Test','Publish Form'].includes(currentStepConfig.title) ) && (
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {currentStepConfig.title}
              </CardTitle>
              <p className="text-gray-600">{currentStepConfig.description}</p>
            </CardHeader>
          )}
          <CardContent className={['Upload PDF','Detect Fields','Build Form','Map Fields','Preview & Test','Publish Form'].includes(currentStepConfig.title)?'pt-6':'pt-0'}>
            {CurrentComponent ? <CurrentComponent /> : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading component...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            onClick={previousStep}
            disabled={currentStep === 0}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <Button
            onClick={nextStep}
            disabled={currentStep === totalSteps - 1 || disableNext}
            className="flex items-center gap-2"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
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