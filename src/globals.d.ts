/**
 * Global type augmentation for test response bodies.
 */
declare global {
  interface Response {
    json(): Promise<any>;
  }
}

export {};
