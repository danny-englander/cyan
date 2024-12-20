// vite.config.js
import { defineConfig } from "vite";
import { glob } from "glob";
import path from "path";
import { fileURLToPath } from "url";
import { promises as fs } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all PostCSS files.
const postCssFiles = glob.sync("components/**/*.pcss", { absolute: true });

// Create the input object for Vite.
const input = {
  // Keep the global styles
  "styles/global": path.resolve(__dirname, "./src/css/global/_index.pcss"),

  // Compile each component's .pcss file in place.
  ...Object.fromEntries(
    postCssFiles
      .filter((file) => file.includes("/components/"))
      .map((file) => {
        const relativePath = path.relative(__dirname, file);
        const entryKey = relativePath.replace(".pcss", "");
        return [entryKey, file];
      })
  ),
};

async function ensureDir(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

async function moveFile(source, target) {
  try {
    await ensureDir(path.dirname(target));
    await fs.rename(source, target);
    console.log(`Moved: ${source} → ${target}`);
  } catch (err) {
    await fs.copyFile(source, target);
    await fs.unlink(source);
  }
}

const moveFiles = () => ({
  name: "move-files",
  closeBundle: async () => {
    try {
      const componentCssFiles = glob.sync(`dist/components/**/*.css`);
      for (const file of componentCssFiles) {
        const targetPath = file.replace(`dist/`, "");
        await moveFile(file, targetPath);
      }

      const componentsDir = "dist/components";
      if (
        await fs
          .access(componentsDir)
          .then(() => true)
          .catch(() => false)
      ) {
        await fs.rm(componentsDir, { recursive: true });
        console.log("Cleaned up temporary component files");
      }
    } catch (err) {
      console.error("Error during file moving:", err);
    }
  },
});

export default defineConfig({
  build: {
    outDir: "dist",
    minify: false,
    rollupOptions: {
      input,
      output: {
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) return "assets/[name][extname]";

          // Handle component CSS - output directly to components directory
          if (assetInfo.name.includes("components/")) {
            return assetInfo.name.replace(".pcss", ".css");
          }

          if (assetInfo.name.includes("global")) {
            return "assets/styles/global.css";
          }

          return "assets/[name][extname]";
        },
      },
    },
  },
  plugins: [moveFiles()],
  css: {
    devSourcemap: true,
  },
});
