// vite.config.js
import { defineConfig } from "vite";
import { glob } from "glob";
import path from "path";
import { fileURLToPath } from "url";
import { promises as fs } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all PostCSS files
const postCssFiles = glob.sync("components/**/*.pcss", { absolute: true });

// Component CSS plugin
const componentCssPlugin = () => {
  let isMoving = false;
  return {
    name: "component-css",
    closeBundle: async () => {
      if (isMoving) return; // Prevent recursive builds
      try {
        isMoving = true;
        // Move each CSS file to its corresponding component directory
        const cssFiles = glob.sync("temp-components/**/*.css");
        for (const file of cssFiles) {
          const targetPath = file.replace("temp-components/", "");
          await fs.mkdir(path.dirname(targetPath), { recursive: true });
          await fs.copyFile(file, targetPath);
        }
        // Clean up temp directory
        await fs.rm("temp-components", { recursive: true, force: true });
      } catch (err) {
        console.error("Error moving component CSS files:", err);
      } finally {
        isMoving = false;
      }
    },
  };
};

// Configuration for global CSS
const globalConfig = defineConfig({
  build: {
    outDir: "dist",
    minify: false,
    rollupOptions: {
      input: {
        global: path.resolve(__dirname, "./src/css/global/_index.pcss"),
      },
      output: {
        assetFileNames: () => "assets/styles/global.css",
      },
    },
  },
  css: {
    devSourcemap: true,
  },
});

// Configuration for component CSS
const componentConfig = defineConfig({
  build: {
    outDir: "temp-components",
    minify: false,
    rollupOptions: {
      input: Object.fromEntries(
        postCssFiles.map((file) => {
          const relativePath = path.relative(__dirname, file);
          return [relativePath.replace(".pcss", ""), file];
        })
      ),
      output: {
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) return "[name].css";
          return assetInfo.name.replace(".pcss", ".css");
        },
      },
    },
    emptyOutDir: true,
  },
  plugins: [componentCssPlugin()],
  css: {
    devSourcemap: true,
  },
  // Add watch configuration to ignore CSS files
  server: {
    watch: {
      ignored: ["**/*.css"],
    },
  },
});

// Export based on environment variable
export default process.env.BUILD_TARGET === "components"
  ? componentConfig
  : globalConfig;
