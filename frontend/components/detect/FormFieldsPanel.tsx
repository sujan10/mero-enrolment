import React,{useState} from "react";
import { PDFFormField, FormField, FormFieldType } from "../../types";
import { Button } from "../ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select";
import { Input } from "../ui/input";
import { ChevronDown, ChevronRight, Trash, Link2, X, Plus, GripVertical } from "lucide-react";

interface MappedDetail {
  pdfFieldId:string;
  pdfName:string;
  pageNumber:number;
  fieldName:string;
}

interface FormFieldsPanelProps {
  formFields: FormField[];
  onAddField: (type: FormFieldType)=>void;
  onRename:(id:string,newName:string)=>void;
  onDelete:(id:string)=>void;
  onUpdateField:(id:string,updates:Partial<FormField>)=>void;
  mappings: Record<string,MappedDetail[]>; // key by formFieldId
  onMapSelected:(formFieldId:string)=>void;
  onUnmap:(formFieldId:string,pdfFieldId:string)=>void;
}

const FormFieldsPanel:React.FC<FormFieldsPanelProps>=({formFields,onAddField,onRename,onDelete,onUpdateField,mappings,onMapSelected,onUnmap})=>{
  const [expanded,setExpanded]=useState<Record<string,boolean>>({});
  const [editingId,setEditingId]=useState<string|null>(null);
  const [tempName,setTempName]=useState("");

  const startEdit=(f:FormField)=>{setEditingId(f.id);setTempName(f.name)};
  const commit= (id:string)=>{onRename(id,tempName.trim()||"field");setEditingId(null);};

  const addOption = (f:FormField)=>{
    const newOpt = `Option ${(f.options?.length||0)+1}`;
    onUpdateField(f.id,{options:[...(f.options||[]),newOpt]});
  };

  const renameOption = (f:FormField,optIdx:number,newVal:string)=>{
    const newOptions=[...(f.options||[])];
    newOptions[optIdx]=newVal;
    onUpdateField(f.id,{options:newOptions});
  };

  return (
    <div className="flex-none space-y-3 w-[19.4rem] p-4 border-l bg-gray-50 overflow-y-auto max-h-screen">
      <div className="flex items-center justify-between mb-2 whitespace-nowrap">
        <div className="flex flex-col">
          <h3 className="font-semibold text-base">Form Fields</h3>
          <span className="text-[0.8rem] text-gray-600 font-normal">{formFields.length} items</span>
        </div>
        <Select onValueChange={(val)=>onAddField(val as FormFieldType)}>
          <SelectTrigger className="w-[9rem] h-8 text-xs">
            <SelectValue placeholder="+ Add Field" />
          </SelectTrigger>
          <SelectContent>
            {['text','textarea','email','number','date','select','checkbox','radio','signature'].map(t=> (
              <SelectItem key={t} value={t} className="capitalize text-xs">{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {formFields.map(ff=>{
        const isEditing=ff.id===editingId;
        const isExp=expanded[ff.id];
        return (
          <div key={ff.id} className="border rounded-md overflow-hidden bg-gray-50">
            <div className="flex items-stretch">
              <button className="w-8 flex items-center justify-center border-r" onClick={()=>setExpanded(prev=>({...prev,[ff.id]:!prev[ff.id]}))}>
                {isExp? <ChevronDown className="h-4 w-4"/>:<ChevronRight className="h-4 w-4"/>}
              </button>
              <div className="flex-1 p-3 min-w-0 flex items-center" onDoubleClick={()=>startEdit(ff)}>
                {isEditing? <Input value={tempName} onChange={e=>setTempName(e.target.value)} onBlur={()=>commit(ff.id)} onKeyDown={e=>{if(e.key==='Enter')commit(ff.id)}} className="h-7 text-xs" autoFocus/> : <p className="truncate text-xs font-medium">{ff.name}</p>}
              </div>
              <button className="w-8 flex items-center justify-center text-blue-600 hover:text-blue-800 self-stretch border-l border-blue-200" onClick={()=>onMapSelected(ff.id)}>
                <Link2 className="h-4 w-4" />
              </button>
              <button className="w-8 bg-red-500 hover:bg-red-600 text-white flex items-center justify-center self-stretch border-l border-red-600" onClick={()=>onDelete(ff.id)}>
                <Trash className="h-4 w-4" />
              </button>
            </div>
            {isExp && (
              <div className="p-2 text-xs space-y-1 bg-white">

                {/* For radio/checkbox show option editor */}
                {['radio','checkbox'].includes(ff.type) && (
                  <div className="mb-2 space-y-1">
                    <p className="font-semibold text-[0.7rem] text-gray-600">Options</p>
                    {(ff.options||[]).map((opt,idx)=>(
                      <div key={idx} className="flex items-center gap-1 px-1 py-0.5 bg-gray-50 rounded">
                        <GripVertical className="h-3 w-3 text-gray-400" />
                        <Input value={opt} onChange={e=>renameOption(ff,idx,e.target.value)} className="h-6 text-[0.7rem]" />
                      </div>
                    ))}
                    <Button variant="outline" size="xs" className="h-6 text-[0.65rem]" onClick={()=>addOption(ff)}>
                      <Plus className="h-3 w-3 mr-1"/> Add Option
                    </Button>
                  </div>
                )}

                <p className="font-semibold text-[0.7rem] text-gray-600">Mappings</p>
                {mappings[ff.id]?.length? mappings[ff.id].map((m,i)=>(
                  <div key={i} className={`flex items-center justify-between ${i%2===0?'bg-gray-50':'bg-gray-100'} px-1 py-0.5 rounded`}>
                    <span>{m.pdfName} - p{m.pageNumber}: {m.fieldName}</span>
                    <button onClick={()=>onUnmap(ff.id,m.pdfFieldId)}><X className="h-3 w-3 text-gray-500 hover:text-red-500"/></button>
                  </div>
                )):<p className="italic text-gray-400">No mapped fields</p>}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
};

export default FormFieldsPanel; 