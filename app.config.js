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
      bundleIdentifier: 'com.onegoaltoday.app',
      supportsTablet: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    plugins: [["expo-font"], "expo-router"],
    extra: {
      eas: {
        projectId: "41b25599-8a49-49ec-b627-7a21cebb166e"
      },
      revenuecatApiKey: process.env.REVENUE_CAT_IOS,
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