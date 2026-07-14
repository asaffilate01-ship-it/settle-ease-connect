import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import i18n from "./i18n";
import { DEFAULT_LANG } from "./i18n/config";
import { routeTree } from "./routeTree.gen";


export const getRouter = () => {
  // The i18n singleton persists across requests on the SSR worker.
  // Reset it to the default language for every request so SSR HTML always
  // matches the first client render (which also starts at DEFAULT_LANG).
  // The client re-applies any saved language AFTER first commit in useLanguage.
  if (typeof window === "undefined" && i18n.language !== DEFAULT_LANG) {
    i18n.changeLanguage(DEFAULT_LANG);
  }

  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
