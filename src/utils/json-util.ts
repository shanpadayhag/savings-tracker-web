const jsonUtil = {
  /**
   * Safely parses a JSON string that is expected to contain an array.
   * If parsing fails or the content is not an array, it returns an empty array.
   * This function is designed to prevent crashes from malformed JSON.
   * @param jsonString The raw string content to parse.
   * @returns An array of the parsed data, or an empty array on failure.
   */
  parseJsonArray<T>(jsonString: string): T[] {
    try {
      const data = JSON.parse(jsonString);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },
};

export default jsonUtil;
