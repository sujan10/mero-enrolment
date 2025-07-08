"use client";

import React, { useState, useRef } from "react";
import toast from 'react-hot-toast';
import PdfFieldViewer from "./PdfFieldViewer";
import { Button } from "../ui/button";
import FieldListPanel from "./FieldListPanel";
import FormFieldsPanel from "./FormFieldsPanel";
import { useAppStore } from "../../lib/store";
import { PDFFormField } from "../../types";
// util id

interface MappedDetail {
  pdfFieldId:string;
  pdfName:string;
  pageNumber:number;
  fieldName:string;
}

const DetectFieldsStep: React.FC = () => {
  const { pdfs, selectedPdf, updatePdfFields, selectPdf, addFormField, updateFormField, removeFormField, formFields  } = useAppStore();
  const pdf = selectedPdf || pdfs[0];
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [addMode, setAddMode] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [errorFieldId, setErrorFieldId] = useState<string|null>(null);
  const [selectedForMapping,setSelectedForMapping]=useState<Set<string>>(new Set());
  const [formFieldMappings,setFormFieldMappings]=useState<Record<string,MappedDetail[]>>({});
  const [docStates,setDocStates] = useState<Record<string,{pageIndex:number;zoom:number;selectedFieldId:string|null}>>({});
  const carouselRef = useRef<HTMLDivElement>(null);

  // ensure pageIndex is valid when pdf changes
  React.useEffect(()=>{
    if(pageIndex>=pdf.pages.length){
      setPageIndex(0);
    }
  },[pdf,pageIndex]);

  if (!pdf) {
    return <p className="text-center text-gray-600">No PDF selected.</p>;
  }

  const getAllFieldNames = () => {
    return new Set(pdfs.flatMap(doc => doc.formFields.map(f => f.name)));
  };

  const generateUniqueName = (base: string) => {
    const names = getAllFieldNames();
    if (!names.has(base)) return base;
    let i = 1;
    let candidate = `${base}_${i}`;
    while (names.has(candidate)) {
      i += 1;
      candidate = `${base}_${i}`;
    }
    return candidate;
  };

  // Handlers
  const handleRename = (id: string, newName: string) => {
    const names = getAllFieldNames();
    // Remove current field name so it can stay same
    const currentField = pdf.formFields.find(f=>f.id===id);
    if(currentField) names.delete(currentField.name);
    if (names.has(newName)) {
      toast.custom((t)=>(
        <div
          className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white px-4 py-2 rounded shadow-lg ${t.visible? 'opacity-100':'opacity-0'}`}
        >Field name must be unique across this workbook</div>
      ), { duration:3000 });
      setErrorFieldId(id);
      setTimeout(()=>setErrorFieldId(null),3000);
      return;
    }
    const updated = pdf.formFields.map((f) =>
      f.id === id ? { ...f, name: newName } : f
    );
    updatePdfFields(pdf.id, updated);
  };

  const handleTypeChange = (
    id: string,
    newType: PDFFormField["type"]
  ) => {
    const updated = pdf.formFields.map((f) =>
      f.id === id ? { ...f, type: newType } : f
    );
    updatePdfFields(pdf.id, updated);
  };

  const handleDelete = (id: string) => {
    const updated = pdf.formFields.filter((f) => f.id !== id);
    updatePdfFields(pdf.id, updated);
    if (selectedFieldId === id) setSelectedFieldId(null);
  };

  const handleMoveField = (fieldId: string, newX: number, newY: number) => {
    const updated = pdf.formFields.map(f=>f.id===fieldId?{...f,x:newX,y:newY}:f);
    updatePdfFields(pdf.id, updated);
  };

  const handleResizeField = (fieldId:string,newW:number,newH:number)=>{
    const updated = pdf.formFields.map(f=>f.id===fieldId?{...f,width:newW,height:newH}:f);
    updatePdfFields(pdf.id, updated);
  };

  const handleAddField = (newField: PDFFormField) => {
    // ensure unique name
    const uniqueName = generateUniqueName(newField.name || 'field');
    const fieldWithName = { ...newField, name: uniqueName };
    updatePdfFields(pdf.id, [...pdf.formFields, fieldWithName]);
    setSelectedFieldId(fieldWithName.id);
    setAddMode(false);
  };

  const handleCheckboxToggle=(id:string,checked:boolean)=>{
    setSelectedForMapping(prev=>{
      const newSet=new Set(prev);
      checked?newSet.add(id):newSet.delete(id);
      return newSet;
    });
  };

  const handleMapSelected=(formFieldId:string)=>{
    if(selectedForMapping.size===0) return;
    const mapped: MappedDetail[] = [];
    pdfs.forEach(doc=>{
      doc.formFields.forEach(f=>{
        if(selectedForMapping.has(f.id)){
          mapped.push({pdfFieldId:f.id,pdfName:doc.name,pageNumber:f.pageNumber,fieldName:f.name});
        }
      })
    });
    setFormFieldMappings(prev=>({
      ...prev,
      [formFieldId]:[...(prev[formFieldId]||[]),...mapped]
    }));
    setSelectedForMapping(new Set());
  };

  const handleUnmap=(formFieldId:string,pdfFieldId:string)=>{
    setFormFieldMappings(prev=>{
      const list=prev[formFieldId]?.filter(m=>m.pdfFieldId!==pdfFieldId)||[];
      return {...prev,[formFieldId]:list};
    });
  };

  const genId=()=>Math.random().toString(36).substr(2,9);
  const addNewFormField=()=>{
    addFormField({id:genId(),name:`form_field_${formFields.length+1}`,label:"",type:"text",required:false,order:formFields.length});
  };
  const renameFormField=(id:string,newName:string)=>{updateFormField(id,{name:newName,label:newName})};
  const deleteFormField=(id:string)=>{removeFormField(id);setFormFieldMappings(prev=>{const copy={...prev};delete copy[id];return copy;});};

  const switchPdf = (doc: typeof pdf) => {
    // save current state for existing pdf
    setDocStates(prev=>({...prev,[pdf.id]:{pageIndex,zoom,selectedFieldId}}));
    // restore state if exists
    const saved = docStates[doc.id];
    setPageIndex(saved?.pageIndex ?? 0);
    setZoom(saved?.zoom ?? 1);
    setSelectedFieldId(saved?.selectedFieldId ?? null);
    selectPdf(doc);
  };

  const mappedFieldIds=new Set<string>();
  Object.values(formFieldMappings).forEach(list=>list.forEach(m=>mappedFieldIds.add(m.pdfFieldId)));
  const mappingByPdfField: Record<string,string[]> = {};
  Object.entries(formFieldMappings).forEach(([formFieldId,list])=>{
    list.forEach(m=>{
      if(!mappingByPdfField[m.pdfFieldId]) mappingByPdfField[m.pdfFieldId]=[];
      mappingByPdfField[m.pdfFieldId].push(formFieldId);
    });
  });

  return (
    <div>
      {/* Document selector - full width */}
      <div className="flex items-center gap-2 mb-3 w-full">
        <button onClick={()=>{carouselRef.current?.scrollBy({left:-150,behavior:'smooth'})}} className="px-2 py-1 bg-gray-200 rounded">◀</button>
        <div ref={carouselRef} className="flex-1 overflow-x-auto no-scrollbar flex gap-2">
          {pdfs.map(doc=>(
            <button key={doc.id} onClick={()=>switchPdf(doc)} className={`px-3 py-1 rounded border flex-shrink-0 max-w-[160px] truncate ${doc.id===pdf.id?'bg-blue-500 text-white border-blue-500':'bg-white border-gray-300'}`}>{doc.name}</button>
          ))}
        </div>
        <button onClick={()=>{carouselRef.current?.scrollBy({left:150,behavior:'smooth'})}} className="px-2 py-1 bg-gray-200 rounded">▶</button>
      </div>

      <div className="flex gap-4">
        {/* PDF Viewer */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {/* Controls bar */}
          <div className="flex items-center justify-center gap-4 bg-slate-100/90 backdrop-blur px-3 py-1 rounded shadow">
             <Button variant="outline" size="icon" disabled={pageIndex===0} onClick={()=>setPageIndex(pageIndex-1)}>◀</Button>
             <span className="text-sm whitespace-nowrap">Page {pageIndex+1} / {pdf.pages.length}</span>
             <Button variant="outline" size="icon" disabled={pageIndex===pdf.pages.length-1} onClick={()=>setPageIndex(pageIndex+1)}>▶</Button>
             <div className="ml-4 flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={()=>setZoom(Math.max(0.5,zoom-0.25))}>−</Button>
                <span className="text-sm w-10 text-center">{Math.round(zoom*100)}%</span>
                <Button variant="outline" size="icon" onClick={()=>setZoom(Math.min(2,zoom+0.25))}>＋</Button>
             </div>
          </div>
          {/* Fixed wrapper */}
          <div className="relative flex-1 overflow-auto border rounded bg-gray-100 mt-2">
            <PdfFieldViewer
              key={pdf.id}
              pdf={pdf}
              selectedFieldId={selectedFieldId}
              onFieldSelect={(f) => setSelectedFieldId(f.id)}
              pageWidth={650}
              drawingMode={addMode}
              onAddField={handleAddField}
              pageIndex={pageIndex}
              onPageChange={setPageIndex}
              zoom={zoom}
              onZoomChange={setZoom}
              onMoveField={handleMoveField}
              onResizeField={handleResizeField}
            />
          </div>
        </div>
        {/* Detected Fields panel */}
        <FieldListPanel
          pdf={pdf}
          selectedFieldId={selectedFieldId}
          onSelect={(f) => setSelectedFieldId(f.id)}
          onRename={handleRename}
          onChangeType={handleTypeChange}
          onDelete={handleDelete}
          addMode={addMode}
          onToggleAddMode={() => setAddMode((m) => !m)}
          currentPage={pageIndex+1}
          errorFieldId={errorFieldId}
          onCheckboxToggle={handleCheckboxToggle}
          selectedForMapping={selectedForMapping}
          mappedFieldIds={mappedFieldIds}
          mappingByPdfField={mappingByPdfField}
        />

        {/* Form Fields panel */}
        <FormFieldsPanel
          formFields={formFields}
          onAddField={addNewFormField}
          onRename={renameFormField}
          onDelete={deleteFormField}
          mappings={formFieldMappings}
          onMapSelected={handleMapSelected}
          onUnmap={handleUnmap}
        />
      </div>
    </div>
  );
};

export default DetectFieldsStep; 