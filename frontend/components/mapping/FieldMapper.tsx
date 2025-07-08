"use client";

import React, { useState } from 'react';
import { Group, Link, FileText, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useAppStore } from '../../lib/store';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

const FieldMapper: React.FC = () => {
  const { pdfs, formFields, fieldMappings } = useAppStore();
  const [viewMode, setViewMode] = useState<'pdf' | 'group'>('pdf');
  const [editMode, setEditMode] = useState(false);
  
  // Group fields by name for group view
  const groupedFields: { [name: string]: { count: number; fields: any[] } } = {};
  pdfs.forEach(pdf => {
    pdf.formFields.forEach(field => {
      if (!groupedFields[field.name]) {
        groupedFields[field.name] = { count: 0, fields: [] };
      }
      groupedFields[field.name].count += 1;
      groupedFields[field.name].fields.push({ ...field, pdfName: pdf.name });
    });
  });

  const [groups, setGroups] = useState(() => {
    // Initialize groups from groupedFields
    const initial: { id: string; name: string; fields: any[] }[] = Object.entries(groupedFields).map(([name, group]) => ({
      id: name,
      name,
      fields: group.fields
    }));
    return initial;
  });
  const [newGroupCount, setNewGroupCount] = useState(1);
  const handleRenameGroup = (id: string, newName: string) => {
    setGroups(groups => groups.map(g => g.id === id ? { ...g, name: newName } : g));
  };
  const handleUnmerge = (id: string) => {
    setGroups(groups => groups.flatMap(g =>
      g.id === id && g.fields.length > 1
        ? g.fields.map(f => ({ id: f.id, name: f.name, fields: [f] }))
        : [g]
    ));
  };
  const handleAddGroup = () => {
    setGroups(groups => [...groups, { id: `new-group-${newGroupCount}`, name: `New Group ${newGroupCount}`, fields: [] }]);
    setNewGroupCount(c => c + 1);
  };
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const sourceGroupIdx = parseInt(result.source.droppableId.replace('group-', ''));
    const destGroupIdx = parseInt(result.destination.droppableId.replace('group-', ''));
    const sourceFieldIdx = result.source.index;
    const destFieldIdx = result.destination.index;
    if (isNaN(sourceGroupIdx) || isNaN(destGroupIdx)) return;
    setGroups(groups => {
      const newGroups = [...groups];
      const [moved] = newGroups[sourceGroupIdx].fields.splice(sourceFieldIdx, 1);
      newGroups[destGroupIdx].fields.splice(destFieldIdx, 0, moved);
      return newGroups;
    });
  };

  if (pdfs.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">No PDFs uploaded yet. Please upload PDFs first.</p>
      </div>
    );
  }

  if (formFields.length === 0) {
    return (
      <div className="text-center py-8">
        <Link className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">No form fields created yet. Please build your form first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <button
          className={`flex items-center gap-1 px-3 py-1 rounded ${viewMode === 'pdf' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setViewMode('pdf')}
        >
          <FileText className="h-4 w-4" /> By PDF
        </button>
        <button
          className={`flex items-center gap-1 px-3 py-1 rounded ${viewMode === 'group' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setViewMode('group')}
        >
          <Group className="h-4 w-4" /> By Group
        </button>
        {viewMode === 'group' && (
          <button
            className={`ml-4 px-3 py-1 rounded ${editMode ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setEditMode(e => !e)}
          >
            {editMode ? 'Done' : 'Edit Groups'}
          </button>
        )}
      </div>
      {viewMode === 'pdf' ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Field Mapping (By PDF)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pdfs.map((pdf) => (
                <div key={pdf.id} className="border rounded-lg p-4">
                  <h3 className="font-medium mb-3">{pdf.name}</h3>
                  <div className="space-y-2">
                    {pdf.formFields.map((field) => (
                      <div key={field.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">{field.name}</p>
                          <p className="text-sm text-gray-500">Type: {field.type}</p>
                        </div>
                        <Badge variant="secondary">PDF Field</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Group className="h-5 w-5" />
              Field Groups (By Name)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="space-y-4">
                {groups.map((group, groupIdx) => (
                  <Droppable droppableId={`group-${groupIdx}`} key={group.id} direction="vertical">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="border rounded-lg p-4 flex flex-col gap-2"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {editMode ? (
                            <input
                              className="font-medium border-b border-gray-300 focus:border-blue-500 outline-none bg-transparent"
                              value={group.name}
                              onChange={e => handleRenameGroup(group.id, e.target.value)}
                            />
                          ) : (
                            <span className="font-medium">{group.name}</span>
                          )}
                          {group.fields.length > 1 && (
                            <span title="Repeated field">
                              <Users className="h-4 w-4 text-blue-500" />
                            </span>
                          )}
                          {editMode && group.fields.length > 1 && (
                            <button
                              className="ml-2 px-2 py-0.5 rounded bg-red-100 text-red-600 text-xs"
                              onClick={() => handleUnmerge(group.id)}
                            >Unmerge</button>
                          )}
                        </div>
                        {group.fields.length === 0 && editMode && (
                          <div className="text-xs text-gray-400">(Empty group)</div>
                        )}
                        {group.fields.map((field, fieldIdx) => (
                          <Draggable draggableId={field.id} index={fieldIdx} key={field.id} isDragDisabled={!editMode}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`flex items-center justify-between p-2 bg-gray-50 rounded ${editMode ? 'cursor-move' : ''}`}
                              >
                                <div>
                                  <p className="font-medium">{field.name}</p>
                                  <p className="text-sm text-gray-500">From: {field.pdfName}</p>
                                </div>
                                <Badge variant="secondary">PDF Field</Badge>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                ))}
                {editMode && (
                  <button
                    className="w-full mt-2 py-2 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                    onClick={handleAddGroup}
                  >
                    + New Group
                  </button>
                )}
              </div>
            </DragDropContext>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Form Fields</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {formFields.map((field) => (
              <div key={field.id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                <div>
                  <p className="font-medium">{field.label}</p>
                  <p className="text-sm text-gray-500">Name: {field.name}</p>
                </div>
                <Badge variant="outline">Form Field</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="text-center text-gray-500">
        <p>Field mapping and group editing will be implemented in the next iteration.</p>
        <p className="text-sm mt-2">You will be able to merge, split, and rename groups, and drag-and-drop to regroup fields.</p>
      </div>
    </div>
  );
};

export default FieldMapper; 