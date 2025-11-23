import Dexie from 'dexie';

class DB extends Dexie {
  notKnownYet!: Dexie.Table<{}, "singleton">;

  constructor() {
    super("savings_tracker_document");
    this.version(1).stores({
    });
  }
}

const documentDBUtil = new DB();
export default documentDBUtil;
