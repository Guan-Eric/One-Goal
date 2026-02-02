import "dotenv/config";
export default {
  expo: {
    scheme: "one-goal",
    userInterfaceStyle: "automatic",
    orientation: "portrait",
    platforms: ["ios", "android"],
    name: "One Goal",
    slug: "one-goal",
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/icon.png",
      resizeMode: "contain",
      backgroundColor: "#000000",
    },
    ios: {
      bundleIdentifier: 'com.onegoal.app',
      supportsTablet: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    plugins: [["expo-font"], "expo-router"],
    extra: {
      revenuecatApiKey: process.env.REVENUECAT_API_KEY,
    },
    experiments: {
      typedRoutes: true,
    },
    owner: "guan-eric",
    runtimeVersion: {
      policy: "appVersion",
    },
  },
};
