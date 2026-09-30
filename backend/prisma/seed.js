'use strict';

// Seeds a small, realistic-looking board so the accessibility audits (see
// .github/workflows/frontend-and-auth-accessibility.yml) exercise the real
// Kanban UI -- columns, task cards, descriptions -- instead of just the
// empty/error state a fresh database renders. Bypasses the service layer
// (no RabbitMQ event needed for a seed) and inserts directly via Prisma.
//
// A11Y_TEST_USER_ID must match the fake X-Auth-User-Id the frontend's Vite
// proxy injects in that same job (see frontend/vite.config.js) -- it's the
// only "user" this seeded project is visible to. A11Y_TEST_PROJECT_ID is
// given explicitly (overriding the schema's uuid default) so
// frontend/rgaa.config.ts and frontend/lighthouserc.json can point at
// /projects/<id> as a static path -- neither tool can discover an id
// generated at seed time on its own.
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const A11Y_TEST_USER_ID = 'a11y-test-user';
const A11Y_TEST_PROJECT_ID = 'a11y-test-project';

async function main() {
    const project = await prisma.project.create({
        data: {
            id: A11Y_TEST_PROJECT_ID,
            name: 'Website Redesign',
            ownerId: A11Y_TEST_USER_ID,
            columns: {
                create: [
                    {
                        name: 'To do',
                        order: 0,
                        tasks: {
                            create: [
                                {
                                    title: 'Write the RGAA accessibility declaration',
                                    description: 'Draft the public accessibility statement for the site.',
                                    order: 0,
                                    creatorId: A11Y_TEST_USER_ID,
                                },
                                {
                                    title: 'Fix low color contrast on error messages',
                                    order: 1,
                                    creatorId: A11Y_TEST_USER_ID,
                                },
                            ],
                        },
                    },
                    {
                        name: 'In progress',
                        order: 1,
                        tasks: {
                            create: [
                                {
                                    title: 'Add a skip-to-content link',
                                    description: 'Needed for keyboard and screen reader users.',
                                    order: 0,
                                    creatorId: A11Y_TEST_USER_ID,
                                    assigneeId: A11Y_TEST_USER_ID,
                                },
                            ],
                        },
                    },
                    {
                        name: 'Done',
                        order: 2,
                        tasks: {
                            create: [
                                {
                                    title: 'Wire up CI accessibility audits',
                                    order: 0,
                                    creatorId: A11Y_TEST_USER_ID,
                                    assigneeId: A11Y_TEST_USER_ID,
                                },
                            ],
                        },
                    },
                ],
            },
        },
    });

    console.log(`Seeded project ${project.id} ("${project.name}") for accessibility audits`);
}

main()
    .catch((err) => {
        console.error('seed: failed', err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
