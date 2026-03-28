import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.runrun.app",
  appName: "RunRun",
  webDir: "out",
  server: {
    // Use the deployed URL during development for easy testing
    // Remove this for production builds to use the local bundle
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
  plugins: {},
};

export default config;
