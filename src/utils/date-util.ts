import { format, getYear, isSameYear, isSameMonth, getMinutes } from 'date-fns';

const dateUtil = {
  /**
   * Formats a Date object into 'YYYY_MM_DD_HH_MM_SS' format.
   * Ideal for creating timestamped filenames.
   * @param date The Date object to format. Defaults to the current time.
   * @returns The formatted string.
   */
  toTimestampString(date: Date = new Date()): string {
    const pad = (num: number) => num.toString().padStart(2, '0');

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());

    return `${year}_${month}_${day}_${hours}_${minutes}_${seconds}`;
  },

  formatDisplayDate(startDate: Date = new Date(), endDate?: Date) {
    const currentYear = getYear(new Date());

    if (!endDate) {
      const startYear = getYear(startDate);
      const formatString = startYear === currentYear ? 'MMMM dd' : 'MMMM dd, yyyy';
      const dateString = format(startDate, formatString);

      const isMidnight =
        startDate.getHours() === 0 &&
        startDate.getMinutes() === 0 &&
        startDate.getSeconds() === 0 &&
        startDate.getMilliseconds() === 0;

      if (isMidnight) {
        return dateString;
      } else {
        const timeString = this.formatDisplayTime(startDate);
        return `${dateString} @ ${timeString}`;
      }
    }

    if (isSameYear(startDate, endDate)) {
      const yearOfRange = getYear(startDate);
      const yearSuffix = yearOfRange === currentYear ? '' : `, ${yearOfRange}`;

      if (isSameMonth(startDate, endDate)) {
        const monthAndStartDay = format(startDate, 'MMMM dd');
        const endDay = format(endDate, 'dd');
        return `${monthAndStartDay} - ${endDay}${yearSuffix}`;
      } else {
        const startFormat = format(startDate, 'MMMM dd');
        const endFormat = format(endDate, 'MMMM dd');
        return `${startFormat} - ${endFormat}${yearSuffix}`;
      }
    } else {
      const startFormat = format(startDate, 'MMMM dd, yyyy');
      const endFormat = format(endDate, 'MMMM dd, yyyy');
      return `${startFormat} - ${endFormat}`;
    }
  },

  /**
   * Formats the time part of a Date object for display.
   * This version works with ALL versions of date-fns because it does not
   * use the isStartOfDay() helper.
   *
   * @param date The date to format.
   * @returns A formatted time string or an empty string.
   */
  formatDisplayTime(date: Date) {
    const hasMinutes = getMinutes(date) !== 0;
    const timeFormat = hasMinutes ? 'h:mmaaa' : 'haaa';

    return format(date, timeFormat);
  }
};

export default dateUtil;
