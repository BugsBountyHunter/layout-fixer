/// <reference types="vite/client" />

/** CRXJS: bundles the imported module into one self-contained classic script and returns its path. */
declare module '*?iife' {
  const scriptPath: string
  export default scriptPath
}
