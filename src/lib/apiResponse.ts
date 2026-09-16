type ApiRecord = Record<string, unknown>;

function isApiRecord(value: unknown): value is ApiRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function unwrapApiData(payload: unknown): unknown {
  let current = payload;

  while (isApiRecord(current) && "data" in current) {
    current = current.data;
  }

  return current;
}

export function unwrapApiArray<T>(payload: unknown, keys: string[] = []): T[] {
  const data = unwrapApiData(payload);

  if (Array.isArray(data)) {
    return data as T[];
  }

  if (isApiRecord(data)) {
    const nestedData = unwrapApiData(data);
    if (Array.isArray(nestedData)) {
      return nestedData as T[];
    }

    for (const key of keys) {
      const value = data[key];
      if (Array.isArray(value)) {
        return value as T[];
      }

      const nestedValue = unwrapApiData(value);
      if (Array.isArray(nestedValue)) {
        return nestedValue as T[];
      }
    }
  }

  return [];
}

export function unwrapApiValue<T>(payload: unknown): T {
  return unwrapApiData(payload) as T;
}
