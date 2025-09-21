type OpenAndReadFilesParams = {
  accept?: string;
  multiple?: boolean;
};

/**
 * A private helper function that wraps the FileReader API in a Promise.
 * @param {File} file - The file to be read.
 * @returns {Promise<string>} A promise that resolves with the file's text content.
 */
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};

const browserFileUtil = {
  /**
   * Prompts the user to select one or more files and reads their contents as strings.
   * @param {OpenAndReadFilesParams} params - The options for the file dialog.
   * @param {string} [params.accept] - A string specifying the file types to accept (e.g., '.json, .txt').
   * @param {boolean} [params.multiple] - Whether to allow multiple file selection. Defaults to false.
   * @returns {Promise<string[]>} A promise that resolves with an array of the files' string contents.
   */
  openAndReadFiles: ({
    accept = '',
    multiple = false,
  }: OpenAndReadFilesParams = {}): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const fileInputElement = document.createElement('input');
      fileInputElement.type = 'file';
      fileInputElement.accept = accept;
      fileInputElement.multiple = multiple;

      fileInputElement.onchange = async () => {
        document.body.removeChild(fileInputElement);

        if (!fileInputElement.files) {
          resolve([]);
          return;
        }

        try {
          const files = Array.from(fileInputElement.files);
          const readPromises = files.map(readFileAsText);
          const fileContents = await Promise.all(readPromises);
          resolve(fileContents);
        } catch (error) {
          reject(error);
        }
      };

      document.body.appendChild(fileInputElement);
      fileInputElement.click();
    });
  },

  /**
   * Creates a file from a string and initiates a browser download.
   * @param {string} filename - The name for the downloaded file.
   * @param {string} content - The string content to be saved in the file.
   * @param {string} [mimeType='text/plain'] - The MIME type of the file.
   * @returns {void}
   */
  downloadStringAsFile: (filename: string, content: string, mimeType: string = 'text/plain') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = filename;

    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

export default browserFileUtil;
