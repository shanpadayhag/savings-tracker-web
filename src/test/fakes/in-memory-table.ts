type WithId = { id?: string | null };

// Mirrors the subset of Dexie's Collection API the production code reaches
// for after a `reverse()` call — currently just `sortBy(field)`. Returning
// the sorted results in reverse order matches Dexie's behavior so callers
// see the same ordering they would in the real DB.
class ReversedSortableCollection<T> {
  constructor(private readonly source: T[]) {}

  async sortBy(field: keyof T): Promise<T[]> {
    const sorted = [...this.source].sort((a, b) => {
      const left = a[field];
      const right = b[field];
      if (left instanceof Date && right instanceof Date) return left.getTime() - right.getTime();
      if (typeof left === 'number' && typeof right === 'number') return left - right;
      return String(left ?? '').localeCompare(String(right ?? ''));
    });
    return sorted.reverse();
  }
}

class InMemoryTable<T extends WithId> {
  private records = new Map<string, T>();

  async get(id: string): Promise<T | undefined> {
    return this.records.get(id);
  }

  async add(record: T): Promise<string> {
    if (!record.id) throw new Error("InMemoryTable.add requires record.id");
    if (this.records.has(record.id)) throw new Error(`Key already exists: ${record.id}`);
    this.records.set(record.id, record);
    return record.id;
  }

  async put(record: T): Promise<string> {
    if (!record.id) throw new Error("InMemoryTable.put requires record.id");
    this.records.set(record.id, record);
    return record.id;
  }

  async update(id: string, partial: Partial<T>): Promise<number> {
    const existing = this.records.get(id);
    if (!existing) return 0;
    this.records.set(id, { ...existing, ...partial });
    return 1;
  }

  async clear(): Promise<void> {
    this.records.clear();
  }

  async toArray(): Promise<T[]> {
    return Array.from(this.records.values());
  }

  reverse(): ReversedSortableCollection<T> {
    return new ReversedSortableCollection(Array.from(this.records.values()));
  }

  list(): T[] {
    return Array.from(this.records.values());
  }

  reset(): void {
    this.records.clear();
  }
}

export default InMemoryTable;
