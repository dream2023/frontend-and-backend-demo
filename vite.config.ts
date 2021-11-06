import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import myPlugin from "./myPlugin";

export default defineConfig({
  plugins: [vue(), myPlugin()],
  // plugins: [vue()],
});
