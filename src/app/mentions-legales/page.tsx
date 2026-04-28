import Link from "next/link";
import Footer from "@/components/Footer";

export const runtime = "edge";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[14px] p-5 sm:p-7 mb-4">
      <h2 className="font-barlow-condensed font-extrabold text-[1rem] sm:text-[1.1rem] uppercase tracking-[0.5px] text-[#e8220a] mb-4">{title}</h2>
      <div className="text-[0.88rem] sm:text-[0.9rem] text-[#ccc] leading-[1.8] space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col xs:flex-row xs:gap-3">
      <span className="text-[#777] shrink-0 w-[180px]">{label}</span>
      <span className="text-white">{value}</span>
    </div>
  );
}

export default function MentionsLegalesPage() {
  return (
    <div className="animate-page-in min-h-screen flex flex-col">
      <div className="flex-1 pt-[72px] xs:pt-[80px] px-3 xs:px-4 sm:px-6 pb-10 sm:pb-16">
        <div className="max-w-[720px] mx-auto">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[0.82rem] text-[#777] mb-6 mt-4">
            <Link href="/" className="text-[#777] no-underline hover:text-white transition-colors">Accueil</Link>
            <span>/</span>
            <span className="text-white">Mentions légales</span>
          </div>

          <h1 className="font-barlow-condensed font-black text-[1.8rem] xs:text-[2.2rem] sm:text-[2.6rem] uppercase leading-[1.1] mb-8">
            Mentions <span className="text-[#e8220a]">légales</span>
          </h1>

          <Section title="Éditeur du site">
            <Row label="Nom" value="Arthur Le Borgne" />
            <Row label="Statut juridique" value="Micro-entrepreneur" />
            <Row label="SIRET" value="10340225100013" />
            <Row label="SIREN" value="103402251" />
            <Row label="Adresse" value="15 Rue Anatole Le Bras, 22300 Ploubezre, France" />
            <Row label="Email" value={<a href="mailto:contact@dartstournois.fr" className="text-[#e8220a] hover:underline">contact@dartstournois.fr</a>} />
            <Row label="Site web" value={<a href="https://dartstournois.fr" className="text-[#e8220a] hover:underline">dartstournois.fr</a>} />
            <Row label="Date de création" value="15/04/2026" />
          </Section>

          <Section title="Hébergement">
            <Row label="Hébergeur" value="Cloudflare Inc." />
            <Row label="Adresse" value="101 Townsend St, San Francisco, CA 94107, USA" />
            <Row label="Site" value={<a href="https://cloudflare.com" target="_blank" rel="noopener noreferrer" className="text-[#e8220a] hover:underline">cloudflare.com</a>} />
          </Section>

          <Section title="Propriété intellectuelle">
            <p>Le contenu du site DartsTournois (design, textes, logo) est la propriété d&apos;Arthur Le Borgne. Toute reproduction est interdite sans autorisation préalable.</p>
            <p>Les tournois publiés sur la plateforme sont créés par les utilisateurs et leur appartiennent. DartsTournois se réserve le droit de supprimer tout contenu contraire aux conditions d&apos;utilisation.</p>
          </Section>

          <Section title="Responsabilité">
            <p>DartsTournois s&apos;efforce d&apos;assurer l&apos;exactitude des informations publiées sur le site. Cependant, DartsTournois ne peut être tenu responsable des informations publiées par les organisateurs de tournois (dates, lieux, règles, tarifs).</p>
            <p>L&apos;utilisateur est seul responsable de l&apos;usage qu&apos;il fait des informations disponibles sur le site.</p>
          </Section>

          <Section title="Droit applicable">
            <p>Les présentes mentions légales sont soumises au droit français. En cas de litige, les tribunaux français seront seuls compétents.</p>
            <p className="text-[#777] text-[0.82rem]">Dernière mise à jour : avril 2026</p>
          </Section>

          <div className="mt-6 flex gap-4 flex-wrap">
            <Link href="/confidentialite" className="text-[0.85rem] text-[#e8220a] hover:underline">
              Politique de confidentialité →
            </Link>
            <Link href="/" className="text-[0.85rem] text-[#777] hover:text-white transition-colors">
              ← Retour à l&apos;accueil
            </Link>
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
}
