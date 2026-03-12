import { ScrollReveal } from "./ScrollReveal";

const platforms = [
  { name: "Shopify", logo: "/logos/shopify.svg" },
  { name: "WordPress", logo: "/logos/wordpress.svg" },
  { name: "Wix", logo: "/logos/wix.svg" },
  { name: "Squarespace", logo: "/logos/squarespace.svg" },
  { name: "Webflow", logo: "/logos/webflow.svg" },
  { name: "Framer", logo: "/logos/framer.svg" },
  { name: "React", logo: "/logos/react.svg" },
  { name: "Next.js", logo: "/logos/nextjs.svg" },
  { name: "Magento", logo: "/logos/magento.svg" },
  { name: "Egenutviklet", logo: "/logos/code.svg" },
];

function PlatformCard({ name, logo }: { name: string; logo: string }) {
  return (
    <div className="flex-shrink-0 flex flex-col items-center gap-3 py-6 px-6 mx-3 w-36">
      <img
        src={logo}
        alt={name}
        width={32}
        height={32}
        className="w-8 h-8 opacity-60"
        loading="lazy"
      />
      <span className="text-sm font-medium text-preik-text whitespace-nowrap">
        {name}
      </span>
    </div>
  );
}

export function IntegrationsSection() {
  return (
    <section className="py-24 px-6 bg-preik-bg transition-colors duration-200 overflow-hidden">
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
          <div className="relative -mx-6">
            {/* Fade edges — positioned on the outer wrapper so logos scroll beneath them */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-preik-bg to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-preik-bg to-transparent z-10 pointer-events-none" />

            {/* Scrolling track — overflow hidden so logos clip at the edges */}
            <div className="overflow-hidden">
              <div className="flex animate-scroll-x">
                {platforms.map((p) => (
                  <PlatformCard key={p.name} {...p} />
                ))}
                {/* Duplicate for seamless loop */}
                {platforms.map((p) => (
                  <PlatformCard key={`dup-${p.name}`} {...p} />
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal animation="up" stagger={2}>
          <p className="text-center text-preik-text-muted text-sm mt-10">
            Fungerer med alle nettsider som støtter JavaScript — fra egenutviklede løsninger til CMS-plattformer.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
