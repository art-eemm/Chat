import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.ejemplo.chat",
  appName: "chat",
  webDir: "public",
  server: {
    url: "https://chat-seven-tau-42.vercel.app/",
  },
};

export default config;
