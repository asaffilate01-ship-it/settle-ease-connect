import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () =>
        Response.json(
          {
            status: "ok",
            service: "beistandplus-web",
            version: process.env.APP_VERSION ?? "development",
            time: new Date().toISOString(),
          },
          { headers: { "Cache-Control": "no-store" } },
        ),
    },
  },
});
