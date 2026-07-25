import '@testing-library/jest-dom';

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', { value: () => {}, writable: true });

// Mock URL.createObjectURL
if (typeof window.URL.createObjectURL === 'undefined') {
  Object.defineProperty(window.URL, 'createObjectURL', {
    value: (file: File) => `blob:http://localhost/${file.name}`,
  });
}
