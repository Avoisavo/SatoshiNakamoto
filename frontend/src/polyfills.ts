// Polyfills for Node.js modules in browser environment
import { Buffer } from "buffer";
import process from "process/browser";

if (typeof window !== "undefined") {
  window.Buffer = Buffer;
  window.process = process;
}

export {};
