module.exports = {
  apps: [
    {
      name: "vision-server",
      script: "./app.js",
      instances: 0,
      exec_mode: "cluster",
    },
  ],
};
