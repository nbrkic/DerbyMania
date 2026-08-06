import { useEffect } from 'react';
import {
  SITE_NAME,
  DEFAULT_LOCALE,
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_IMAGE_ALT,
  DEFAULT_KEYWORDS,
  absoluteUrl,
  pageTitle,
} from '../lib/seo';

type JsonLd = Record<string, unknown>;

export type SeoProps = {
  /** Page-specific title. Automatically suffixed with " | DerbyMania" unless isHome is set. */
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  image?: string | null;
  imageAlt?: string;
  type?: 'website' | 'profile' | 'article';
  noindex?: boolean;
  isHome?: boolean;
  jsonLd?: JsonLd | JsonLd[];
};

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function upsertJsonLd(data: JsonLd | JsonLd[] | undefined) {
  const existing = document.head.querySelectorAll('script[data-seo-jsonld="true"]');
  existing.forEach((el) => el.remove());
  if (!data) return;
  const entries = Array.isArray(data) ? data : [data];
  entries.forEach((entry) => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-seo-jsonld', 'true');
    script.textContent = JSON.stringify(entry);
    document.head.appendChild(script);
  });
}

export function Seo({
  title,
  description,
  path,
  keywords,
  image,
  imageAlt,
  type = 'website',
  noindex = false,
  isHome = false,
  jsonLd,
}: SeoProps) {
  useEffect(() => {
    const fullTitle = pageTitle(title, { isHome });
    const url = absoluteUrl(path);
    const ogImage = image ? absoluteUrl(image) : DEFAULT_OG_IMAGE;
    const ogImageAlt = imageAlt ?? DEFAULT_OG_IMAGE_ALT;
    const kw = (keywords && keywords.length ? keywords : DEFAULT_KEYWORDS).join(', ');

    document.title = fullTitle;

    upsertMeta('name', 'description', description);
    upsertMeta('name', 'keywords', kw);
    upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');

    upsertLink('canonical', url);

    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:image', ogImage);
    upsertMeta('property', 'og:image:alt', ogImageAlt);
    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:locale', DEFAULT_LOCALE);

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:url', url);
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', ogImage);

    upsertJsonLd(jsonLd);
  }, [title, description, path, keywords, image, imageAlt, type, noindex, isHome, jsonLd]);

  return null;
}
