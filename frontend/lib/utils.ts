import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Field name management utilities
export class FieldNameManager {
  private usedNames: Set<string> = new Set();
  private nameCounter: Map<string, number> = new Map();

  constructor(existingFields?: Array<{ name: string }>) {
    if (existingFields) {
      existingFields.forEach(field => {
        this.usedNames.add(field.name);
        this.incrementCounter(field.name);
      });
    }
  }

  private incrementCounter(baseName: string) {
    const counter = this.nameCounter.get(baseName) || 0;
    this.nameCounter.set(baseName, counter + 1);
  }

  private generateBaseName(fieldType: string, context?: string): string {
    const typeMap: Record<string, string> = {
      'text': 'text',
      'checkbox': 'checkbox', 
      'radio': 'radio',
      'select': 'select',
      'signature': 'signature',
      'date': 'date'
    };

    const baseType = typeMap[fieldType] || 'field';
    return context ? `${context}_${baseType}` : baseType;
  }

  private normalizeName(name: string): string {
    // Remove special characters and normalize spaces
    return name
      .replace(/[^a-zA-Z0-9\s_-]/g, '')
      .replace(/\s+/g, '_')
      .toLowerCase()
      .trim();
  }

  public generateUniqueName(
    originalName: string | null, 
    fieldType: string, 
    context?: string
  ): string {
    let baseName: string;

    if (originalName && originalName.trim()) {
      // Try to use the original name first
      baseName = this.normalizeName(originalName);
    } else {
      // Generate a descriptive name based on type and context
      baseName = this.generateBaseName(fieldType, context);
    }

    // If the base name is already used, add a counter
    if (this.usedNames.has(baseName)) {
      const counter = this.nameCounter.get(baseName) || 1;
      this.nameCounter.set(baseName, counter + 1);
      baseName = `${baseName}_${counter}`;
    }

    this.usedNames.add(baseName);
    return baseName;
  }

  public isNameUsed(name: string): boolean {
    return this.usedNames.has(name);
  }

  public addUsedName(name: string) {
    this.usedNames.add(name);
    this.incrementCounter(name);
  }

  public getUsedNames(): Set<string> {
    return new Set(this.usedNames);
  }

  public reset() {
    this.usedNames.clear();
    this.nameCounter.clear();
  }
}

// Utility function to create a field name manager from existing PDFs
export function createFieldNameManager(pdfs: Array<{ formFields: Array<{ name: string }> }>): FieldNameManager {
  const allFields = pdfs.flatMap(pdf => pdf.formFields);
  return new FieldNameManager(allFields);
}

// Utility function to generate unique field IDs
export function generateUniqueFieldId(pdfId: string, pageNumber: number, fieldIndex: number, fieldName?: string): string {
  const timestamp = Date.now().toString(36);
  const nameSuffix = fieldName ? `_${fieldName.replace(/[^a-zA-Z0-9]/g, '')}` : '';
  return `${pdfId}_page${pageNumber}_field${fieldIndex}_${timestamp}${nameSuffix}`;
}


