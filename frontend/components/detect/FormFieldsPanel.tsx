import React,{useState, useRef, useEffect} from "react";
import { PDFFormField, FormField, FormFieldType } from "../../types";
import { Button } from "../ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select";
import { Input } from "../ui/input";
import { ChevronDown, ChevronRight, Trash, Link2, X, Plus, GripVertical, MoreHorizontal, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";

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
  selectedForMapping?: Set<string>;
  onCheckboxToggle?: (fieldId:string, checked:boolean)=>void;
  onShowConfirmation?: (title: string, message: string, onConfirm: () => void) => void;
}

const FormFieldsPanel:React.FC<FormFieldsPanelProps>=({formFields,onAddField,onRename,onDelete,onUpdateField,mappings,onMapSelected,onUnmap,selectedForMapping=new Set(),onCheckboxToggle,onShowConfirmation})=>{
  const [expanded,setExpanded]=useState<Record<string,boolean>>({});
  const [editingId,setEditingId]=useState<string|null>(null);
  const [tempName,setTempName]=useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [rippleEffect, setRippleEffect] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [withSelectedOpen, setWithSelectedOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<string | null>(null);
  const [typeChangeConfirmOpen, setTypeChangeConfirmOpen] = useState(false);
  const [pendingTypeChange, setPendingTypeChange] = useState<{fieldId: string, newType: FormFieldType} | null>(null);
  const withSelectedRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

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

  const handleTypeChange = (fieldId: string, newType: FormFieldType) => {
    // Check if this field has mappings
    const hasMappings = mappings[fieldId] && mappings[fieldId].length > 0;
    
    if (hasMappings) {
      setPendingTypeChange({ fieldId, newType });
      setTypeChangeConfirmOpen(true);
    } else {
      onUpdateField(fieldId, { type: newType });
    }
  };

  const confirmTypeChange = () => {
    if (pendingTypeChange) {
      // Remove all mappings for this field since type is changing
      mappings[pendingTypeChange.fieldId]?.forEach(mapping => {
        onUnmap(pendingTypeChange.fieldId, mapping.pdfFieldId);
      });
      onUpdateField(pendingTypeChange.fieldId, { type: pendingTypeChange.newType });
    }
    setTypeChangeConfirmOpen(false);
    setPendingTypeChange(null);
  };

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleOptionClick = (fieldType: FormFieldType) => {
    onAddField(fieldType);
    setRippleEffect(fieldType);
    setTimeout(() => setRippleEffect(null), 600);
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

  // Filter form fields based on search term and type filter
  const filteredFormFields = formFields.filter(field => {
    const matchesSearch = field.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || field.type === filterType;
    return matchesSearch && matchesType;
  });

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
            <h3 className="font-semibold text-base">Form Fields</h3>
            <span className="text-[0.8rem] text-gray-600 font-normal">{formFields.length} items</span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="relative" ref={dropdownRef}>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setDropdownOpen(!dropdownOpen)} 
                className="flex items-center gap-1"
              >
                Add Field
                <ChevronDown className="h-3 w-3" />
              </Button>
              
              {dropdownOpen && (
                <div className="absolute top-full right-0 mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50 flex flex-col">
                  {[
                    'text', 'textarea', 'email', 'number', 'date', 'time', 'datetime-local',
                    'select', 'checkbox', 'radio', 'signature', 'file', 'password', 'tel',
                    'url', 'search', 'color', 'range', 'hidden', 'image'
                  ].map((fieldType) => (
                    <button
                      key={fieldType}
                      onClick={() => handleOptionClick(fieldType as FormFieldType)}
                      className={`w-full px-3 py-2 text-left text-xs hover:bg-gray-100 transition-colors relative overflow-hidden ${
                        rippleEffect === fieldType ? 'animate-pulse' : ''
                      }`}
                    >
                      <span className="capitalize">{fieldType.charAt(0).toUpperCase() + fieldType.slice(1)}</span>
                      {rippleEffect === fieldType && (
                        <div className="absolute inset-0 bg-blue-200 opacity-50 animate-ping"></div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
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

      {/* Search Bar */}
      <div className="p-2 border-b border-gray-200">
        <div className="flex gap-2">
          <Input
            placeholder="Search fields..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 h-8 text-xs"
          />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-8 w-24 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {[
                'text', 'textarea', 'email', 'number', 'date', 'time', 'datetime-local',
                'select', 'checkbox', 'radio', 'signature', 'file', 'password', 'tel',
                'url', 'search', 'color', 'range', 'hidden', 'image'
              ].map((type) => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-y-scroll flex-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 min-h-0" onWheel={(e) => e.stopPropagation()}>
        <div className="p-1 sm:p-2 space-y-3">
          {filteredFormFields.map(ff=>{
        const isEditing=ff.id===editingId;
        const isExp=expanded[ff.id];
        return (
          <div key={ff.id} className="border rounded-md overflow-hidden bg-gray-50">
            <div className="flex items-stretch">
              {onCheckboxToggle && (
                <div className={`flex flex-col items-center justify-center w-8 border-r border-gray-300 ${mappings[ff.id] && mappings[ff.id].length > 0 ? 'bg-blue-600' : 'bg-gray-200'} gap-3`}>
                  <input 
                    type="checkbox" 
                    className="h-4 w-4 text-blue-600" 
                    checked={selectedForMapping.has(ff.id)} 
                    onChange={(e)=>onCheckboxToggle(ff.id,e.target.checked)} 
                  />
                  <button className={`h-4 w-4 flex items-center justify-center ${mappings[ff.id] && mappings[ff.id].length > 0 ? 'text-white' : 'text-gray-400'}`} onClick={()=>setExpanded(prev=>({...prev,[ff.id]:!prev[ff.id]}))}>
                    {isExp? <ChevronDown className="h-4 w-4"/>:<ChevronRight className="h-4 w-4"/>}
                  </button>
                </div>
              )}
              <div className="flex flex-col flex-1 p-2 cursor-pointer min-w-0" onDoubleClick={()=>startEdit(ff)}>
                {isEditing ? (
                  <Input 
                    value={tempName} 
                    onChange={e=>setTempName(e.target.value)} 
                    onBlur={()=>commit(ff.id)} 
                    onKeyDown={e=>{if(e.key==='Enter')commit(ff.id)}} 
                    className="h-7 text-xs mb-1" 
                    autoFocus
                  />
                ) : (
                  <div className="border rounded h-7 flex items-center px-2 mb-1 text-xs bg-white w-full">
                    <span className="truncate flex-1 min-w-0">{ff.name}</span>
                    <Pencil className="h-3 w-3 ml-1 text-gray-400 shrink-0" />
                  </div>
                )}
                {/* Type selector */}
                <Select
                  value={ff.type}
                  onValueChange={(val) => handleTypeChange(ff.id, val as FormFieldType)}
                >
                  <SelectTrigger className="h-7 text-xs w-full">
                    <SelectValue placeholder="Type">
                      {ff.type ? ff.type.charAt(0).toUpperCase() + ff.type.slice(1) : "Type"}
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
              <button className="w-8 flex items-center justify-center text-blue-600 hover:text-blue-800 self-stretch border-l border-blue-200" onClick={()=>onMapSelected(ff.id)}>
                <Link2 className="h-4 w-4" />
              </button>
              <button className="w-8 bg-red-500 hover:bg-red-600 text-white flex items-center justify-center self-stretch border-l border-red-600" onClick={()=>handleDeleteClick(ff.id)}>
                <Trash className="h-4 w-4" />
              </button>
            </div>
            {isExp && (
              <div className="p-2 text-xs space-y-1 bg-white">
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
  )
};

export default FormFieldsPanel; 