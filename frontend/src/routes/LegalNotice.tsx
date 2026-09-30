import React from "react";

function LegalNotice() {
  return (
    <div className="container py-5">
      <article aria-labelledby="legal-notice-title">
        <a className="visually-hidden-focusable" href="#main-content">
          Skip to content
        </a>
        <div id="main-content">
        <h1 id="legal-notice-title" className="mb-4">Legal Notice</h1>

        <p className="text-muted">
          Last updated: September 30, 2026
        </p>

        <hr className="my-5" />

        <section className="mb-5">
          <h2>1. Website and Application Publisher</h2>

          <p>
            The Zero-To-Kanban application is published and operated by:
          </p>

          <ul>
            <li>
              <strong>Legal name:</strong> Zero-To-Kanban
            </li>
            <li>
              <strong>Email:</strong> contact@zero-to-kaban.fr
            </li>
          </ul>
        </section>

        <section className="mb-5">
          <h2>2. Publication Director</h2>

          <p>
            The publication director responsible for the Zero-To-Kanban
            application is:
          </p>

          <ul>
            <li>
              <strong>Name:</strong> Rulian
            </li>
            <li>
              <strong>Position:</strong> Project Owner
            </li>
            <li>
              <strong>Email:</strong> contact@zero-to-kanban.fr
            </li>
          </ul>
        </section>

        <section className="mb-5">
          <h2>3. Hosting</h2>

          <p>
            The Zero-To-Kanban application is hosted by:
          </p>

          <ul>
            <li>
              <strong>Hosting provider:</strong> RulianServ
            </li>
            <li>
              <strong>Website:</strong>{" "}
            </li>
          </ul>
        </section>

        <section className="mb-5">
          <h2>4. Technical Infrastructure</h2>

          <p>
            Zero-To-Kanban is a web-based application that may use various
            technical components to provide its services, including web
            servers, databases, authentication systems, and other
            infrastructure services.
          </p>

          <p>
            The technical infrastructure may be updated or modified over time
            in order to maintain, secure, and improve the Application.
          </p>
        </section>

        <section className="mb-5">
          <h2>5. Intellectual Property</h2>

          <p>
            Unless otherwise stated, the software, source code, interface,
            design, visual elements, logos, trademarks, text, and other
            original content used by Zero-To-Kanban are protected by
            applicable intellectual property laws.
          </p>

          <p>
            Unauthorized reproduction, modification, distribution, or
            exploitation of these elements may be prohibited by applicable
            law.
          </p>

          <p>
            User-generated content remains subject to the rights and
            conditions described in the{" "}
            <a href="/terms">Terms of Use</a>.
          </p>
        </section>

        <section className="mb-5">
          <h2>6. Personal Data</h2>

          <p>
            Zero-To-Kanban may process personal data in connection with the
            use of the Application.
          </p>

          <p>
            Information about the collection, use, storage, and protection of
            personal data is provided in our{" "}
            <a href="/privacy">Privacy Policy</a>.
          </p>
        </section>

        <section className="mb-5">
          <h2>7. Cookies</h2>

          <p>
            Zero-To-Kanban may use cookies or similar technologies where
            necessary for the operation of the Application, authentication,
            security, or user preferences.
          </p>

          <p>
            Where applicable, information regarding non-essential cookies and
            similar technologies will be provided to Users in accordance with
            applicable law.
          </p>
        </section>

        <section className="mb-5">
          <h2>8. External Links</h2>

          <p>
            The Application may contain links to external websites or
            services operated by third parties.
          </p>

          <p>
            Zero-To-Kanban is not responsible for the content, availability,
            security, or privacy practices of external websites or services.
            Users should review the applicable terms and privacy policies of
            those third parties.
          </p>
        </section>

        <section className="mb-5">
          <h2>9. Application Availability</h2>

          <p>
            Reasonable efforts are made to maintain the availability and
            proper functioning of Zero-To-Kanban.
          </p>

          <p>
            However, temporary interruptions may occur due to maintenance,
            technical problems, security incidents, network failures, or
            circumstances beyond the operator's reasonable control.
          </p>
        </section>

        <section className="mb-5">
          <h2>10. User Responsibilities</h2>

          <p>
            Users are responsible for their use of Zero-To-Kanban and must
            comply with applicable laws and regulations.
          </p>

          <p>
            Users must also comply with the{" "}
            <a href="/terms">Terms of Use</a> when accessing or using the
            Application.
          </p>
        </section>

        <section className="mb-5">
          <h2>11. Contact</h2>

          <p>
            For questions regarding the Zero-To-Kanban application, its
            operation, or this Legal Notice, please contact:
          </p>

          <ul>
            <li>
              <strong>Organization:</strong> Zero-To-Kanban
            </li>
            <li>
              <strong>Email:</strong> contact@zero-to-kanban.fr
            </li>
          </ul>
        </section>

        <hr className="my-5" />

        <p className="text-muted small">
          This Legal Notice is provided as a general template and should be
          completed and reviewed according to the legal status of the
          Zero-To-Kanban operator, its hosting provider, and the laws
          applicable to the service before publication.
        </p>
        </div>
      </article>
    </div>
  );
}

export default LegalNotice;