import { StartClient, hydrateStart } from "@tanstack/react-start/client";
import { hydrateRoot } from "react-dom/client";

await hydrateStart();

hydrateRoot(document, <StartClient />);
