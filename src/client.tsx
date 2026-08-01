import { StartClient, hydrateStart } from "@tanstack/react-start/client";
import { hydrateRoot } from "react-dom/client";
// Initialise i18next before the first client render so t() returns translated
// strings during hydration. Without this the lazily-hydrated route subtree can
// render the English fallback values and mismatch the SSR HTML.
import "@/i18n";

await hydrateStart();

hydrateRoot(document, <StartClient />);
