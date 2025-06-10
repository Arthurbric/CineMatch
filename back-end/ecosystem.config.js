module.exports = {
  apps: [
    {
      name: 'cinematch-back',
      script: 'app.js', // ou dist/main.js dependendo do seu projeto
      namespace: 'cinematch',
      watch: true,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
