import { Container, Row, Col } from "react-bootstrap";

/**
 * Déclaration d'accessibilité conformément au modèle recommandé
 * par le RGAA.
 *
 * L'application a fait l'objet de tests d'accessibilité automatisés
 * et de vérifications des critères RGAA applicables.
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
            Cette déclaration d'accessibilité s'applique au site et à
            l'application <strong>Zero-To-Kaban</strong>.
          </p>

          <h2 className="mt-4">État de conformité</h2>

          <p>
            Zero-To-Kaban est{" "}
            <strong>conforme aux critères d'accessibilité vérifiés du RGAA</strong>.
          </p>

          <p>
            L'application a fait l'objet de tests d'accessibilité automatisés
            ainsi que de vérifications manuelles portant notamment sur la structure
            HTML, les contrastes, la navigation au clavier et les mécanismes
            d'accès rapide au contenu.
          </p>

          <h2 className="mt-4">Résultats des tests</h2>

          <p>
            Les tests automatisés réalisés avec <strong>Lighthouse</strong>{" "}
            ont obtenu un score de <strong>100/100</strong> dans la catégorie
            Accessibilité.
          </p>

          <p>
            Les critères RGAA vérifiés dans le cadre de l'audit réalisé sur
            l'application sont également considérés comme conformes.
          </p>

          <p>
            Les vérifications ont notamment porté sur les critères suivants :
          </p>

          <ul>
            <li>
              <strong>Critère 3.2 :</strong> vérification du contraste entre
              les couleurs du texte et celles de l'arrière-plan.
            </li>
            <li>
              <strong>Critère 12.6 :</strong> identification des zones de
              contenu présentes sur plusieurs pages à l'aide d'éléments HTML
              structurants.
            </li>
            <li>
              <strong>Critère 12.7 :</strong> présence d'un lien d'accès
              rapide permettant d'accéder directement au contenu principal.
            </li>
          </ul>

          <p>
            Ces critères ont été corrigés et vérifiés afin de répondre aux
            exigences d'accessibilité applicables.
          </p>

          <h2 className="mt-4">Contenus non accessibles</h2>

          <h3 className="mt-3 h5">Non-conformité(s)</h3>

          <p>
            À la date de publication de cette déclaration, aucune
            non-conformité n'a été identifiée parmi les critères RGAA
            vérifiés.
          </p>

          <h3 className="mt-3 h5">
            Dérogations pour charge disproportionnée
          </h3>

          <p>
            Aucune dérogation pour charge disproportionnée n'a été demandée.
          </p>

          <h3 className="mt-3 h5">
            Contenus non soumis à l'obligation d'accessibilité
          </h3>

          <p>
            Aucun contenu non soumis à l'obligation d'accessibilité n'a été
            identifié dans le périmètre de l'audit.
          </p>

          <h2 className="mt-4">
            Établissement de cette déclaration d'accessibilité
          </h2>

          <p>
            Cette déclaration a été établie le{" "}
            <strong>30 septembre 2026</strong>.
          </p>

          <h3 className="mt-3 h5">Technologies utilisées</h3>

          <ul>
            <li>HTML5</li>
            <li>CSS3</li>
            <li>JavaScript</li>
            <li>React</li>
            <li>TypeScript</li>
          </ul>

          <h3 className="mt-3 h5">Environnement de test</h3>

          <p>
            Les vérifications ont été réalisées sur la version actuellement
            déployée de Zero-To-Kaban à l'aide d'un navigateur web récent.
          </p>

          <h3 className="mt-3 h5">
            Outils utilisés pour évaluer l'accessibilité
          </h3>

          <ul>
            <li>
              <strong>Google Lighthouse</strong> — audit automatisé de
              l'accessibilité.
            </li>
            <li>
              Vérifications manuelles des critères RGAA concernés.
            </li>
            <li>
              Navigation au clavier pour vérifier l'accès aux différents
              éléments interactifs.
            </li>
          </ul>

          <h3 className="mt-3 h5">
            Pages du site ayant fait l'objet de la vérification de conformité
          </h3>

          <p>
            Les principales pages accessibles depuis l'application ont été
            prises en compte dans les vérifications, notamment :
          </p>

          <ul>
            <li>Page d'accueil</li>
            <li>Page des projets</li>
            <li>Page d'un projet et de son tableau Kanban</li>
            <li>Page de déclaration d'accessibilité</li>
            <li>Page des mentions légales</li>
            <li>Page de politique de confidentialité</li>
            <li>Page des conditions générales d'utilisation</li>
          </ul>

          <h2 className="mt-4">Retour d'information et contact</h2>

          <p>
            Si vous n'arrivez pas à accéder à un contenu ou à un service,
            vous pouvez contacter le responsable du site afin d'être orienté
            vers une alternative accessible ou d'obtenir le contenu sous une
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
            qui vous empêche d'accéder à un contenu ou à l'un des services du
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