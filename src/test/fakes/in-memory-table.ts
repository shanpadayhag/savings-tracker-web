type WithId = { id?: string | null };

class InMemoryTable<T extends WithId> {
  private records = new Map<string, T>();

  async get(id: string): Promise<T | undefined> {
    return this.records.get(id);
  }

  async add(record: T): Promise<string> {
    if (!record.id) throw new Error("InMemoryTable.add requires record.id");
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

  list(): T[] {
    return Array.from(this.records.values());
  }

  reset(): void {
    this.records.clear();
  }
}

export default InMemoryTable;
