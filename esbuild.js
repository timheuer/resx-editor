const { build, context } = require("esbuild");

const baseConfig = {
  bundle: true,
  minify: process.env.NODE_ENV === "production",
  sourcemap: process.env.NODE_ENV !== "production",
};

const extensionConfig = {
  ...baseConfig,
  platform: "node",
  mainFields: ["module", "main"],
  format: "cjs",
  entryPoints: ["./src/extension.ts"],
  outfile: "./out/extension.js",
  external: ["vscode"],
};

const webviewConfig = {
  ...baseConfig,
  target: "es2020",
  format: "esm",
  entryPoints: ["./src/webview/webview.js"],
  outfile: "./out/webview.js",
};

(async () => {
  const args = process.argv.slice(2);
  try {
    if (args.includes("--watch")) {
      // Build and watch source code
      console.log("[watch] build started");

      const extensionCtx = await context(extensionConfig);
      const webviewCtx = await context(webviewConfig);

      await Promise.all([
        extensionCtx.watch(),
        webviewCtx.watch()
      ]);

      console.log("[watch] watching...");
    } else {
      // Build source code
      await build(extensionConfig);
      await build(webviewConfig);
      console.log("build complete");
    }
  } catch (err) {
    process.stderr.write(err?.stderr || String(err));
    process.exit(1);
  }
})();
