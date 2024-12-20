// postcss.config.js
import postcssImport from "postcss-import";
import postcssNested from "postcss-nested";
import postcssMixins from "postcss-mixins";
import postcssCustomMedia from "postcss-custom-media";
import postcssDiscardComments from "postcss-discard-comments";
import postcssPxtorem from "postcss-pxtorem";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  plugins: [
    postcssImport({
      resolve: (id) => {
        // If it's already an absolute path, return as is.
        if (path.isAbsolute(id)) {
          return id;
        }

        // Check if it's a direct import from utils.
        if (id.startsWith("utils")) {
          return path.resolve(__dirname, "src/css", id);
        }

        // Default resolution.
        return id;
      },
      path: [path.resolve(__dirname, "src/css"), path.resolve(__dirname)],
    }),
    postcssNested(),
    postcssMixins(),
    postcssCustomMedia(),
    postcssUtilities(),
    postcssDiscardComments({
      removeAll: true,
    }),
    postcssPxtorem({
      rootValue: 16,
      unitPrecision: 5,
      propList: ["*", "!border*"],
      selectorBlackList: [],
      replace: true,
      mediaQuery: false,
      minPixelValue: 0,
    }),
  ],
};
