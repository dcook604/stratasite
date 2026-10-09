import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://www.spectrum4.ca';
const SITE_NAME = 'Spectrum 4 Strata Council';

interface Meta {
  title: string;
  description: string;
}

const DEFAULT_META: Meta = {
  title: 'Spectrum 4 Strata Council | Resident Services & Community Management',
  description:
    'Official Spectrum 4 Strata Council website. Access bylaws, register pets & e-scooters, view documents, and stay connected with your Vancouver community.',
};

// Routes that should not be indexed (private or transactional).
const NOINDEX_ROUTES = [/^\/admin/, /^\/tenant-signature/, /^\/incident-status/, /^\/form-acknowledgment/];

const ROUTE_META: Record<string, Meta> = {
  '/': DEFAULT_META,
  '/bylaws': {
    title: `Bylaws | ${SITE_NAME}`,
    description:
      'Read the Spectrum 4 strata bylaws. Browse and search the current bylaw document for Spectrum 4 in Vancouver, BC.',
  },
  '/documents': {
    title: `Documents | ${SITE_NAME}`,
    description: 'Access Spectrum 4 strata documents, meeting minutes, forms, and building records.',
  },
  '/contact': {
    title: `Contact | ${SITE_NAME}`,
    description: 'Contact the Spectrum 4 Strata Council, concierge, and property management team in Vancouver, BC.',
  },
  '/gallery': {
    title: `Gallery | ${SITE_NAME}`,
    description: 'Photos and media from the Spectrum 4 strata community.',
  },
  '/preferred-vendors': {
    title: `Preferred Vendors | ${SITE_NAME}`,
    description: 'Recommended contractors and service providers for Spectrum 4 residents.',
  },
  '/welcome-package': {
    title: `Welcome Package | ${SITE_NAME}`,
    description:
      'New to Spectrum 4? Your guide to strata services, fees, insurance, move-in procedures, and emergency info.',
  },
  '/fees': {
    title: `Strata Fees | ${SITE_NAME}`,
    description: 'Spectrum 4 strata fee schedule and payment information.',
  },
  '/recycling': {
    title: `Recycling | ${SITE_NAME}`,
    description: 'Recycling guidelines and procedures for Spectrum 4 residents.',
  },
  '/organics': {
    title: `Organics | ${SITE_NAME}`,
    description: 'Organics and compost disposal guidelines for Spectrum 4 residents.',
  },
  '/renovations': {
    title: `Renovations | ${SITE_NAME}`,
    description: 'Spectrum 4 renovation policies, approval process, and requirements.',
  },
  '/support': {
    title: `Help & Support | ${SITE_NAME}`,
    description: 'Help and support resources for Spectrum 4 residents.',
  },
  '/incident-report': {
    title: `Report an Issue | ${SITE_NAME}`,
    description: 'Submit an incident report to the Spectrum 4 Strata Council.',
  },
  '/form-acknowledgment': {
    title: `Submission Received | ${SITE_NAME}`,
    description: 'Your Spectrum 4 form submission has been received.',
  },
};

function setMetaTag(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

/**
 * Keeps <title>, the meta description, canonical URL, and robots directive in
 * sync with the current route. The app is a single-page app, so the static
 * index.html values would otherwise be served for every URL.
 */
const RouteMeta = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const meta = ROUTE_META[pathname] ?? {
      title: SITE_NAME,
      description: DEFAULT_META.description,
    };

    document.title = meta.title;
    setMetaTag('name', 'description', meta.description);
    setMetaTag('property', 'og:title', meta.title);
    setMetaTag('property', 'og:description', meta.description);
    setMetaTag('name', 'twitter:title', meta.title);
    setMetaTag('name', 'twitter:description', meta.description);

    const canonicalPath = pathname === '/' ? '' : pathname;
    setCanonical(`${SITE_URL}${canonicalPath}`);
    setMetaTag('property', 'og:url', `${SITE_URL}${canonicalPath}`);

    const noindex = NOINDEX_ROUTES.some((re) => re.test(pathname));
    setMetaTag('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
  }, [pathname]);

  return null;
};

export default RouteMeta;
