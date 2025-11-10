import { reactRouter } from "@react-router/dev/vite";
import babel from "vite-plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tailwindcss(), 
    reactRouter(),
    tsconfigPaths(),
    babel({
      filter: /\.[jt]sx?$/,
      babelConfig: {
        compact: true,
        presets: ["@babel/preset-typescript"],
        plugins: [
          ["babel-plugin-react-compiler"],
        ],
      },
    })
  ],
  define: {
    'import.meta.env.VITE_BASE_URL': JSON.stringify(process.env.BASE_URL || 'http://localhost:5173'),
  },
});
