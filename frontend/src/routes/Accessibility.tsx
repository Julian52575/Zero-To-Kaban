import { Container, Row, Col } from "react-bootstrap";

/**
 * Déclaration d'accessibilité, suivant le modèle obligatoire du RGAA :
 * https://accessibilite.numerique.gouv.fr/obligations/declaration-accessibilite/
 *
 * Aucun audit RGAA n'a été réalisé à ce jour : le site est donc déclaré
 * non conforme, comme l'exige le référentiel en l'absence de tests.
 */
function Accessibility() {
  return (
    <Container className="py-4">
      <Row>
        <Col md={{ offset: 1, span: 10 }}>
          <h1 className="mb-4">Déclaration d'accessibilité</h1>

          <p>
            Zero-To-Kaban s'engage à rendre son site internet accessible
            conformément à l'article 47 de la loi n° 2005-102 du 11 février
            2005.
          </p>
          <p>
            À cette fin, aucune stratégie pluriannuelle ni plan d'actions
            n'ont encore été mis en œuvre à ce jour.
          </p>
          <p>
            Cette déclaration d'accessibilité s'applique au site{" "}
            <strong>Zero-To-Kaban</strong>.
          </p>

          <h2 className="mt-4">État de conformité</h2>
          <p>
            Zero-To-Kaban n'est <strong>pas conforme</strong> avec le RGAA
            (référentiel général d'amélioration de l'accessibilité). Le site
            n'a fait l'objet d'aucun audit de conformité à ce jour.
          </p>

          <h2 className="mt-4">Résultats des tests</h2>
          <p>
            L'audit de conformité n'a pas encore été réalisé. Aucun taux de
            conformité aux critères du RGAA n'est donc disponible à ce jour.
          </p>

          <h2 className="mt-4">Contenus non accessibles</h2>

          <h3 className="mt-3 h5">Non-conformité(s)</h3>
          <p>
            Aucun audit n'ayant été réalisé, l'ensemble des contenus du site
            est susceptible de présenter des non-conformités au RGAA.
          </p>

          <h3 className="mt-3 h5">Dérogations pour charge disproportionnée</h3>
          <p>Aucune dérogation pour charge disproportionnée n'a été demandée.</p>

          <h3 className="mt-3 h5">
            Contenus non soumis à l'obligation d'accessibilité
          </h3>
          <p>Aucun contenu non soumis à l'obligation d'accessibilité n'a été identifié.</p>

          <h2 className="mt-4">Établissement de cette déclaration d'accessibilité</h2>
          <p>Cette déclaration a été établie le 28 septembre 2026.</p>

          <h3 className="mt-3 h5">Technologies utilisées</h3>
          <ul>
            <li>HTML5</li>
            <li>CSS</li>
            <li>JavaScript (React)</li>
          </ul>

          <h3 className="mt-3 h5">Environnement de test</h3>
          <p>Aucun environnement de test n'a été défini, faute d'audit réalisé.</p>

          <h3 className="mt-3 h5">Outils pour évaluer l'accessibilité</h3>
          <p>Aucun outil d'évaluation de l'accessibilité n'a été utilisé à ce jour.</p>

          <h3 className="mt-3 h5">
            Pages du site ayant fait l'objet de la vérification de conformité
          </h3>
          <p>Aucune page n'a fait l'objet d'une vérification de conformité à ce jour.</p>

          <h2 className="mt-4">Retour d'information et contact</h2>
          <p>
            Si vous n'arrivez pas à accéder à un contenu ou à un service,
            vous pouvez contacter le responsable du site pour être orienté
            vers une alternative accessible ou obtenir le contenu sous une
            autre forme.
          </p>
          <ul>
            <li>
              E-mail :{" "}
              <a href="mailto:contact@zero-to-kaban.fr">
                contact@zero-to-kaban.fr
              </a>
            </li>
          </ul>

          <h2 className="mt-4">Voies de recours</h2>
          <p>
            Cette procédure est à utiliser dans le cas suivant : vous avez
            signalé au responsable du site internet un défaut d'accessibilité
            qui vous empêche d'accéder à un contenu ou à un des services du
            portail et vous n'avez pas obtenu de réponse satisfaisante.
          </p>
          <p>Vous pouvez :</p>
          <ul>
            <li>
              Écrire un message au{" "}
              <a
                href="https://formulaire.defenseurdesdroits.fr/"
                target="_blank"
                rel="noreferrer"
              >
                Défenseur des droits
              </a>
            </li>
            <li>
              Contacter{" "}
              <a
                href="https://www.defenseurdesdroits.fr/saisir/delegues"
                target="_blank"
                rel="noreferrer"
              >
                le délégué du Défenseur des droits dans votre région
              </a>
            </li>
            <li>
              Envoyer un courrier par la poste (gratuit, ne pas mettre de
              timbre) :
              <br />
              Défenseur des droits
              <br />
              Libre réponse 71120
              <br />
              75342 Paris CEDEX 07
            </li>
          </ul>
        </Col>
      </Row>
    </Container>
  );
}

export default Accessibility;
