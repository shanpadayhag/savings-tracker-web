export const DateUtil = {
  /**
   * Formats a Date object into 'YYYY_MM_DD_HH_MM_SS' format.
   * Ideal for creating timestamped filenames.
   * @param date The Date object to format. Defaults to the current time.
   * @returns The formatted string.
   */
  toTimestampString(date: Date = new Date()): string {
    const pad = (num: number) => num.toString().padStart(2, '0');

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1); // .getMonth() is 0-indexed
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());

    return `${year}_${month}_${day}_${hours}_${minutes}_${seconds}`;
  }
};
