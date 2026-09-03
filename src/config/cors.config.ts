import { registerAs } from "@nestjs/config";

export default registerAs("cors", () => {
  const frontendUrl = process.env.FRONTEND_URL;
  const frontendUrlWww = process.env.FRONTEND_URL_WWW;

  const origins = ["http://localhost:3000", frontendUrl, frontendUrlWww].filter(
    Boolean,
  );

  return {
    origin: origins,
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST",
    allowedHeaders: "Content-Type,Accept,Authorization",
  };
});
