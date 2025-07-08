"use client";

import React, { useState } from "react";
import { useAppStore } from "../../lib/store";
import FieldListPanel from "../detect/FieldListPanel";
import FormFieldsPanel from "../detect/FormFieldsPanel";
import PdfFieldViewer from "../detect/PdfFieldViewer";
import DocumentCarousel from "../common/DocumentCarousel";
import { Button } from "../ui/button";
import { Trash2, Wand2 } from "lucide-react";

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
  const [errorFieldId] = useState<string|null>(null);
  const [pageIndex,setPageIndex]=useState(0);
  const [zoom,setZoom]=useState(0.75);
  const [docStates,setDocStates]=useState<Record<string,{pageIndex:number;zoom:number}>>({});

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
  };
  const handleCheckboxToggle=(id:string,checked:boolean)=>{
    setSelectedForMapping(prev=>{const s=new Set(prev);checked?s.add(id):s.delete(id);return s;});
  };
  const handleMapSelected=(formFieldId:string)=>{
    if(selectedForMapping.size===0) return;
    const targetFormField = formFields.find(f=>f.id===formFieldId);
    if(!targetFormField) return;
    selectedForMapping.forEach(pdfFieldId=>{
      let pdfFieldType:string|undefined;
      for(const doc of pdfs){
        const pf = doc.formFields.find(f=>f.id===pdfFieldId);
        if(pf){ pdfFieldType = pf.type; break; }
      }
      if(pdfFieldType && pdfFieldType!==targetFormField.type) return;
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

  // mapping indices
  const formFieldNameMap:Record<string,string>={};formFields.forEach(f=>formFieldNameMap[f.id]=f.name);
  const mappingByPdfField:Record<string,string[]>={};
  Object.entries(pdfFieldLinks).forEach(([pdfFieldId,formIds])=>{
    mappingByPdfField[pdfFieldId]=formIds.map(fid=>formFieldNameMap[fid]||fid);
  });
  const mappedFieldIds = new Set<string>(Object.keys(pdfFieldLinks));
  const formFieldMappings: Record<string,MappedDetail[]> = {};
  pdfs.forEach(doc=>{
    doc.formFields.forEach(f=>{
      const linkedFormIds = pdfFieldLinks[f.id];
      if(linkedFormIds){
        linkedFormIds.forEach(fid=>{
          if(!formFieldMappings[fid]) formFieldMappings[fid]=[];
          formFieldMappings[fid].push({pdfFieldId:f.id,pdfName:doc.name,pageNumber:f.pageNumber,fieldName:f.name});
        });
      }
    })
  });

  // toolbar actions
  const clearAllMappings=()=>{
    Object.entries(pdfFieldLinks).forEach(([pdfFieldId,formIds])=>{
      formIds.forEach(fid=>removePdfFieldLink(pdfFieldId,fid));
    });
  };

  const switchPdf=(doc:typeof pdf)=>{
    setDocStates(prev=>({...prev,[pdf.id]:{pageIndex,zoom}}));
    const saved=docStates[doc.id];
    setPageIndex(saved?.pageIndex??0);
    setZoom(saved?.zoom??0.75);
    selectPdf(doc);
  };

  return (
    <div>
      {/* Document selector */}
      <DocumentCarousel documents={pdfs} activeId={pdf.id} onSelect={switchPdf} />

      {/* Controls bar */}
      <div className="flex items-center justify-between bg-slate-100/90 px-3 py-2 rounded shadow mb-2">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" disabled={pageIndex===0} onClick={()=>setPageIndex(pageIndex-1)}>◀</Button>
          <span className="text-sm whitespace-nowrap">Page {pageIndex+1} / {pdf.pages.length}</span>
          <Button variant="outline" size="icon" disabled={pageIndex===pdf.pages.length-1} onClick={()=>setPageIndex(pageIndex+1)}>▶</Button>
          <div className="ml-4 flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={()=>setZoom(Math.max(0.5,zoom-0.25))}>−</Button>
            <span className="text-sm w-10 text-center">{Math.round(zoom*100)}%</span>
            <Button variant="outline" size="icon" onClick={()=>setZoom(Math.min(2,zoom+0.25))}>＋</Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={()=>{/* future smart auto map */}}>
            <Wand2 className="h-4 w-4 mr-1"/> Auto-Map Names
          </Button>
          <Button size="sm" variant="destructive" onClick={clearAllMappings}>
            <Trash2 className="h-4 w-4 mr-1"/> Clear Mappings
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        {/* PDF viewer */}
        <div className="flex-1 min-w-0">
          <div className="relative border rounded bg-gray-100">
            <PdfFieldViewer
              key={pdf.id}
              pdf={pdf}
              selectedFieldId={selectedFieldId}
              onFieldSelect={(f)=>setSelectedFieldId(f.id)}
              pageIndex={pageIndex}
              onPageChange={setPageIndex}
              zoom={zoom}
              onZoomChange={setZoom}
              pageWidth={650}
            />
          </div>
        </div>

        {/* Detected Fields Panel */}
        <FieldListPanel
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
        />

        {/* Form Fields Panel */}
        <FormFieldsPanel
          formFields={formFields}
          onAddField={addNewFormField}
          onRename={renameFormField}
          onDelete={deleteFormField}
          onUpdateField={(id,updates)=>updateFormField(id,updates)}
          mappings={formFieldMappings}
          onMapSelected={handleMapSelected}
          onUnmap={handleUnmap}
        />
      </div>
    </div>
  );
};

export default MapFieldsStep; 