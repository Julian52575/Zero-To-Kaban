// Contract test: what the services and controllers publish must pass the
// schema eventBus validates against, or publishEvent throws at runtime.

const { EVENT_SCHEMAS, EVENTS } = require("../../src/events/events");
const { taskPayload, projectPayload } = require("../../src/events/payloads");

// Shaped like the rows Prisma returns (see prisma/schema.prisma).
const task = {
  id: "task-id",
  title: "Task",
  description: null,
  order: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  columnId: "column-id",
  creatorId: "user-id",
  assigneeId: null,
};
const project = {
  id: "8c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f",
  name: "Projet",
  createdAt: new Date("2026-09-24T10:00:00.000Z"),
  ownerId: "3f9a4c1e-2b7d-4e8a-9c6f-1d2e3f4a5b6c",
  columns: [
    {
      id: "column-id",
      name: "À faire",
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      projectId: "8c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f",
    },
  ],
};

const accepts = (eventName, payload) =>
  EVENT_SCHEMAS[eventName].safeParse(payload).success;

describe("event payloads", () => {
  test("taskPayload maps a stored task and its project", () => {
    expect(taskPayload(task, "project-id")).toEqual({
      taskId: "task-id",
      projectId: "project-id",
      columnId: "column-id",
      title: "Task",
      description: null,
      order: 0,
      creatorId: "user-id",
      assigneeId: null,
    });
  });

  test("projectPayload maps a stored project to JSON-safe values", () => {
    expect(projectPayload(project)).toEqual({
      id: project.id,
      name: "Projet",
      createdAt: "2026-09-24T10:00:00.000Z",
      ownerId: project.ownerId,
      columns: project.columns,
    });
  });

  test("projectPayload tolerates missing optional fields", () => {
    const { columns, createdAt, ...bare } = project;
    const payload = projectPayload(bare);

    expect(payload.columns).toEqual([]);
    expect(payload.createdAt).toBeUndefined();
    expect(accepts(EVENTS.PROJECT_CREATED, payload)).toBe(true);
  });

  test.each([
    [EVENTS.TASK_CREATED, taskPayload(task, "project-id")],
    [EVENTS.TASK_UPDATED, taskPayload(task, "project-id")],
    [EVENTS.TASK_DELETED, { taskId: task.id }],
    [EVENTS.PROJECT_CREATED, projectPayload(project)],
    [
      EVENTS.PROJECT_UPDATED,
      {
        id: project.id,
        beforeUpdate: projectPayload(project),
        afterUpdate: projectPayload({ ...project, name: "Renommé" }),
      },
    ],
    [EVENTS.PROJECT_DELETED, { projectId: project.id }],
  ])("%s accepts what is published", (eventName, payload) => {
    expect(accepts(eventName, payload)).toBe(true);
  });

  test("project events keep the column fields", () => {
    const parsed = EVENT_SCHEMAS[EVENTS.PROJECT_CREATED].parse(
      projectPayload(project)
    );

    expect(parsed.columns).toEqual([
      { id: "column-id", name: "À faire", order: 0 },
    ]);
  });
});
