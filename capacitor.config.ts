import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.runrun.app",
  appName: "RunRun",
  webDir: "out",
  // No server.url — use local bundle so Capacitor bridge + native plugins work
  ios: {
    contentInset: "never",
    scheme: "RunRun",
    backgroundColor: "#09090b",
  },
  android: {
    buildOptions: {
      signingType: "apksigner",
    },
  },
  plugins: {
    Browser: {},
  },
};

export default config;
