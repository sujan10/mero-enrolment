"use client";

import React, { useEffect, useState, useRef } from "react";
import { PDFDocument, PDFFormField } from "../../types";
import { Button } from "@/components/ui/button";

// react-pdf dynamic imports (so pdfjs loads only on client)
let Document: any = null;
let Page: any = null;
let pdfjs: any = null;

interface PdfFieldViewerProps {
  pdf: PDFDocument;
  selectedFieldId?: string | null;
  onFieldSelect?: (field: PDFFormField) => void;
  pageIndex: number; // zero-based
  onPageChange: (newIndex: number) => void;
  zoom: number; // 1 = 100%
  onZoomChange: (z: number) => void;
  pageWidth?: number; // width at zoom=1
  drawingMode?: boolean; // if true, allow drawing new field
  onAddField?: (newField: PDFFormField) => void;
  onMoveField?: (fieldId: string, newX: number, newY: number) => void;
  onResizeField?: (fieldId: string, newW:number,newH:number)=>void;
}

const PdfFieldViewer: React.FC<PdfFieldViewerProps> = ({
  pdf,
  selectedFieldId,
  onFieldSelect,
  pageIndex,
  onPageChange,
  zoom,
  onZoomChange,
  pageWidth = 600,
  drawingMode = false,
  onAddField,
  onMoveField,
  onResizeField,
}) => {
  const [isClient, setIsClient] = useState(false);

  // drawing state
  const [dragStart, setDragStart] = useState<{x:number;y:number}|null>(null);
  const [dragRect, setDragRect] = useState<{left:number;top:number;width:number;height:number}|null>(null);
  const [draggingFieldId, setDraggingFieldId] = useState<string|null>(null);
  const [dragOffset, setDragOffset] = useState<{dx:number;dy:number}>({dx:0,dy:0});
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Add state after draggingFieldId
  const [resizingFieldId,setResizingFieldId]=useState<string|null>(null);
  const [resizeStart,setResizeStart]=useState<{w:number;h:number;clientX:number;clientY:number}>();

  useEffect(() => {
    const load = async () => {
      try {
        const reactPdf = await import("react-pdf");
        Document = reactPdf.Document;
        Page = reactPdf.Page;
        pdfjs = reactPdf.pdfjs;
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
        setIsClient(true);
      } catch (err) {
        console.error("Failed to load react-pdf", err);
      }
    };
    load();
  }, []);

  useEffect(()=>{
    if(!draggingFieldId) return;
    const handleMove=(e:MouseEvent)=>{
      if(!draggingFieldId) return;
      const wrapperBounds=wrapperRef.current?.getBoundingClientRect();
      if(!wrapperBounds) return;
      const pg=pdf.pages[pageIndex];
      const scale=(pageWidth*zoom)/pg.width;
      const newLeft=e.clientX-wrapperBounds.left-dragOffset.dx;
      const newTop=e.clientY-wrapperBounds.top-dragOffset.dy;
      const pdfX=newLeft/scale;
      const pdfY= (pg.height||pageWidth*1.3) - (newTop+ (pg.formFields.find(f=>f.id===draggingFieldId)?.height||0))/scale;
      onMoveField?.(draggingFieldId,pdfX,pdfY);
    };
    const stop=()=>setDraggingFieldId(null);
    window.addEventListener('mousemove',handleMove);
    window.addEventListener('mouseup',stop);
    return ()=>{
      window.removeEventListener('mousemove',handleMove);
      window.removeEventListener('mouseup',stop);
    }
  },[draggingFieldId,dragOffset,zoom,pageWidth,pageIndex]);

  useEffect(()=>{
    if(!resizingFieldId) return;
    const handleMove=(e:MouseEvent)=>{
      if(!resizingFieldId||!resizeStart) return;
      const pg=pdf.pages[pageIndex];
      const scale=(pageWidth*zoom)/ (pg.width||pageWidth);
      const dx=(e.clientX-resizeStart.clientX)/scale;
      const dy=(e.clientY-resizeStart.clientY)/scale;
      const newW=Math.max(5,resizeStart.w+dx);
      const newH=Math.max(5,resizeStart.h+dy);
      // call resize callback
      onResizeField?.(resizingFieldId,newW,newH);
    };
    const stop=()=>setResizingFieldId(null);
    window.addEventListener('mousemove',handleMove);
    window.addEventListener('mouseup',stop);
    return ()=>{
      window.removeEventListener('mousemove',handleMove);
      window.removeEventListener('mouseup',stop);
    };
  },[resizingFieldId,resizeStart,zoom,pageWidth,pageIndex]);

  if (!isClient) return null;

  return (
    <div className="space-y-8">

      <Document file={pdf.file} loading={<p>Loading PDF…</p>}>
        {(() => {
          const pg = pdf.pages[pageIndex] || pdf.pages[0];
          if(!pg) return null;
          const scaledWidth = pageWidth * zoom;
          const baseWidth = pg.width || pageWidth; // fallback
          const baseHeight = pg.height || (pageWidth * 1.3);
          const scale = scaledWidth / baseWidth;
          return (
            <div
              ref={wrapperRef}
              key={pg.pageNumber}
              className="relative mx-auto select-none"
              style={{ width: scaledWidth }}
              onMouseDown={(e)=>{
                if(!drawingMode) return;
                const bounds=(e.currentTarget as HTMLDivElement).getBoundingClientRect();
                setDragStart({x:e.clientX-bounds.left,y:e.clientY-bounds.top});
              }}
              onMouseMove={(e)=>{
                if(!drawingMode || !dragStart) return;
                const bounds=(e.currentTarget as HTMLDivElement).getBoundingClientRect();
                const x=e.clientX-bounds.left;
                const y=e.clientY-bounds.top;
                setDragRect({
                  left: Math.min(dragStart.x,x),
                  top: Math.min(dragStart.y,y),
                  width: Math.abs(x-dragStart.x),
                  height: Math.abs(y-dragStart.y)
                });
              }}
              onMouseUp={(e)=>{
                if(!drawingMode || !dragStart || !dragRect) {setDragStart(null);setDragRect(null);return;}
                const bounds=(e.currentTarget as HTMLDivElement).getBoundingClientRect();
                const scaleInv = baseWidth / pageWidth;
                // convert to PDF coords (bottom-left origin)
                const pdfX = dragRect.left * scaleInv;
                const pdfY = baseHeight - (dragRect.top + dragRect.height) * scaleInv;
                const pdfW = dragRect.width * scaleInv;
                const pdfH = dragRect.height * scaleInv;
                if (pdfW > 5 && pdfH > 5) {
                  const newField: PDFFormField = {
                    id: `field_${Date.now().toString(36)}`,
                    name: '',
                    type: 'text',
                    x: pdfX,
                    y: pdfY,
                    width: pdfW,
                    height: pdfH,
                    pageNumber: pg.pageNumber,
                  };
                  onAddField?.(newField);
                }
                setDragStart(null);
                setDragRect(null);
              }}
            >
              <Page
                pageNumber={pg.pageNumber}
                width={scaledWidth}
                loading={<div className="text-center py-4">Loading page…</div>}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
              {/* overlays same calc but using scale */}
              {pg.formFields.map((field) => {
                const left = field.x * scale;
                const top = (baseHeight - field.y - field.height) * scale;
                const width = field.width * scale;
                const height = field.height * scale;
                const isSelected = selectedFieldId === field.id;
                return (
                  <div
                    key={field.id}
                    className={`absolute border-2 rounded-sm ${isSelected?"border-blue-500 bg-blue-200/20 cursor-move":"border-red-500 bg-red-200/10 cursor-pointer"}`}
                    style={{left,top,width,height}}
                    onClick={(e)=>{e.stopPropagation();onFieldSelect?.(field);}}
                    onMouseDown={(e)=>{
                      e.stopPropagation();
                      onFieldSelect?.(field);
                      const wrapperBounds=wrapperRef.current?.getBoundingClientRect();
                      if(!wrapperBounds) return;
                      const offsetX=e.clientX-wrapperBounds.left-left;
                      const offsetY=e.clientY-wrapperBounds.top-top;
                      setDraggingFieldId(field.id);
                      setDragOffset({dx:offsetX,dy:offsetY});
                    }}
                  >
                    {isSelected && (
                      <div
                        className="absolute w-2 h-2 bg-blue-500 bottom-0 right-0 cursor-se-resize"
                        onMouseDown={(e)=>{
                          e.stopPropagation();
                          const wrapperBounds=wrapperRef.current?.getBoundingClientRect();
                          if(!wrapperBounds) return;
                          setResizingFieldId(field.id);
                          setResizeStart({w:field.width,h:field.height,clientX:e.clientX,clientY:e.clientY});
                        }}
                      />
                    )}
                  </div>
                );
              })}
              {/* preview rect ... keep logic uses dragRect*/}
              {drawingMode && pg.pageNumber===1 && dragRect && (
                <div
                  className="absolute border-2 border-green-500 bg-green-200/20 pointer-events-none"
                  style={dragRect}
                />
              )}
            </div>
          );
        })()}
      </Document>
    </div>
  );
};

export default PdfFieldViewer; 