"use client";

import React, { useState, useRef, useEffect } from "react";
import { PDFDocument, PDFFormField } from "../../types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Trash, ChevronDown, ChevronRight, Pencil, MoreHorizontal, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";

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
  onMapField?: (pdfFieldId: string, formFieldId: string) => void;
  formFields?: any[];
  onShowError?: (message: string) => void;
  onShowConfirmation?: (title: string, message: string, onConfirm: () => void) => void;
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
  onMapField,
  formFields = [],
  onShowError,
  onShowConfirmation,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");
  const [expanded,setExpanded]=useState<Record<string,boolean>>({});
  const [withSelectedOpen, setWithSelectedOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<string | null>(null);
  const [typeChangeConfirmOpen, setTypeChangeConfirmOpen] = useState(false);
  const [pendingTypeChange, setPendingTypeChange] = useState<{fieldId: string, newType: PDFFormField["type"]} | null>(null);
  const withSelectedRef = useRef<HTMLDivElement>(null);

  const startRename = (field: PDFFormField) => {
    setEditingId(field.id);
    setTempName(field.name);
  };

  const commitRename = (fieldId: string) => {
    if (tempName.trim() && onRename) onRename(fieldId, tempName.trim());
    setEditingId(null);
    setTempName("");
  };

  const handleDeleteClick = (fieldId: string) => {
    setFieldToDelete(fieldId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (fieldToDelete && onDelete) {
      onDelete(fieldToDelete);
    }
    setDeleteConfirmOpen(false);
    setFieldToDelete(null);
  };

  const handleTypeChange = (fieldId: string, newType: PDFFormField["type"]) => {
    // Check if this field has mappings
    const hasMappings = mappingByPdfField[fieldId] && mappingByPdfField[fieldId].length > 0;
    
    if (hasMappings) {
      setPendingTypeChange({ fieldId, newType });
      setTypeChangeConfirmOpen(true);
    } else {
      onChangeType?.(fieldId, newType);
    }
  };

  const confirmTypeChange = () => {
    if (pendingTypeChange && onChangeType) {
      onChangeType(pendingTypeChange.fieldId, pendingTypeChange.newType);
    }
    setTypeChangeConfirmOpen(false);
    setPendingTypeChange(null);
  };

  const handleMapField = (pdfFieldId: string, formFieldId: string) => {
    const pdfField = pdf.formFields.find(f => f.id === pdfFieldId);
    const formField = formFields.find(f => f.id === formFieldId);
    
    if (pdfField && formField && pdfField.type !== formField.type) {
      onShowError?.(`Cannot map fields of different types: ${pdfField.type} and ${formField.type}`);
      return;
    }
    
    onMapField?.(pdfFieldId, formFieldId);
  };

  const handleDeleteSelected = () => {
    const selectedFields = Array.from(selectedForMapping);
    if (selectedFields.length === 0) return;
    
    onShowConfirmation?.(
      "Delete Selected Fields",
      `Are you sure you want to delete ${selectedFields.length} selected field(s)?`,
      () => {
        selectedFields.forEach(fieldId => onDelete?.(fieldId));
      }
    );
    setWithSelectedOpen(false);
  };

  const selectedCount = selectedForMapping.size;

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (withSelectedRef.current && !withSelectedRef.current.contains(event.target as Node)) {
        setWithSelectedOpen(false);
      }
    };

    if (withSelectedOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [withSelectedOpen]);

  return (
    <div className="flex-none w-full lg:w-80 min-w-64 max-w-96 border-l bg-gray-50 rounded-r-lg rounded-l-lg flex flex-col overflow-hidden">
      <div className="p-1 sm:p-2 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-2 whitespace-nowrap">
          <div className="flex flex-col">
            <h3 className="font-semibold text-base">Detected Fields</h3>
            <span className="text-[0.8rem] text-gray-600 font-normal">{pdf.formFields.length} fields</span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Button size="sm" variant={addMode?"secondary":"outline"} onClick={onToggleAddMode}>
              {addMode?"Drawing… (esc)":"+ Add Field"}
            </Button>
            <div className="relative" ref={withSelectedRef}>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => selectedCount > 0 && setWithSelectedOpen(!withSelectedOpen)}
                className={`text-xs ${selectedCount === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={selectedCount === 0}
              >
                With Selected ({selectedCount})
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
              {withSelectedOpen && selectedCount > 0 && (
                <div className="absolute top-full right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <button
                    onClick={handleDeleteSelected}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-red-50 text-red-600 flex items-center gap-1"
                  >
                    <Trash className="h-3 w-3" />
                    Delete Selected
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-y-scroll flex-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 min-h-0" onWheel={(e) => e.stopPropagation()}>
        <div className="p-1 sm:p-2 space-y-3">
          {/* Render fields for current page (flat) */}
          {pdf.formFields.filter(f=>f.pageNumber===currentPage).map((field) => {
        const isSelected = field.id === selectedFieldId;
        const isEditing = field.id === editingId;
        return (
          <div
            key={field.id}
            className={`border rounded-md overflow-hidden ${isSelected ? "bg-blue-100 border-blue-500 shadow-md" : errorFieldId===field.id?"bg-red-100 border-red-300":"bg-gray-50"} cursor-pointer`}
            onClick={() => onSelect?.(field)}
          >
            <div className="flex items-stretch">
              {/* Checkbox strip with caret */}
              <div className={`flex flex-col items-center justify-center w-8 border-r border-gray-300 ${mappedFieldIds.has(field.id)?'bg-blue-600':'bg-gray-200'} gap-3`}>
                <input type="checkbox" className="h-4 w-4 text-blue-600" checked={selectedForMapping.has(field.id)} onChange={(e)=>onCheckboxToggle(field.id,e.target.checked)} />
                <button className={`h-4 w-4 flex items-center justify-center ${mappedFieldIds.has(field.id)?'text-white':'text-gray-400'}`} onClick={(e)=>{if(mappedFieldIds.has(field.id)) setExpanded(prev=>({...prev,[field.id]:!prev[field.id]}))}}>
                  {expanded[field.id]?<ChevronDown className="h-4 w-4"/>:<ChevronRight className="h-4 w-4"/>}
                </button>
              </div>

              {/* Main content */}
              <div
                className="flex flex-col flex-1 p-2 min-w-0 justify-center"
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
                  onValueChange={(val) => handleTypeChange(field.id, val as PDFFormField["type"])}
                >
                  <SelectTrigger className="h-7 text-xs w-full">
                    <SelectValue placeholder="Type">
                      {field.type ? field.type.charAt(0).toUpperCase() + field.type.slice(1) : "Type"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "text","textarea","email","number","date","time","datetime-local",
                      "select","checkbox","radio","signature","file","password","tel",
                      "url","search","color","range","hidden","image"
                    ].map((t)=>(
                      <SelectItem key={t} value={t} className="capitalize text-xs">{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Delete button */}
              <button
                className="bg-red-500 hover:bg-red-600 text-white flex items-center justify-center w-8 border-l border-red-600"
                onClick={() => handleDeleteClick(field.id)}
              >
                <Trash className="h-4 w-4" />
              </button>
            </div>
            
            {/* Expanded view - consistent with FormFieldsPanel */}
            {expanded[field.id] && (
              <div className="p-2 text-xs space-y-1 bg-white">
                <p className="font-semibold text-[0.7rem] text-gray-600">Mappings</p>
                {mappingByPdfField[field.id] && mappingByPdfField[field.id].length > 0 ? (
                  mappingByPdfField[field.id].map((fid, i) => (
                    <div key={i} className={`${i%2===0?'bg-gray-50':'bg-gray-100'} px-1 py-0.5 rounded flex items-center justify-between`}>
                      <span>{fid}</span>
                      <button 
                        onClick={() => {/* Add unmapping logic */}}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="italic text-gray-400">No mapped fields</p>
                )}
              </div>
            )}
          </div>
        );
          })}

          {/* no page grouping now */}
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Field</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this field? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={typeChangeConfirmOpen} onOpenChange={setTypeChangeConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Type Change Warning</DialogTitle>
            <DialogDescription>
              This field has existing mappings. Changing the type will break these mappings. Do you want to continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTypeChangeConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmTypeChange}>
              Change Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FieldListPanel; 