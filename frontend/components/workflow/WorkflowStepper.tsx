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
  AlertCircle
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useAppStore } from '../../lib/store';
import { WorkflowStep } from '../../types';

// Dynamic imports for components that use PDF libraries
let PdfUploader: any = null;
let FormBuilder: any = null;
let FieldMapper: any = null;
let FormPreview: any = null;
let PdfGenerator: any = null;

const stepConfig = [
  {
    id: WorkflowStep.UPLOAD_PDF,
    title: 'Upload PDFs',
    description: 'Upload your PDF documents',
    icon: Upload,
    componentName: 'PdfUploader'
  },
  {
    id: WorkflowStep.DETECT_FIELDS,
    title: 'Detect Fields',
    description: 'Review and edit detected form fields',
    icon: FileText,
    componentName: 'FieldMapper'
  },
  {
    id: WorkflowStep.BUILD_FORM,
    title: 'Build Form',
    description: 'Create your web form',
    icon: Settings,
    componentName: 'FormBuilder'
  },
  {
    id: WorkflowStep.MAP_FIELDS,
    title: 'Map Fields',
    description: 'Connect form fields to PDF fields',
    icon: Link,
    componentName: 'FieldMapper'
  },
  {
    id: WorkflowStep.PREVIEW_TEST,
    title: 'Preview & Test',
    description: 'Test your form and preview results',
    icon: Eye,
    componentName: 'FormPreview'
  },
  {
    id: WorkflowStep.GENERATE_PDF,
    title: 'Generate PDF',
    description: 'Generate and download filled PDFs',
    icon: Download,
    componentName: 'PdfGenerator'
  }
];

const WorkflowStepper: React.FC = () => {
  const { 
    currentStep, 
    totalSteps, 
    nextStep, 
    previousStep, 
    setCurrentStep,
    pdfs,
    formFields,
    fieldMappings,
    isLoading,
    error
  } = useAppStore();

  const [isClient, setIsClient] = useState(false);

  // Load components dynamically on client side
  useEffect(() => {
    const loadComponents = async () => {
      try {
        const [
          pdfUploaderModule,
          formBuilderModule,
          fieldMapperModule,
          formPreviewModule,
          pdfGeneratorModule
        ] = await Promise.all([
          import('../pdf/PdfUploader'),
          import('../form/FormBuilder'),
          import('../mapping/FieldMapper'),
          import('../preview/FormPreview'),
          import('../generator/PdfGenerator')
        ]);

        PdfUploader = pdfUploaderModule.default;
        FormBuilder = formBuilderModule.default;
        FieldMapper = fieldMapperModule.default;
        FormPreview = formPreviewModule.default;
        PdfGenerator = pdfGeneratorModule.default;

        setIsClient(true);
      } catch (error) {
        console.error('Failed to load components:', error);
      }
    };

    loadComponents();
  }, []);

  const canProceedToNext = () => {
    switch (currentStep) {
      case WorkflowStep.UPLOAD_PDF:
        return pdfs.length > 0;
      case WorkflowStep.DETECT_FIELDS:
        return true; // Always can proceed from field detection
      case WorkflowStep.BUILD_FORM:
        return formFields.length > 0;
      case WorkflowStep.MAP_FIELDS:
        return fieldMappings.length > 0;
      case WorkflowStep.PREVIEW_TEST:
        return true; // Always can proceed from preview
      case WorkflowStep.GENERATE_PDF:
        return false; // Final step
      default:
        return false;
    }
  };

  const canGoToStep = (step: number) => {
    // Can always go back
    if (step < currentStep) return true;
    
    // Can only go forward if previous steps are completed
    switch (step) {
      case WorkflowStep.DETECT_FIELDS:
        return pdfs.length > 0;
      case WorkflowStep.BUILD_FORM:
        return pdfs.length > 0;
      case WorkflowStep.MAP_FIELDS:
        return pdfs.length > 0 && formFields.length > 0;
      case WorkflowStep.PREVIEW_TEST:
        return pdfs.length > 0 && formFields.length > 0 && fieldMappings.length > 0;
      case WorkflowStep.GENERATE_PDF:
        return pdfs.length > 0 && formFields.length > 0 && fieldMappings.length > 0;
      default:
        return false;
    }
  };

  const getStepStatus = (step: number) => {
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'current';
    return 'upcoming';
  };

  const handleStepClick = (step: number) => {
    if (canGoToStep(step)) {
      setCurrentStep(step);
    }
  };

  const getCurrentComponent = () => {
    if (!isClient) return null;

    const currentStepConfig = stepConfig[currentStep];
    const componentName = currentStepConfig.componentName;

    switch (componentName) {
      case 'PdfUploader':
        return PdfUploader;
      case 'FormBuilder':
        return FormBuilder;
      case 'FieldMapper':
        return FieldMapper;
      case 'FormPreview':
        return FormPreview;
      case 'PdfGenerator':
        return PdfGenerator;
      default:
        return null;
    }
  };

  const CurrentComponent = getCurrentComponent();

  // Show loading state while components are loading
  if (!isClient) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>PDF Form Automation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading application components...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>PDF Form Automation</span>
            <Badge variant="secondary">
              Step {currentStep + 1} of {totalSteps}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Step Indicators */}
          <div className="flex items-center justify-between mb-8">
            {stepConfig.map((step, index) => {
              const Icon = step.icon;
              const status = getStepStatus(index);
              const isClickable = canGoToStep(index);

              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center gap-2 ${
                    isClickable ? 'cursor-pointer' : 'cursor-not-allowed'
                  }`}
                  onClick={() => isClickable && handleStepClick(index)}
                >
                  <div
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors
                      ${status === 'completed' 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : status === 'current' 
                          ? 'bg-blue-500 border-blue-500 text-white' 
                          : 'bg-gray-100 border-gray-300 text-gray-400'
                      }
                    `}
                  >
                    {status === 'completed' ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-medium ${
                      status === 'completed' 
                        ? 'text-green-600' 
                        : status === 'current' 
                          ? 'text-blue-600' 
                          : 'text-gray-400'
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            ></div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={previousStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <Button
              onClick={nextStep}
              disabled={!canProceedToNext()}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">Error: {error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Step Content */}
      {CurrentComponent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {React.createElement(stepConfig[currentStep].icon, { className: "h-5 w-5" })}
              {stepConfig[currentStep].title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CurrentComponent />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WorkflowStepper; 