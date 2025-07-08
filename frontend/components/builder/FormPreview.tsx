"use client";
import React from "react";
import { useAppStore } from "../../lib/store";

const FormPreview: React.FC = () => {
  const { formFields } = useAppStore();
  return (
    <div className="p-4 space-y-4">
      {formFields.length===0 && <p className="text-gray-500 text-sm">No form fields yet. Add fields on the right.</p>}
      {formFields.map(f=> (
        <div key={f.id} className="flex flex-col gap-1">
          <label className="text-sm font-medium capitalize">{f.label || f.name}</label>
          <input className="border rounded px-2 py-1 text-sm" placeholder={f.placeholder||f.name} disabled />
        </div>
      ))}
    </div>
  );
};
export default FormPreview; 