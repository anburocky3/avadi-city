import React from "react";
import Link from "next/link";
import { LegalPageShell } from "@/features/pages/legal-page-shell";

const sectionClass = "space-y-2";
const headingClass = "text-base font-black text-slate-900 dark:text-white";

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      title="Privacy Policy"
      description="This policy explains what information the Avadi City Portal may collect, how it is used, and the choices available to you."
    >
      <section className={sectionClass}>
        <h2 className={headingClass}>1. Information you provide</h2>
        <p>
          Depending on the features you use, you may provide account and
          profile details such as your name, email address, phone number, ward,
          date of birth, gender, blood group, and profile image. You may also
          provide civic reports, comments, volunteer or service applications,
          listing details, photos, and information you send to support.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>2. Location and device information</h2>
        <p>
          If you choose to attach a location to a civic report or use a
          location-enabled feature, the relevant location may be collected with
          that submission. The portal may also process basic technical and
          usage information needed to operate, secure, and troubleshoot the
          service. Browser storage may be used for preferences or feature
          functionality.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>3. How information is used</h2>
        <p>
          Information is used to provide and maintain portal features, display
          your profile and submissions, route reports or requests to relevant
          users or administrators, respond to support requests, protect the
          service, and improve its functionality. We use information for these
          purposes in context of the feature you choose to use.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>4. What may be visible to others</h2>
        <p>
          Content submitted to community features may be visible to other users
          or the public. Some features share contact details with the person
          who posted a listing or with recipients of a request so they can
          respond. Please review what you submit and avoid including sensitive
          information in public posts.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>5. Service providers and disclosure</h2>
        <p>
          The portal may rely on service providers to host or operate features
          such as authentication, storage, and communications. Information may
          be processed by those providers as needed to deliver the service. It
          may also be disclosed where required by law or where necessary to
          protect users, the public, or the portal. We do not sell personal
          information for advertising.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>6. Retention and security</h2>
        <p>
          Information is retained for as long as needed to provide the
          relevant feature, meet operational needs, and comply with applicable
          requirements. We use reasonable measures to protect information, but
          no online service or storage method can be guaranteed completely
          secure.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>7. Your choices</h2>
        <p>
          You can update profile details through your profile settings. You may
          choose not to provide optional information, though some features may
          then be unavailable. To ask about access, correction, or deletion of
          information, contact us through the{" "}
          <Link
            href="/contact"
            className="font-bold text-primary underline underline-offset-2"
          >
            Contact &amp; Support page
          </Link>
          . Some information may need to be retained where required for
          legitimate operational or legal purposes.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>8. Updates to this policy</h2>
        <p>
          We may revise this policy when portal features or applicable
          requirements change. The latest version will be published on this
          page with its updated date.
        </p>
      </section>
    </LegalPageShell>
  );
}
