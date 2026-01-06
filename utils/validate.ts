export type Errors<T> = Partial<Record<keyof T, string>>;

export function validateRequired<T extends Record<string, any>>(values: T, required: Array<keyof T>) {
  const errors: Errors<T> = {};
  required.forEach((k) => {
    if (!String(values[k] ?? "").trim()) errors[k] = "Required";
  });
  return errors;
}
