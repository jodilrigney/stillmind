const appJson = require("./app.json");

module.exports = {
  expo: {
    ...appJson.expo,
    experiments: {
      ...appJson.expo.experiments,
      ...(process.env.BASE_URL ? { baseUrl: process.env.BASE_URL } : {}),
    },
  },
};
