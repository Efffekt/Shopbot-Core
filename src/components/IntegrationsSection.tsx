import { ScrollReveal } from "./ScrollReveal";

const platforms = [
  {
    name: "Shopify",
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
        <path d="M15.34 3.04c-.04 0-.08.03-.12.03-.04 0-1.47-.1-1.47-.1s-1.16-1.12-1.27-1.23c-.12-.12-.35-.08-.43-.06 0 0-.23.07-.62.19-.36-1.06-.97-2-2.12-2h-.14C8.87-.53 8.5.04 8.19.52c-.83 1.3-1.19 2.57-1.36 3.58-.97.3-1.65.51-1.74.54-.54.17-.56.19-.63.7C4.41 5.79 3 17.25 3 17.25l9.87 1.7L17.4 18s-2.05-13.89-2.07-14.02c0-.12-.04-.27-.19-.27-.04.13.17.13.2.33zM11.5 2.2l-.84.26c0-.04 0-.08-.01-.12-.18-.93-.5-1.69-.92-2.15.57.12.83.79.77 2.01zM9.8.63c.44.36.72 1.12.88 2.03l-1.63.5c.19-.96.52-1.84.75-2.53zM8.97.14c.1 0 .2.04.3.1-.37.53-.74 1.44-.92 2.64l-1.26.39c.28-1.22.97-3.05 1.88-3.13z"/>
        <path d="M15.14 3.37c-.04 0-1.47-.1-1.47-.1s-1.16-1.12-1.27-1.23a.28.28 0 0 0-.15-.07l-.82 16.97 4.53-.98S15.34 3.6 15.33 3.49c0-.12-.04-.12-.19-.12z" opacity=".5"/>
      </svg>
    ),
  },
  {
    name: "WordPress",
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
        <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zM3.443 12c0-1.4.34-2.72.94-3.885l5.18 14.195A8.563 8.563 0 0 1 3.443 12zm8.557 8.56c-.822 0-1.615-.11-2.37-.318l2.516-7.312 2.578 7.063c.017.04.037.078.058.115a8.553 8.553 0 0 1-2.782.451zm1.168-12.594c.505-.027.96-.08.96-.08.452-.053.399-.718-.053-.692 0 0-1.358.107-2.235.107-.825 0-2.21-.107-2.21-.107-.452-.026-.505.665-.053.692 0 0 .428.053.88.08l1.307 3.582-1.835 5.504-3.055-9.086c.505-.027.96-.08.96-.08.452-.053.399-.718-.053-.692 0 0-1.358.107-2.235.107-.157 0-.343-.004-.537-.01A8.545 8.545 0 0 1 12 3.443c1.737 0 3.327.517 4.668 1.402-.03-.002-.058-.007-.088-.007-. 825 0-1.412.718-1.412 1.49 0 .692.399 1.278.825 1.97.32.558.692 1.278.692 2.315 0 .718-.276 1.55-.639 2.71l-.837 2.8-3.043-9.057zM16.93 19.736l2.558-7.393c.478-1.195.638-2.15.638-3s-.022-.914-.16-1.764A8.544 8.544 0 0 1 20.557 12a8.565 8.565 0 0 1-3.627 7.736z"/>
      </svg>
    ),
  },
  {
    name: "Wix",
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
        <path d="M7.4 7.6c-.3.5-.5 1.2-.6 2.2l-1 5.5-1.3-5.9c-.2-.8-.5-1.4-.9-1.8.4-.6 1-1 1.8-1h.1c.7.1 1.2.5 1.4 1H7.4zm2.6 0L8.5 16h-.2c.3-.5.5-1.2.6-2.2l1-5.5c.1-.5.2-.8.1-1.1h.5c.7 0 1.2.3 1.5.9v-.5zm2.6 0l-1 5.5c-.1.5-.2.8-.1 1.1h-.5c-.7 0-1.2-.3-1.5-.9l1.5-8.4h.2c.7 0 1.1.5 1.3 1l.1.4v1.3zm3.9-.1c-.3.5-.5 1.2-.6 2.2l-1 5.5-1.3-5.9c-.2-.8-.5-1.4-.9-1.8.4-.6 1-1 1.8-1h.1c.7.1 1.2.5 1.4 1h.5z"/>
      </svg>
    ),
  },
  {
    name: "Squarespace",
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
        <path d="M12.01 6.87c.47-.47 1.13-.7 1.77-.7.64 0 1.3.23 1.77.7l4.62 4.62c.98.98.98 2.56 0 3.54l-4.62 4.62c-.47.47-1.13.7-1.77.7-.64 0-1.3-.23-1.77-.7L7.39 15.03c-.98-.98-.98-2.56 0-3.54l4.62-4.62zm3.54 1.77c-.47-.47-1.3-.47-1.77 0L9.16 13.26c-.49.49-.49 1.28 0 1.77l4.62 4.62c.47.47 1.3.47 1.77 0l4.62-4.62c.49-.49.49-1.28 0-1.77l-4.62-4.62z"/>
        <path d="M8.47 10.41c.47-.47 1.13-.7 1.77-.7.64 0 1.3.23 1.77.7l4.62 4.62c.98.98.98 2.56 0 3.54L12.01 23.19c-.47.47-1.13.7-1.77.7-.64 0-1.3-.23-1.77-.7L3.85 18.57c-.98-.98-.98-2.56 0-3.54l4.62-4.62zm3.54 1.77c-.47-.47-1.3-.47-1.77 0L5.62 16.8c-.49.49-.49 1.28 0 1.77l4.62 4.62c.47.47 1.3.47 1.77 0l4.62-4.62c.49-.49.49-1.28 0-1.77l-4.62-4.62z" opacity=".6"/>
      </svg>
    ),
  },
  {
    name: "Webflow",
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
        <path d="M17.803 6.478s-2.137 6.58-2.26 6.953c-.05-.384-1.053-6.953-1.053-6.953C13.2 3.2 10.33 3.09 9.254 5.105L4.56 14.66c-.04-.33-.65-8.182-.65-8.182C3.65 3.26.92 3.047.92 3.047l1.665 17.906s3.06.127 4.462-.987c1.837-1.46 3.284-5.064 3.517-5.6.03.29 1.106 4.326 1.106 4.326.66 2.327 3.066 2.261 4.34 1.022l6.07-12.74s-3.06-.15-4.277 0z"/>
      </svg>
    ),
  },
  {
    name: "Framer",
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
        <path d="M4 20V12H12L20 20H4Z" />
        <path d="M20 12H12V4L20 12Z" />
        <path d="M4 12L12 4H4V12Z" opacity=".6" />
      </svg>
    ),
  },
  {
    name: "Magento",
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
        <path d="M12 2L3 7v10l3 1.74V8.74L12 5.38l6 3.36v10l3-1.74V7L12 2zm0 5.38L9 9.1v8.16l3 1.74 3-1.74V9.1l-3-1.72z"/>
      </svg>
    ),
  },
  {
    name: "HTML",
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
        <path d="M4.136 3.012l1.375 15.443L11.99 21l6.49-2.549 1.376-15.44H4.136zm13.09 4.622l-.235 2.648-.063.7H9.514l.235 2.622h7.129l-.621 7.078-4.264 1.182h-.012l-4.27-1.182-.29-3.27h2.573l.147 1.665 1.84.497 1.846-.5.192-2.148H7.096L6.478 7.634h11.048z"/>
      </svg>
    ),
  },
];

export function IntegrationsSection() {
  return (
    <section className="py-24 px-6 bg-preik-bg transition-colors duration-200">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal animation="up">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-preik-accent tracking-wide uppercase mb-4">
              Integrasjoner
            </p>
            <h2 className="text-4xl sm:text-5xl font-brand font-light text-preik-text mb-6">
              Fungerer overalt
            </h2>
            <p className="text-lg text-preik-text-muted max-w-xl mx-auto">
              Preik integreres med alle plattformer via en enkel kode-snippet. Ingen plugins, ingen avhengigheter.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal animation="up" stagger={1}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {platforms.map((platform) => (
              <div
                key={platform.name}
                className="group flex flex-col items-center gap-3 py-6 px-4 rounded-2xl border border-preik-border bg-preik-surface hover:border-preik-accent/40 transition-colors"
              >
                <div className="text-preik-text-muted group-hover:text-preik-accent transition-colors">
                  {platform.icon}
                </div>
                <span className="text-sm font-medium text-preik-text">
                  {platform.name}
                </span>
              </div>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal animation="up" stagger={2}>
          <p className="text-center text-preik-text-muted text-sm mt-8">
            Fungerer med alle nettsider som støtter JavaScript — fra egenutviklede løsninger til CMS-plattformer.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
