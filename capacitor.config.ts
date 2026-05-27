import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.runrun.app",
  appName: "RunRun",
  webDir: "out",
  // Remote URL disabled — breaks native auth (Capacitor bridge not injected)
  // server: {
  //   url: "https://runrun-plum.vercel.app",
  // },
  ios: {
    contentInset: "never",
    scheme: "RunRun",
    backgroundColor: "#f8fafc",
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
