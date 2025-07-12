"use client";

import React, { useState, useRef } from "react";
import toast from 'react-hot-toast';
import { useAppStore } from "../../lib/store";
import FieldListPanel, { FieldListPanelRef } from "../detect/FieldListPanel";
import FormFieldsPanel from "../detect/FormFieldsPanel";
import PdfFieldViewer from "../detect/PdfFieldViewer";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Trash2, Wand2 } from "lucide-react";
import { PDFFormField, FormField } from "../../types";

interface MappedDetail {
  pdfFieldId:string;
  pdfName:string;
  pageNumber:number;
  fieldName:string;
}

const MapFieldsStep: React.FC = () => {
  const {
    pdfs,
    selectedPdf,
    formFields,
    addFormField,
    updateFormField,
    removeFormField,
    selectPdf,
    pdfFieldLinks,
    addPdfFieldLink,
    removePdfFieldLink,
  } = useAppStore();
  const pdf = selectedPdf || pdfs[0];

  const [selectedFieldId,setSelectedFieldId] = useState<string|null>(null);
  const [selectedForMapping,setSelectedForMapping]=useState<Set<string>>(new Set());
  const [selectedFormFields,setSelectedFormFields]=useState<Set<string>>(new Set());
  const [errorFieldId] = useState<string|null>(null);
  const [pageIndex,setPageIndex]=useState(0);
  const [zoom,setZoom]=useState(0.75);
  const [docStates,setDocStates]=useState<Record<string,{pageIndex:number;zoom:number;selectedFieldId:string|null}>>({});
  const [confirmationDialog, setConfirmationDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: "", message: "", onConfirm: () => {} });
  const carouselRef = useRef<HTMLDivElement>(null);
  const fieldListRef = useRef<FieldListPanelRef>(null);

  // ensure pageIndex is valid when pdf changes
  React.useEffect(()=>{
    if(pageIndex>=pdf.pages.length){
      setPageIndex(0);
    }
  },[pdf,pageIndex]);

  if (!pdf) {
    return <p className="text-center text-gray-600">No PDF selected.</p>;
  }

  // helpers
  const genId=()=>Math.random().toString(36).substr(2,9);
  const addNewFormField=(fieldType:import("../../types").FormFieldType)=>{
    addFormField({id:genId(),name:`form_field_${formFields.length+1}`,label:"",type:fieldType,required:false,order:formFields.length});
  };
  const renameFormField=(id:string,newName:string)=>{updateFormField(id,{name:newName,label:newName})};
  const deleteFormField=(id:string)=>{
    removeFormField(id);
    // remove any links with this form field
    Object.entries(pdfFieldLinks).forEach(([pdfFieldId,formIds])=>{
      if(formIds.includes(id)) removePdfFieldLink(pdfFieldId,id);
    });
    // Remove from selection if it was selected
    setSelectedFormFields(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };
  const handleCheckboxToggle=(id:string,checked:boolean)=>{
    setSelectedForMapping(prev=>{const s=new Set(prev);checked?s.add(id):s.delete(id);return s;});
  };
  const handleFormFieldCheckboxToggle=(id:string,checked:boolean)=>{
    setSelectedFormFields(prev=>{
      const newSet=new Set(prev);
      checked?newSet.add(id):newSet.delete(id);
      return newSet;
    });
  };
  const handleMapSelected=(formFieldId:string)=>{
    if(selectedForMapping.size===0) return;
    const targetFormField = formFields.find(f=>f.id===formFieldId);
    if(!targetFormField) return;
    
    // Check for type compatibility
    const incompatibleFields: string[] = [];
    selectedForMapping.forEach((pdfFieldId)=>{
      let pdfFieldType:string|undefined;
      for(const doc of pdfs){
        const pf = doc.formFields.find(f=>f.id===pdfFieldId);
        if(pf){ pdfFieldType = pf.type; break; }
      }
      if(pdfFieldType && pdfFieldType!==targetFormField.type){
        incompatibleFields.push(pdfFieldId);
      }
    });

    if(incompatibleFields.length > 0) {
      const fieldNames = incompatibleFields.map(id => {
        for(const doc of pdfs){
          const pf = doc.formFields.find(f=>f.id===id);
          if(pf) return pf.name;
        }
        return id;
      }).join(', ');
      
      toast.error(`Cannot map fields of different types: ${fieldNames}`);
      return;
    }

    selectedForMapping.forEach(pdfFieldId=>{
      addPdfFieldLink(pdfFieldId,formFieldId);
      // auto add option
      if(targetFormField.type==='radio'||targetFormField.type==='checkbox'){
        const label = pdf.pages.flatMap(p=>p.formFields).find(f=>f.id===pdfFieldId)?.name || 'Option';
        if(!targetFormField.options?.includes(label)){
          updateFormField(formFieldId,{options:[...(targetFormField.options||[]),label]});
        }
      }
    });
    setSelectedForMapping(new Set());
  };
  const handleUnmap=(formFieldId:string,pdfFieldId:string)=>{
    removePdfFieldLink(pdfFieldId,formFieldId);
  };

  const handleFieldSelect = (field: PDFFormField) => {
    setSelectedFieldId(field.id);
    // Scroll to the field in the list
    fieldListRef.current?.scrollToField(field.id);
  };

  const handleShowError = (message: string) => {
    toast.error(message);
  };

  const handleShowConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmationDialog({
      open: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmationDialog(prev => ({ ...prev, open: false }));
      }
    });
  };

  const updateFormFieldWithTypeCheck = (id: string, updates: Partial<FormField>) => {
    // If type is being changed, check for incompatible mappings
    if (updates.type) {
      const currentField = formFields.find(f => f.id === id);
      if (currentField && currentField.type !== updates.type) {
        // Find all PDF fields mapped to this form field
        const mappedPdfFields = Object.entries(pdfFieldLinks)
          .filter(([pdfFieldId, formIds]) => formIds.includes(id))
          .map(([pdfFieldId]) => pdfFieldId);
        
        // Check for type incompatibility
        const incompatibleMappings = mappedPdfFields.filter(pdfFieldId => {
          const pdfField = pdfs.flatMap(doc => doc.formFields).find(f => f.id === pdfFieldId);
          return pdfField && pdfField.type !== updates.type;
        });
        
        // Remove incompatible mappings
        incompatibleMappings.forEach(pdfFieldId => {
          removePdfFieldLink(pdfFieldId, id);
        });
      }
    }
    
    updateFormField(id, updates);
  };

  // mapping indices
  const formFieldNameMap:Record<string,string>={};formFields.forEach(f=>formFieldNameMap[f.id]=f.name);
  const mappingByPdfField:Record<string,string[]>={};
  Object.entries(pdfFieldLinks).forEach(([pdfFieldId,formIds])=>{
    // Only include mappings where the form field still exists
    const existingFormIds = formIds.filter(fid => formFields.some(f => f.id === fid));
    if (existingFormIds.length > 0) {
      mappingByPdfField[pdfFieldId]=existingFormIds.map(fid=>formFieldNameMap[fid]||fid);
    }
  });
  const mappedFieldIds = new Set<string>(Object.keys(mappingByPdfField));
  const formFieldMappings: Record<string,MappedDetail[]> = {};
  pdfs.forEach(doc=>{
    doc.formFields.forEach(f=>{
      const linkedFormIds = pdfFieldLinks[f.id];
      if(linkedFormIds){
        // Only include mappings where the form field still exists
        const existingFormIds = linkedFormIds.filter(fid => formFields.some(formField => formField.id === fid));
        existingFormIds.forEach(fid=>{
          if(!formFieldMappings[fid]) formFieldMappings[fid]=[];
          formFieldMappings[fid].push({pdfFieldId:f.id,pdfName:doc.name,pageNumber:f.pageNumber,fieldName:f.name});
        });
      }
    })
  });

  // toolbar actions
  const clearAllMappings=()=>{
    handleShowConfirmation(
      "Clear All Mappings",
      "Are you sure you want to clear all field mappings? This action cannot be undone.",
      () => {
        Object.entries(pdfFieldLinks).forEach(([pdfFieldId,formIds])=>{
          formIds.forEach(fid=>removePdfFieldLink(pdfFieldId,fid));
        });
        toast.success("All mappings cleared");
      }
    );
  };

  const switchPdf=(doc:typeof pdf)=>{
    // save current state for existing pdf
    setDocStates(prev=>({...prev,[pdf.id]:{pageIndex,zoom,selectedFieldId}}));
    // restore state if exists
    const saved = docStates[doc.id];
    setPageIndex(saved?.pageIndex ?? 0);
    setZoom(saved?.zoom ?? 0.75);
    setSelectedFieldId(saved?.selectedFieldId ?? null);
    selectPdf(doc);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Document selector - full width */}
      <div className="flex items-center gap-2 mb-3 w-full flex-shrink-0">
        <button onClick={()=>{carouselRef.current?.scrollBy({left:-150,behavior:'smooth'})}} className="px-2 py-1 bg-gray-200 rounded">◀</button>
        <div ref={carouselRef} className="flex-1 overflow-x-auto no-scrollbar flex gap-2">
          {pdfs.map(doc=>(
            <button key={doc.id} onClick={()=>switchPdf(doc)} className={`px-3 py-1 rounded border flex-shrink-0 max-w-[160px] truncate ${doc.id===pdf.id?'bg-blue-500 text-white border-blue-500':'bg-white border-gray-300'}`}>{doc.name}</button>
          ))}
        </div>
        <button onClick={()=>{carouselRef.current?.scrollBy({left:150,behavior:'smooth'})}} className="px-2 py-1 bg-gray-200 rounded">▶</button>
      </div>

      <div className="flex flex-col lg:flex-row gap-2 lg:gap-4 min-w-0 overflow-hidden flex-1">
        {/* PDF Viewer */}
        <div className="flex-1 min-w-0 flex flex-col gap-2 overflow-hidden">
          {/* Controls bar */}
          <div className="flex items-center justify-between bg-slate-100/90 backdrop-blur px-2 sm:px-3 py-1 rounded shadow overflow-x-auto flex-shrink-0">
            <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
              <Button variant="outline" size="icon" disabled={pageIndex===0} onClick={()=>setPageIndex(pageIndex-1)} className="h-8 w-8">◀</Button>
              <span className="text-xs sm:text-sm whitespace-nowrap">Page {pageIndex+1} / {pdf.pages.length}</span>
              <Button variant="outline" size="icon" disabled={pageIndex===pdf.pages.length-1} onClick={()=>setPageIndex(pageIndex+1)} className="h-8 w-8">▶</Button>
              <div className="ml-2 sm:ml-4 flex items-center gap-1 sm:gap-2">
                <Button variant="outline" size="icon" onClick={()=>setZoom(Math.max(0.5,zoom-0.25))} className="h-8 w-8">−</Button>
                <span className="text-xs sm:text-sm w-8 sm:w-10 text-center">{Math.round(zoom*100)}%</span>
                <Button variant="outline" size="icon" onClick={()=>setZoom(Math.min(2,zoom+0.25))} className="h-8 w-8">＋</Button>
              </div>
              <div className="border-l border-gray-300 mx-1 sm:mx-2 h-6"></div>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => {
                  // Fit to page horizontally
                  const container = document.querySelector('.relative.flex-1.overflow-auto') as HTMLElement | null;
                  if (container) {
                    const containerWidth = container.clientWidth;
                    const scrollbarWidth = container.offsetWidth - container.clientWidth;
                    const pageWidth = pdf.pages[pageIndex]?.width || 600;
                    const newZoom = (containerWidth - 40 - scrollbarWidth) / pageWidth;
                    setZoom(Math.min(2, Math.max(0.5, newZoom)));
                  }
                }}
                title="Fit to page horizontally"
                className="h-8 w-8"
              >
                ⇄
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => {
                  // Fit to page vertically
                  const container = document.querySelector('.relative.flex-1.overflow-auto') as HTMLElement | null;
                  if (container) {
                    const containerHeight = container.clientHeight;
                    const scrollbarHeight = container.offsetHeight - container.clientHeight;
                    const pageHeight = (pdf.pages[pageIndex]?.height || 800);
                    const newZoom = (containerHeight - 40 - scrollbarHeight) / pageHeight;
                    setZoom(Math.min(2, Math.max(0.5, newZoom)));
                  }
                }}
                title="Fit to page vertically"
                className="h-8 w-8"
              >
                <span className="rotate-90">⇄</span>
              </Button>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button size="sm" variant="outline" onClick={()=>{/* future smart auto map */}} className="text-xs">
                <Wand2 className="h-4 w-4 mr-1"/> <span className="hidden sm:inline">Auto-Map Names</span>
              </Button>
              <Button size="sm" variant="destructive" onClick={clearAllMappings} className="text-xs">
                <Trash2 className="h-4 w-4 mr-1"/> <span className="hidden sm:inline">Clear Mappings</span>
              </Button>
            </div>
          </div>
          {/* Fixed wrapper */}
          <div className="relative flex-1 overflow-auto border rounded bg-gray-100 mt-2 min-h-0" onWheel={(e) => e.stopPropagation()}>
            <PdfFieldViewer
              key={pdf.id}
              pdf={pdf}
              selectedFieldId={selectedFieldId}
              onFieldSelect={handleFieldSelect}
              pageWidth={650}
              pageIndex={pageIndex}
              onPageChange={setPageIndex}
              zoom={zoom}
              onZoomChange={setZoom}
            />
          </div>
        </div>

        {/* Detected Fields Panel */}
        <FieldListPanel
          ref={fieldListRef}
          pdf={pdf}
          selectedFieldId={selectedFieldId}
          onSelect={(f)=>setSelectedFieldId(f.id)}
          onRename={()=>{}}
          onChangeType={()=>{}}
          onDelete={()=>{}}
          addMode={false}
          onToggleAddMode={()=>{}}
          currentPage={pageIndex+1}
          errorFieldId={errorFieldId}
          onCheckboxToggle={handleCheckboxToggle}
          selectedForMapping={selectedForMapping}
          mappedFieldIds={mappedFieldIds}
          mappingByPdfField={mappingByPdfField}
          formFields={formFields}
          onShowError={handleShowError}
          onShowConfirmation={handleShowConfirmation}
          currentPageFields={pdf.formFields.filter(f => f.pageNumber === pageIndex + 1).length}
          totalFields={pdf.formFields.length}
        />

        {/* Form Fields Panel */}
        <FormFieldsPanel
          formFields={formFields}
          onAddField={addNewFormField}
          onRename={renameFormField}
          onDelete={deleteFormField}
          onUpdateField={updateFormFieldWithTypeCheck}
          mappings={formFieldMappings}
          onMapSelected={handleMapSelected}
          onUnmap={handleUnmap}
          selectedForMapping={selectedFormFields}
          onCheckboxToggle={handleFormFieldCheckboxToggle}
          onShowConfirmation={handleShowConfirmation}
        />
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmationDialog.open} onOpenChange={(open) => setConfirmationDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmationDialog.title}</DialogTitle>
            <DialogDescription>
              {confirmationDialog.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmationDialog(prev => ({ ...prev, open: false }))}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmationDialog.onConfirm}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MapFieldsStep; 