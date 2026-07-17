module.exports = {
  apps: [
    {
      name: "francine-pedagoga",
      script: "dist/server.cjs",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        PORT: 3030,
      },
    },
  ],
};
