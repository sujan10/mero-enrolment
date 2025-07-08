"use client";
import React,{useRef} from "react";
import { PDFDocument } from "../../types";

interface Props{
  documents: PDFDocument[];
  activeId:string;
  onSelect:(doc:PDFDocument)=>void;
}

const DocumentCarousel:React.FC<Props>=({documents,activeId,onSelect})=>{
  const ref=useRef<HTMLDivElement>(null);
  return (
    <div className="flex items-center gap-2 mb-3 w-full">
      <button onClick={()=>ref.current?.scrollBy({left:-150,behavior:'smooth'})} className="px-2 py-1 bg-gray-200 rounded">◀</button>
      <div ref={ref} className="flex-1 overflow-x-auto no-scrollbar flex gap-2">
        {documents.map(doc=> (
          <button key={doc.id} onClick={()=>onSelect(doc)} className={`px-3 py-1 rounded border flex-shrink-0 max-w-[160px] truncate ${doc.id===activeId?'bg-blue-500 text-white border-blue-500':'bg-white border-gray-300'}`}>{doc.name}</button>
        ))}
      </div>
      <button onClick={()=>ref.current?.scrollBy({left:150,behavior:'smooth'})} className="px-2 py-1 bg-gray-200 rounded">▶</button>
    </div>
  );
};
export default DocumentCarousel; 