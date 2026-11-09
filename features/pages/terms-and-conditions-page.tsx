import React from "react";
import Link from "next/link";
import { LegalPageShell } from "@/features/pages/legal-page-shell";

const sectionClass = "space-y-2";
const headingClass = "text-base font-black text-slate-900 dark:text-white";

export default function TermsAndConditionsPage() {
  return (
    <LegalPageShell
      title="Terms & Conditions"
      description="These terms govern your access to and use of the Avadi City Portal and its community features."
    >
      <section className={sectionClass}>
        <h2 className={headingClass}>1. Using the portal</h2>
        <p>
          By using the portal, you agree to these terms. The portal provides
          digital community features such as civic issue reporting, local
          listings, community posts, volunteer information, and transport
          information. Some features may require an account.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>2. Accurate and lawful submissions</h2>
        <p>
          Submit information that is truthful, current, and relevant. Civic
          reports should describe a genuine issue and its location. Do not
          submit false, misleading, abusive, unlawful, or intentionally
          disruptive content, or content that violates another person&apos;s
          rights.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>3. Listings and community content</h2>
        <p>
          You are responsible for the listings, comments, images, and other
          content you provide. Do not post fraudulent offers, misleading
          contact details, spam, or content that requests unsafe or improper
          payments. Local job, rental, food, and service listings are provided
          by their respective posters; users should independently verify
          details before making decisions or transactions.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>4. Emergency and public information</h2>
        <p>
          The portal is not an emergency-response service and does not
          guarantee that a report or alert will be seen or acted on
          immediately. In an emergency, contact the appropriate emergency
          services directly. Transport schedules and other third-party or
          public information may change; verify time-sensitive details with
          their source.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>5. Respectful and secure use</h2>
        <p>
          Do not attempt to disrupt the portal, access another person&apos;s
          account, misuse personal information, or interfere with the
          availability or security of the service. Keep your sign-in details
          secure and notify us if you believe your account has been used
          without permission.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>6. Moderation and availability</h2>
        <p>
          We may review, restrict, or remove content or access where reasonably
          necessary to protect users, comply with applicable requirements, or
          maintain the portal. We may update, suspend, or discontinue features.
          The portal and third-party information are provided as available,
          without a guarantee of uninterrupted service or error-free content.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>7. Changes and contact</h2>
        <p>
          These terms may be updated as the portal changes. Continued use after
          an update means you accept the revised terms. For questions or
          concerns, contact us through the{" "}
          <Link
            href="/contact"
            className="font-bold text-primary underline underline-offset-2"
          >
            Contact &amp; Support page
          </Link>
          .
        </p>
      </section>
    </LegalPageShell>
  );
}
