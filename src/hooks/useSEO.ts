import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
}

const SITE_NAME = "Tactical Adaptation Group";
const DEFAULT_DESC = "TAG — Bringing together tactical gamers to master warfighting fundamentals, build brotherhood, and dominate the battlefield.";

export function useSEO({ title, description, image }: SEOProps = {}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const desc = description ?? DEFAULT_DESC;

  useEffect(() => {
    document.title = fullTitle;

    const setMeta = (name: string, content: string, isOg = false) => {
      const attr = isOg ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", desc);
    setMeta("og:title", fullTitle, true);
    setMeta("og:description", desc, true);
    setMeta("og:type", "website", true);
    setMeta("og:site_name", SITE_NAME, true);
    if (image) setMeta("og:image", image, true);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", desc);

    return () => { document.title = SITE_NAME; };
  }, [fullTitle, desc, image]);
}
