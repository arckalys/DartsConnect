import Link from "next/link";
import Footer from "@/components/Footer";

export const runtime = "edge";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-[14px] p-5 sm:p-7 mb-4">
      <h2 className="font-barlow-condensed font-extrabold text-[1rem] sm:text-[1.1rem] uppercase tracking-[0.5px] text-[#b91c0a] mb-4">{title}</h2>
      <div className="text-[0.88rem] sm:text-[0.9rem] text-[#ccc] leading-[1.8] space-y-2">{children}</div>
    </div>
  );
}

function Item({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-[#b91c0a] mt-[3px] shrink-0">•</span>
      <span>{children}</span>
    </div>
  );
}

export default function ConfidentialitePage() {
  return (
    <div className="animate-page-in min-h-screen flex flex-col">
      <div className="flex-1 pt-[72px] xs:pt-[80px] px-3 xs:px-4 sm:px-6 pb-10 sm:pb-16">
        <div className="max-w-[720px] mx-auto">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[0.82rem] text-[#777] mb-6 mt-4">
            <Link href="/" className="text-[#777] no-underline hover:text-white transition-colors">Accueil</Link>
            <span>/</span>
            <span className="text-white">Politique de confidentialité</span>
          </div>

          <h1 className="font-barlow-condensed font-black text-[1.8rem] xs:text-[2.2rem] sm:text-[2.6rem] uppercase leading-[1.1] mb-8">
            Politique de <span className="text-[#b91c0a]">confidentialité</span>
          </h1>

          <Section title="Données collectées">
            <p className="mb-2">Lors de la création de votre compte et de l&apos;utilisation du service, nous collectons :</p>
            <Item>Nom, prénom et pseudo</Item>
            <Item>Adresse email</Item>
            <Item>Région</Item>
            <Item>Historique des inscriptions aux tournois</Item>
            <Item>Photo de profil (si téléchargée)</Item>
          </Section>

          <Section title="Utilisation des données">
            <p className="mb-2">Vos données sont utilisées exclusivement pour :</p>
            <Item>La gestion de votre compte utilisateur</Item>
            <Item>L&apos;envoi d&apos;emails de confirmation d&apos;inscription et de rappel de tournois</Item>
            <Item>L&apos;affichage de votre profil sur la plateforme</Item>
            <Item>L&apos;amélioration du service DartsTournois</Item>
            <p className="mt-2 text-[#777]">Vos données ne sont jamais vendues à des tiers ni utilisées à des fins publicitaires.</p>
          </Section>

          <Section title="Hébergement des données">
            <Item><strong className="text-white">Base de données :</strong> Supabase — serveurs en Europe (Irlande, AWS eu-west-1)</Item>
            <Item><strong className="text-white">Hébergement du site :</strong> Cloudflare Pages — réseau mondial</Item>
            <Item><strong className="text-white">Emails transactionnels :</strong> Resend — serveurs aux États-Unis</Item>
          </Section>

          <Section title="Droits des utilisateurs (RGPD)">
            <p className="mb-2">Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :</p>
            <Item><strong className="text-white">Droit d&apos;accès</strong> — consulter les données que nous détenons sur vous</Item>
            <Item><strong className="text-white">Droit de rectification</strong> — modifier vos informations depuis votre profil</Item>
            <Item><strong className="text-white">Droit à l&apos;effacement</strong> — demander la suppression de votre compte et données</Item>
            <Item><strong className="text-white">Droit à la portabilité</strong> — recevoir vos données dans un format lisible</Item>
            <p className="mt-3">Pour exercer ces droits, contactez-nous à : <a href="mailto:contact@dartstournois.fr" className="text-[#b91c0a] hover:underline">contact@dartstournois.fr</a></p>
            <p className="text-[#777]">Toute demande sera traitée dans un délai de 30 jours.</p>
          </Section>

          <Section title="Cookies">
            <Item>Le site utilise des <strong className="text-white">cookies de session</strong> nécessaires à l&apos;authentification</Item>
            <Item>Ces cookies sont obligatoires au bon fonctionnement du service</Item>
            <Item>Aucun cookie publicitaire ou de tracking tiers n&apos;est utilisé</Item>
          </Section>

          <Section title="Durée de conservation">
            <Item>Les données sont conservées tant que votre compte est actif</Item>
            <Item>En cas d&apos;inactivité prolongée (+ 3 ans), nous nous réservons le droit de supprimer le compte</Item>
            <Item>Sur demande de suppression, vos données sont effacées sous <strong className="text-white">30 jours</strong></Item>
          </Section>

          <Section title="Contact & réclamations">
            <p>Pour toute question relative à vos données personnelles :</p>
            <p className="mt-2">
              <a href="mailto:contact@dartstournois.fr" className="text-[#b91c0a] hover:underline">contact@dartstournois.fr</a>
            </p>
            <p className="mt-3 text-[#777]">Vous avez également le droit de déposer une réclamation auprès de la <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-[#b91c0a] hover:underline">CNIL</a>.</p>
            <p className="text-[#777] text-[0.82rem] mt-4">Dernière mise à jour : avril 2026</p>
          </Section>

          <div className="mt-6 flex gap-4 flex-wrap">
            <Link href="/mentions-legales" className="text-[0.85rem] text-[#b91c0a] hover:underline">
              Mentions légales →
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
