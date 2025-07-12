"use client";

import React, { useState } from "react";
import { useAppStore } from "../../lib/store";
import FieldListPanel from "../detect/FieldListPanel";
import FormFieldsPanel from "../detect/FormFieldsPanel";
import FormPreview from "../builder/FormPreview";
import { Button } from "../ui/button";

interface MappedDetail {
  pdfFieldId:string;
  pdfName:string;
  pageNumber:number;
  fieldName:string;
}

const BuildFormStep: React.FC = () => {
  const { pdfs, selectedPdf, formFields, addFormField, updateFormField, removeFormField, pdfFieldLinks, addPdfFieldLink, removePdfFieldLink } = useAppStore();
  const pdf = selectedPdf || pdfs[0];

  const [selectedFieldId,setSelectedFieldId] = useState<string|null>(null);
  const [selectedForMapping,setSelectedForMapping]=useState<Set<string>>(new Set());
  const [errorFieldId] = useState<string|null>(null);

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

  // build mapping index for detected list
  const formFieldNameMap:Record<string,string>={};formFields.forEach(f=>formFieldNameMap[f.id]=f.name);
  const mappingByPdfField:Record<string,string[]>={};
  Object.entries(pdfFieldLinks).forEach(([pdfFieldId,formIds])=>{
    mappingByPdfField[pdfFieldId]=formIds.map(fid=>formFieldNameMap[fid]||fid);
  });
  const mappedFieldIds = new Set<string>(Object.keys(pdfFieldLinks));

  // Build mapping details for panel
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

  return (
    <div className="flex gap-4">
      {/* left preview column */}
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        {/* top menu placeholder */}
        <div className="flex items-center gap-4 bg-slate-100/90 px-3 py-2 rounded shadow">
          <Button size="sm" variant="outline">Add Section</Button>
          <Button size="sm" variant="outline">Add Text</Button>
          <Button size="sm" variant="outline">Add Image</Button>
        </div>
        <div className="relative flex-1 overflow-auto border rounded bg-white">
          <FormPreview />
        </div>
      </div>

      <FieldListPanel
        pdf={pdf}
        selectedFieldId={selectedFieldId}
        onSelect={(f)=>setSelectedFieldId(f.id)}
        onRename={()=>{}}
        onChangeType={()=>{}}
        onDelete={()=>{}}
        addMode={false}
        onToggleAddMode={()=>{}}
        currentPage={1}
        errorFieldId={errorFieldId}
        onCheckboxToggle={handleCheckboxToggle}
        selectedForMapping={selectedForMapping}
        mappedFieldIds={mappedFieldIds}
        mappingByPdfField={mappingByPdfField}
        formFields={formFields}
        onMapField={()=>{}}
        onShowError={()=>{}}
        onShowConfirmation={()=>{}}
        currentPageFields={pdf?.formFields.filter(f => f.pageNumber === 1).length || 0}
        totalFields={pdf?.formFields.length || 0}
      />

      <FormFieldsPanel
        formFields={formFields}
        onAddField={addNewFormField}
        onRename={renameFormField}
        onDelete={deleteFormField}
        onUpdateField={(id,updates)=>updateFormField(id,updates)}
        mappings={formFieldMappings}
        onMapSelected={handleMapSelected}
        onUnmap={handleUnmap}
        selectedForMapping={new Set()}
        onCheckboxToggle={()=>{}}
        onShowConfirmation={()=>{}}
      />
    </div>
  );
};

export default BuildFormStep; 