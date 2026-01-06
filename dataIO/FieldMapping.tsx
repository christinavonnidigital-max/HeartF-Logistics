import React from 'react';
import { Select } from '../components/UiKit';

export type TargetField = { key: string; label: string; required?: boolean; helper?: string };

interface FieldMappingProps {
  headers: string[];
  targetFields: TargetField[];
  mapping: Record<string, string>;
  onChange: (mapping: Record<string, string>) => void;
}

const FieldMapping: React.FC<FieldMappingProps> = ({ headers, targetFields, mapping, onChange }) => {
  const handleChange = (fieldKey: string, value: string) => {
    onChange({ ...mapping, [fieldKey]: value });
  };

  return (
    <div className="space-y-3">
      {targetFields.map((field) => (
        <div key={field.key} className="flex items-center gap-3">
          <div className="w-1/3">
            <p className="text-sm font-semibold text-foreground">
              {field.label}
              {field.required && <span className="text-rose-500 ml-1">*</span>}
            </p>
            {field.helper && <p className="text-xs text-foreground-muted">{field.helper}</p>}
          </div>
          <div className="flex-1">
            <Select
              value={mapping[field.key] || ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              className="w-full"
            >
              <option value="">Select column...</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </Select>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FieldMapping;
