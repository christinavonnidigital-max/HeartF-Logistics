import React from "react";
import { Select } from "../components/UiKit";

export type TargetField = {
  key: string;
  label: string;
  required?: boolean;
  helper?: string;
};

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

  const headerOptions = ["", ...headers];

  return (
    <div className="space-y-3">
      {targetFields.map((field) => {
        const selected = mapping[field.key] ?? "";
        return (
          <div key={field.key} className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-medium text-slate-900">{field.label}</div>
                  {field.required ? (
                    <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
                      Required
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Optional</span>
                  )}
                </div>
                {field.helper ? <div className="mt-1 text-xs text-slate-600">{field.helper}</div> : null}
              </div>

              <div className="w-[280px] max-w-full">
                <Select
                  value={selected}
                  onChange={(e: any) => handleChange(field.key, String(e?.target?.value ?? ""))}
                >
                  {headerOptions.map((h) => (
                    <option key={h || "__none__"} value={h}>
                      {h ? h : "— Not mapped —"}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {field.required && !selected ? (
              <div className="pt-2 text-xs text-rose-700">This field must be mapped to import successfully.</div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

export default FieldMapping;
