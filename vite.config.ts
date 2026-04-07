/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/try-superpowers/",
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",

  },
});
