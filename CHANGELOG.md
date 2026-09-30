# Changelog

## [2.3.0](https://github.com/Julian52575/Zero-To-Kanban/compare/2.2.0...2.3.0) (2026-09-30)


### Features

* **deployment:** monitoring the deployed app ([#159](https://github.com/Julian52575/Zero-To-Kanban/issues/159)) ([a2f5422](https://github.com/Julian52575/Zero-To-Kanban/commit/a2f5422b97a57532464922b8e89d2f114a9d48a6))
* notifications, collaborators' tasks and project and gestion, footer ([#163](https://github.com/Julian52575/Zero-To-Kanban/issues/163)) ([e502de2](https://github.com/Julian52575/Zero-To-Kanban/commit/e502de2c21f669ffde3d3d716c53e9eccc24353e))


### Bug Fixes

* **accessibility:** rgaa compliance ([#168](https://github.com/Julian52575/Zero-To-Kanban/issues/168)) ([e9cdfa9](https://github.com/Julian52575/Zero-To-Kanban/commit/e9cdfa9b6588af27906cb2c6dada3d7687d78894))
* **auth:** point CI readiness check and helm probes at /health ([3569467](https://github.com/Julian52575/Zero-To-Kanban/commit/3569467ae9b824bf5b287c4f6384e404287d5c9b))
* **backend:** make the auth service URL configurable ([#172](https://github.com/Julian52575/Zero-To-Kanban/issues/172)) ([6e2d4ea](https://github.com/Julian52575/Zero-To-Kanban/commit/6e2d4ea84710d22c5039dc08350949a5cb80f565))
* **backend:** mark startServer() promise as intentionally ignored ([#177](https://github.com/Julian52575/Zero-To-Kanban/issues/177)) ([98563dc](https://github.com/Julian52575/Zero-To-Kanban/commit/98563dca59c0c369f9c932c9f6e155c86a1b07ac))
* new project's collaboration permissions ([#170](https://github.com/Julian52575/Zero-To-Kanban/issues/170)) ([827db2d](https://github.com/Julian52575/Zero-To-Kanban/commit/827db2d300840aafa159fe441552d807ee337d60))
* user deletion ask for password ([#171](https://github.com/Julian52575/Zero-To-Kanban/issues/171)) ([6e02e2f](https://github.com/Julian52575/Zero-To-Kanban/commit/6e02e2f45474e1ef12b01721681658d2adeff9b9))

## [2.2.0](https://github.com/Julian52575/Zero-To-Kanban/compare/2.1.0...2.2.0) (2026-09-28)


### Features

* **frontend:** rgaa placeholder declaration page ([#150](https://github.com/Julian52575/Zero-To-Kanban/issues/150)) ([b4b903b](https://github.com/Julian52575/Zero-To-Kanban/commit/b4b903b0e9f3459dc17931be8993f6850c0ade33))


### Bug Fixes

* **ci:** make bump-helm-chart's smoke test actually work ([ab21015](https://github.com/Julian52575/Zero-To-Kanban/commit/ab210150c15100cdb264f295d14375853903ab06))

## [2.1.0](https://github.com/Julian52575/Zero-To-Kanban/compare/2.0.0...2.1.0) (2026-09-25)


### Features

* authentification microservice, front component call, event-driven rabbitmq service ([#135](https://github.com/Julian52575/Zero-To-Kanban/issues/135)) ([dc1122a](https://github.com/Julian52575/Zero-To-Kanban/commit/dc1122a95a1d5ef4baced977e514b1b0c793a273))
* user auth, project creation, kanban tasks, deployment, event-driven for sprint 2 completion ([#138](https://github.com/Julian52575/Zero-To-Kanban/issues/138)) ([1c091f9](https://github.com/Julian52575/Zero-To-Kanban/commit/1c091f9ee1fd08f4f89149fbd39a9092817c339b))

## [2.0.0](https://github.com/Julian52575/Zero-To-Kanban/compare/1.0.1...2.0.0) (2026-09-11)


### ⚠ BREAKING CHANGES

* split front, back and db into separate services and ci tests ([#60](https://github.com/Julian52575/Zero-To-Kanban/issues/60))

### Documentation

* **adr template:** options field ([2f38883](https://github.com/Julian52575/Zero-To-Kanban/commit/2f3888311fbf48c7669f52ad9343f321a5661682))
* **adr template:** restored teamwork disclaimer and split consequences ([91a77c8](https://github.com/Julian52575/Zero-To-Kanban/commit/91a77c8f6e4e3aa3f3d676d4d66a556efbf56c18))
* **code of conduct:** contributor covenant template ([d11c45c](https://github.com/Julian52575/Zero-To-Kanban/commit/d11c45c4c57542fdfc038396ebe298d65f28ec15))
* **contributing:** contributing.md ([b5b682b](https://github.com/Julian52575/Zero-To-Kanban/commit/b5b682bf9c5930b942ebc22492ad081c0cc3ccc5))
* **readme:** project documentation section ([e8ea42a](https://github.com/Julian52575/Zero-To-Kanban/commit/e8ea42aee6a21f895da7eb53e441b20d53c2e89b))


### Code Refactoring

* split front, back and db into separate services and ci tests ([#60](https://github.com/Julian52575/Zero-To-Kanban/issues/60)) ([59700a2](https://github.com/Julian52575/Zero-To-Kanban/commit/59700a2a65422553549900c6d02ef4cfc84f8ca5))

## [1.0.1](https://github.com/Julian52575/Zero-To-Kanban/compare/1.0.0...1.0.1) (2026-09-03)


### Bug Fixes

* **html:** extra line break to test release-please ([1c5a069](https://github.com/Julian52575/Zero-To-Kanban/commit/1c5a069100e59aa4817c3b6c689b678b49065794))
* **html:** removed extra linebreak that allowed a release-please trigger ([a05c0c1](https://github.com/Julian52575/Zero-To-Kanban/commit/a05c0c1a1df02bee3f90a648ca794603b63c2de2))
