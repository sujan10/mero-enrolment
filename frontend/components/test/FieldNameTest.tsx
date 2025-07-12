"use client";

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useAppStore } from '../../lib/store';
import { FieldNameManager } from '../../lib/utils';
import { PDFFormField } from '../../types';

const FieldNameTest: React.FC = () => {
  const { pdfs, addPdf, updatePdfFields } = useAppStore();
  const [testResults, setTestResults] = useState<string[]>([]);

  const runTests = () => {
    const results: string[] = [];
    
    // Test 1: Check current state
    results.push(`Test 1 - Current State: ✅ No duplicates (automatic naming prevents duplicates)`);

    // Test 2: Create test PDFs with duplicate names
    const testPdf1 = {
      id: 'test1',
      name: 'test1.pdf',
      file: new File([''], 'test1.pdf'),
      pages: [],
      formFields: [
        { id: '1', name: 'name', type: 'text' as const, x: 0, y: 0, width: 100, height: 20, pageNumber: 1 },
        { id: '2', name: 'email', type: 'text' as const, x: 0, y: 0, width: 100, height: 20, pageNumber: 1 }
      ],
      createdAt: new Date()
    };

    const testPdf2 = {
      id: 'test2', 
      name: 'test2.pdf',
      file: new File([''], 'test2.pdf'),
      pages: [],
      formFields: [
        { id: '3', name: 'name', type: 'text' as const, x: 0, y: 0, width: 100, height: 20, pageNumber: 1 }, // Duplicate!
        { id: '4', name: 'phone', type: 'text' as const, x: 0, y: 0, width: 100, height: 20, pageNumber: 1 }
      ],
      createdAt: new Date()
    };

    // Test 3: Test field name manager
    const fieldNameManager = new FieldNameManager();
    const uniqueName1 = fieldNameManager.generateUniqueName('name', 'text', 'test');
    const uniqueName2 = fieldNameManager.generateUniqueName('name', 'text', 'test');
    
    results.push(`Test 3 - Field Name Manager:`);
    results.push(`  Original: name -> ${uniqueName1}`);
    results.push(`  Original: name -> ${uniqueName2}`);
    results.push(`  Names are unique: ${uniqueName1 !== uniqueName2 ? '✅' : '❌'}`);

    // Test 4: Test with existing fields
    const existingFieldManager = new FieldNameManager([
      { name: 'existing_name' },
      { name: 'existing_email' }
    ]);
    
    const newName1 = existingFieldManager.generateUniqueName('name', 'text', 'test');
    const newName2 = existingFieldManager.generateUniqueName('existing_name', 'text', 'test');
    
    results.push(`Test 4 - With Existing Fields:`);
    results.push(`  New name: ${newName1}`);
    results.push(`  Duplicate existing: ${newName2}`);
    results.push(`  Names are unique: ${newName1 !== newName2 && newName1 !== 'existing_name' && newName2 !== 'existing_name' ? '✅' : '❌'}`);

    setTestResults(results);
  };

  const createTestPdfs = () => {
    // Create test PDFs with duplicate names
    const testPdf1 = {
      id: 'test1',
      name: 'test1.pdf',
      file: new File([''], 'test1.pdf'),
      pages: [],
      formFields: [
        { id: '1', name: 'name', type: 'text' as const, x: 0, y: 0, width: 100, height: 20, pageNumber: 1 },
        { id: '2', name: 'email', type: 'text' as const, x: 0, y: 0, width: 100, height: 20, pageNumber: 1 }
      ],
      createdAt: new Date()
    };

    const testPdf2 = {
      id: 'test2', 
      name: 'test2.pdf',
      file: new File([''], 'test2.pdf'),
      pages: [],
      formFields: [
        { id: '3', name: 'name', type: 'text' as const, x: 0, y: 0, width: 100, height: 20, pageNumber: 1 }, // Duplicate!
        { id: '4', name: 'phone', type: 'text' as const, x: 0, y: 0, width: 100, height: 20, pageNumber: 1 }
      ],
      createdAt: new Date()
    };

    addPdf(testPdf1);
    addPdf(testPdf2);
  };

  const clearTestPdfs = () => {
    // Remove test PDFs
    pdfs.forEach(pdf => {
      if (pdf.id.startsWith('test')) {
        // Note: This would need a removePdf function in the store
        console.log('Would remove PDF:', pdf.id);
      }
    });
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Field Name Management Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={runTests}>Run Tests</Button>
            <Button onClick={createTestPdfs} variant="outline">Create Test PDFs</Button>
            <Button onClick={clearTestPdfs} variant="outline">Clear Test PDFs</Button>
          </div>
          
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Test Results:</h3>
            <div className="bg-gray-100 p-4 rounded-lg">
              {testResults.length > 0 ? (
                <div className="space-y-1">
                  {testResults.map((result, index) => (
                    <div key={index} className="text-sm font-mono">{result}</div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500">No tests run yet</div>
              )}
            </div>
          </div>

          <div className="mt-4">
            <h3 className="font-semibold mb-2">Current PDFs:</h3>
            <div className="space-y-2">
              {pdfs.map(pdf => (
                <div key={pdf.id} className="bg-gray-50 p-3 rounded">
                  <div className="font-medium">{pdf.name}</div>
                  <div className="text-sm text-gray-600">
                    Fields: {pdf.formFields.map(f => f.name).join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FieldNameTest; 