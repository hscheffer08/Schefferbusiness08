declare module 'pdfjs-dist/build/pdf.mjs' {
  export const GlobalWorkerOptions: {
    workerSrc: string;
    workerPort?: Worker | null;
  };
  export function getDocument(source: unknown): any;
}
