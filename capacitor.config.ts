import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.runrun.app",
  appName: "RunRun",
  webDir: "out",
  server: {
    url: "https://runrun-plum.vercel.app",
    cleartext: false,
  },
  ios: {
    contentInset: "automatic",
    scheme: "RunRun",
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
