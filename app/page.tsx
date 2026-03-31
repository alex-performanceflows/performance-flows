import Hero from "@/components/home/Hero";
import Partners from "@/components/home/Partners";
import Problems from "@/components/home/Problems";
import Solution from "@/components/home/Solution";
import WhyUs from "@/components/home/WhyUs";
import ContactForm from "@/components/home/ContactForm";
import ReviewsCarousel from "@/components/home/ReviewsCarousel";
import Team from "@/components/home/Team";
import FAQ from "@/components/home/FAQ";

export default function Home() {
  return (
    <>
      <Hero />
      <Partners />
      <Problems />
      <Solution />
      <WhyUs />
      <ContactForm />
      <ReviewsCarousel />
      <Team />
      <FAQ />

      {/* Schema.org Organization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": ["ProfessionalService", "Organization"],
            name: "Performance Flows",
            url: "https://performanceflows.com",
            telephone: "+39-338-752-6064",
            description:
              "Agenzia specializzata in Performance Marketing per ecommerce Shopify. Metodo ProfitFlow™: Google Ads profit-first, CRO, tracking e marketing automation per scalare il profitto.",
            address: {
              "@type": "PostalAddress",
              streetAddress: "Via Dotti, 29",
              addressLocality: "Treviso",
              postalCode: "31100",
              addressCountry: "IT",
            },
            taxID: "05527760267",
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "5.0",
              reviewCount: "10",
              bestRating: "5",
              worstRating: "1",
            },
            review: [
              {
                "@type": "Review",
                author: { "@type": "Organization", name: "NOESI Milano" },
                reviewRating: { "@type": "Rating", ratingValue: "5" },
                reviewBody:
                  "Abbiamo iniziato con un audit Google Ads accurato e poi Alex ha preso in carico le nostre campagne. In poche settimane abbiamo ridotto i clic inutili e registrato più chiamate e visite in negozio. Professionali, veloci e facili da gestire.",
              },
              {
                "@type": "Review",
                author: { "@type": "Person", name: "Luca Marchioro" },
                reviewRating: { "@type": "Rating", ratingValue: "5" },
                reviewBody:
                  "L'audit di Alex ha evidenziato ciò che mi mancava (come le conversioni offline, una vera svolta). Abbiamo apportato alcune correzioni insieme, abbiamo subito visto lead qualificati.",
              },
            ],
            knowsAbout: [
              "Google Ads",
              "eCommerce Shopify",
              "Performance Marketing",
              "CRO",
              "Marketing Automation",
            ],
            areaServed: "IT",
            priceRange: "€€€",
          }),
        }}
      />
    </>
  );
}
