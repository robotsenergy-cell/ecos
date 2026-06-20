import { app, setupFrontend } from "./app";

async function startServer() {
  const PORT = 3000;
  
  await setupFrontend(app);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
