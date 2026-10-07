import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://127.0.0.1:8000",
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.indexOf("node_modules/katex") >= 0 ||
            id.indexOf("node_modules/react-markdown") >= 0 ||
            id.indexOf("node_modules/remark-math") >= 0 ||
            id.indexOf("node_modules/rehype-katex") >= 0
          ) {
            return "math";
          }
          if (
            id.indexOf("node_modules/antd") >= 0 ||
            id.indexOf("node_modules/@ant-design") >= 0 ||
            id.indexOf("node_modules/rc-") >= 0
          ) {
            return "ui";
          }
          if (
            id.indexOf("node_modules/react") >= 0 ||
            id.indexOf("node_modules/react-dom") >= 0 ||
            id.indexOf("node_modules/react-router") >= 0
          ) {
            return "react";
          }
          return undefined;
        },
      },
    },
  },
});
