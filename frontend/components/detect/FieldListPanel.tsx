"use client";

import React, { useState } from "react";
import { PDFDocument, PDFFormField } from "../../types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Trash, ChevronDown, ChevronRight, Pencil } from "lucide-react";

interface FieldListPanelProps {
  pdf: PDFDocument;
  selectedFieldId?: string | null;
  onSelect?: (field: PDFFormField) => void;
  onRename?: (fieldId: string, newName: string) => void;
  onChangeType?: (fieldId: string, newType: PDFFormField["type"]) => void;
  onDelete?: (fieldId: string) => void;
  addMode: boolean;
  onToggleAddMode: () => void;
  currentPage: number;
  errorFieldId?: string | null;
  onCheckboxToggle: (fieldId:string, checked:boolean)=>void;
  selectedForMapping: Set<string>;
  mappedFieldIds: Set<string>;
  mappingByPdfField: Record<string,string[]>;
}

const FieldListPanel: React.FC<FieldListPanelProps> = ({
  pdf,
  selectedFieldId,
  onSelect,
  onRename,
  onChangeType,
  onDelete,
  addMode,
  onToggleAddMode,
  currentPage,
  errorFieldId,
  onCheckboxToggle,
  selectedForMapping,
  mappedFieldIds,
  mappingByPdfField,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");
  const [expanded,setExpanded]=useState<Record<string,boolean>>({});

  // expose addMode through prop callback? we'll lift later

  const startRename = (field: PDFFormField) => {
    setEditingId(field.id);
    setTempName(field.name);
  };

  const commitRename = (fieldId: string) => {
    if (tempName.trim() && onRename) onRename(fieldId, tempName.trim());
    setEditingId(null);
    setTempName("");
  };

  return (
    <div className="flex-none space-y-3 w-[19.4rem] p-4 border-l bg-gray-50 overflow-y-auto max-h-screen">
      <div className="flex items-center justify-between mb-2 whitespace-nowrap">
        <div className="flex flex-col">
          <h3 className="font-semibold text-base">Detected Fields</h3>
          <span className="text-[0.8rem] text-gray-600 font-normal">{pdf.formFields.length} fields</span>
        </div>
        <Button size="sm" variant={addMode?"secondary":"outline"} onClick={onToggleAddMode}>
          {addMode?"Drawing… (esc)":"+ Add Field"}
        </Button>
      </div>

      {/* Render fields for current page (flat) */}
      {pdf.formFields.filter(f=>f.pageNumber===currentPage).map((field) => {
        const isSelected = field.id === selectedFieldId;
        const isEditing = field.id === editingId;
        return (
          <div
            key={field.id}
            className={`border rounded-md flex overflow-hidden ${isSelected ? "bg-blue-50 border-blue-300" : errorFieldId===field.id?"bg-red-100 border-red-300":"bg-gray-50"}`}
            style={{width:'100%'}}
          >
            {/* Checkbox strip with caret */}
            <div className={`flex flex-col items-center justify-start w-8 border-r border-gray-300 ${mappedFieldIds.has(field.id)?'bg-blue-600':'bg-gray-200'}`}>
              <input type="checkbox" className="h-4 w-4 mt-1 text-blue-600" checked={selectedForMapping.has(field.id)} onChange={(e)=>onCheckboxToggle(field.id,e.target.checked)} />
              <button className={`mt-0.5 ${mappedFieldIds.has(field.id)?'text-white':'text-gray-400 cursor-not-allowed'}`} disabled={!mappedFieldIds.has(field.id)} onClick={(e)=>{e.stopPropagation();if(mappedFieldIds.has(field.id)) setExpanded(prev=>({...prev,[field.id]:!prev[field.id]}))}}>
                {expanded[field.id]?<ChevronDown className="h-3 w-3"/>:<ChevronRight className="h-3 w-3"/>}
              </button>
            </div>

            {/* Main content */}
            <div
              className="flex flex-col flex-1 p-2 cursor-pointer min-w-0"
              onClick={() => onSelect?.(field)}
              onDoubleClick={() => startRename(field)}
            >
              {/* Name */}
              {isEditing ? (
                <Input
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onBlur={() => commitRename(field.id)}
                  onKeyDown={(e)=>{if(e.key==='Enter') commitRename(field.id)}}
                  className="h-7 text-xs mb-1"
                  autoFocus
                />
              ) : (
                <div className="border rounded h-7 flex items-center px-2 mb-1 text-xs bg-white w-full">
                  <span className="truncate flex-1 min-w-0">{field.name}</span>
                  <Pencil className="h-3 w-3 ml-1 text-gray-400 shrink-0" />
                </div>
              )}
              {/* Type selector */}
              <Select
                value={field.type}
                onValueChange={(val) => onChangeType?.(field.id, val as PDFFormField["type"])}
              >
                <SelectTrigger className="h-7 text-xs w-full">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {["text","checkbox","radio","signature","date","select"].map((t)=>(
                    <SelectItem key={t} value={t} className="capitalize text-xs">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Delete button */}
            <button
              className="bg-red-500 hover:bg-red-600 text-white flex items-center justify-center w-8 border-l border-red-600"
              onClick={() => onDelete?.(field.id)}
            >
              <Trash className="h-4 w-4" />
            </button>
            {expanded[field.id] && mappingByPdfField[field.id] && (
              <div className="w-full text-xs bg-white p-1 space-y-0.5">
                {mappingByPdfField[field.id].map((fid,i)=>(<p key={i} className={`${i%2===0?'bg-gray-50':'bg-gray-100'} px-1 rounded`}>{fid}</p>))}
              </div>
            )}
          </div>
        );
      })}

      {/* no page grouping now */}
 
    </div>
  );
};

export default FieldListPanel; 