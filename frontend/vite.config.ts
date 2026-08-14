import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const isElectron = mode === "electron";

  return {
    base: isElectron ? "./" : "/",
    plugins: [
      react(),
      tailwindcss(),
      tsconfigPaths(),
      ...(isElectron
        ? []
        : [
            VitePWA({
              registerType: "autoUpdate",
              includeAssets: ["favicon.svg", "favicon.ico", "favicon-dark.svg", "img/brand-logo.png"],
              devOptions: {
                enabled: true,
              },
              manifest: {
                name: "Pasona Finance",
                short_name: "Pasona",
                description: "Personal finance management",
                theme_color: "#1B2D6B",
                background_color: "#1B2D6B",
                display: "standalone",
                orientation: "portrait",
                start_url: "/",
                icons: [
                  { src: "/icons/icon-72x72.png", sizes: "72x72", type: "image/png", purpose: "any" },
                  { src: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png", purpose: "any" },
                  { src: "/icons/icon-128x128.png", sizes: "128x128", type: "image/png", purpose: "any" },
                  { src: "/icons/icon-144x144.png", sizes: "144x144", type: "image/png", purpose: "any" },
                  { src: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png", purpose: "any" },
                  { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
                  { src: "/icons/icon-384x384.png", sizes: "384x384", type: "image/png", purpose: "any" },
                  { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
                  { src: "/icons/icon-512x512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
                ],
              },
            }),
          ]),
    ],
    server: {
      proxy: {
        "/api": {
          target: process.env.VITE_DEV_API_PROXY_TARGET ?? "http://localhost:8000",
          changeOrigin: false,
        },
      },
    },
  };
});
