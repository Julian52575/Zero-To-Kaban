describe('server', () => {
    let app;
    let httpServer;
    let db;
    let exitSpy;

    const flush = () => new Promise((resolve) => setImmediate(resolve));

    beforeEach(() => {
        jest.resetModules();

        jest.doMock('../src/app', () => ({}));
        httpServer = { listen: jest.fn() };
        jest.doMock('http', () => ({ createServer: jest.fn(() => httpServer) }));
        jest.doMock('../src/events/websocket', () => ({
            initWebSocket: jest.fn(),
            sendToUser: jest.fn(),
        }));
        jest.doMock('../src/repositories/notificationRepository', () => ({
            create: jest.fn(),
        }));
        jest.doMock('../src/persistence', () => ({
            init: jest.fn(),
            teardown: jest.fn(),
            getProjectsFromUser: jest.fn(),
            updateDeletedProjectCollaborator: jest.fn(),
        }));
        jest.doMock('../src/events/rabbitmq', () => ({
            connectRabbitMQ: jest.fn(),
            closeRabbitMQ: jest.fn(),
        }));

        jest.doMock('../src/events/eventBus', () => ({
            startConsumeFor: jest.fn(),
        }));

        exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        process.removeAllListeners('SIGINT');
        process.removeAllListeners('SIGTERM');
        process.removeAllListeners('SIGUSR2');
        jest.restoreAllMocks();
    });

    test('starts listening once the database is initialized', async () => {
        db = require('../src/persistence');
        db.init.mockResolvedValue();
        app = require('../src/app');

        const { startServer } = require('../src/server');
        await startServer();

        expect(require('http').createServer).toHaveBeenCalledWith(app);
        expect(require('../src/events/websocket').initWebSocket).toHaveBeenCalledWith(httpServer);
        expect(httpServer.listen).toHaveBeenCalledWith(3000, expect.any(Function));

        httpServer.listen.mock.calls[0][1]();
        expect(console.log).toHaveBeenCalledWith('Listening on port 3000');
    });

    test('exits with code 1 when database initialization fails', async () => {
        db = require('../src/persistence');
        const error = new Error('connection failed');
        db.init.mockRejectedValue(error);

        const { startServer } = require('../src/server');
        await startServer();

        expect(console.error).toHaveBeenCalledWith(error);
        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    test('tears down the database and exits on SIGINT', async () => {
        db = require('../src/persistence');
        db.init.mockResolvedValue();
        db.teardown.mockResolvedValue();

        const { startServer } = require('../src/server');
        await startServer();

        process.emit('SIGINT');
        await flush();

        expect(db.teardown).toHaveBeenCalledTimes(1);
        expect(exitSpy).toHaveBeenCalledTimes(1);
    });

    test('still exits on SIGTERM even if teardown rejects', async () => {
        db = require('../src/persistence');
        db.init.mockResolvedValue();
        db.teardown.mockRejectedValue(new Error('disconnect failed'));

        const { startServer } = require('../src/server');
        await startServer();

        process.emit('SIGTERM');
        await flush();

        expect(db.teardown).toHaveBeenCalledTimes(1);
        expect(exitSpy).toHaveBeenCalledTimes(1);
    });

    test('tears down the database and exits on SIGUSR2', async () => {
        db = require('../src/persistence');
        db.init.mockResolvedValue();
        db.teardown.mockResolvedValue();

        const { startServer } = require('../src/server');
        await startServer();

        process.emit('SIGUSR2');
        await flush();

        expect(db.teardown).toHaveBeenCalledTimes(1);
        expect(exitSpy).toHaveBeenCalledTimes(1);
    });

    test('exits with code 1 when the RabbitMQ connection fails', async () => {
        db = require('../src/persistence');
        db.init.mockResolvedValue();
        const rabbitmq = require('../src/events/rabbitmq');
        const error = new Error('ECONNREFUSED');
        rabbitmq.connectRabbitMQ.mockRejectedValue(error);
        app = require('../src/app');

        const { startServer } = require('../src/server');
        await startServer();

        expect(console.error).toHaveBeenCalledWith(error);
        expect(exitSpy).toHaveBeenCalledWith(1);
        expect(httpServer.listen).not.toHaveBeenCalled();
    });

    test('starts a logging consumer for every task and project event', async () => {
        db = require('../src/persistence');

        db.init.mockResolvedValue();
        db.getProjectsFromUser.mockResolvedValue([]);
        db.updateDeletedProjectCollaborator.mockResolvedValue();

        const { startConsumeFor } = require('../src/events/eventBus');
        const { EVENTS } = require('../src/events/events');

        const { startServer } = require('../src/server');
        await startServer();

        const consumed = startConsumeFor.mock.calls.map(([name]) => name);

        expect(consumed).toEqual([
            EVENTS.TASK_CREATED,
            EVENTS.TASK_UPDATED,
            EVENTS.TASK_DELETED,
            EVENTS.TASK_STATUS_UPDATED,
            EVENTS.PROJECT_CREATED,
            EVENTS.PROJECT_UPDATED,
            EVENTS.PROJECT_DELETED,
            EVENTS.TASK_ASSIGNED,
            EVENTS.PROJECT_INVITATION,
            EVENTS.USER_DELETED,
        ]);

        const notifying = [EVENTS.TASK_ASSIGNED, EVENTS.PROJECT_INVITATION];
        require('../src/repositories/notificationRepository').create.mockResolvedValue({ id: 'n1' });

        for (const [eventName, handler] of startConsumeFor.mock.calls) {
            if (notifying.includes(eventName)) {
                await handler({ id: '1' }, 'event-id', {});
                continue;
            }
            await handler({ id: '1' }, 'event-id');

            expect(console.log).toHaveBeenCalledWith(
                `Handling event: ${eventName} with data: {"id":"1"} and eventId: event-id`
            );
        }
    });

    describe('notification consumers', () => {
        async function handlerFor(eventName) {
            db = require('../src/persistence');
            db.init.mockResolvedValue();
            const { startConsumeFor } = require('../src/events/eventBus');
            const { startServer } = require('../src/server');
            await startServer();
            return startConsumeFor.mock.calls.find(([name]) => name === eventName)[1];
        }

        test.each([
            ['TASK_ASSIGNED', { assigneeId: 'u2', title: 'T' }, 'u2'],
            ['PROJECT_INVITATION', { userId: 'u3', projectId: 'p1' }, 'u3'],
        ])('%s stores a notification and pushes it to the user', async (name, data, userId) => {
            const { EVENTS } = require('../src/events/events');
            const repo = require('../src/repositories/notificationRepository');
            const { sendToUser } = require('../src/events/websocket');
            repo.create.mockResolvedValue({ id: 'n1' });
            const tx = { tx: true };

            const handler = await handlerFor(EVENTS[name]);
            await handler(data, 'event-id', tx);

            expect(repo.create).toHaveBeenCalledWith(
                { userId, type: EVENTS[name], eventId: 'event-id', data },
                tx
            );
            expect(sendToUser).toHaveBeenCalledWith(userId, {
                type: EVENTS[name],
                data,
                eventId: 'n1',
            });
        });

        test.each(['TASK_ASSIGNED', 'PROJECT_INVITATION'])(
            '%s logs and does not push when the notification cannot be stored',
            async (name) => {
                const { EVENTS } = require('../src/events/events');
                const repo = require('../src/repositories/notificationRepository');
                const { sendToUser } = require('../src/events/websocket');
                repo.create.mockResolvedValue(null);

                const handler = await handlerFor(EVENTS[name]);
                await handler({ assigneeId: 'u2', userId: 'u2' }, 'event-id', {});

                expect(console.error).toHaveBeenCalledWith(
                    `Failed to create notification for ${name} event`
                );
                expect(sendToUser).not.toHaveBeenCalled();
            }
        );
    });

    test('USER_DELETED anonymizes the user in each of their projects', async () => {
        db = require('../src/persistence');
        db.init.mockResolvedValue();
        db.getProjectsFromUser.mockResolvedValue([{ id: 'p1' }, { id: 'p2' }]);
        db.updateDeletedProjectCollaborator.mockResolvedValue();
        const { startConsumeFor } = require('../src/events/eventBus');
        const { EVENTS } = require('../src/events/events');

        const { startServer } = require('../src/server');
        await startServer();
        const handler = startConsumeFor.mock.calls.find(
            ([name]) => name === EVENTS.USER_DELETED
        )[1];
        await handler('u9', 'event-id');

        expect(db.getProjectsFromUser).toHaveBeenCalledWith('u9');
        const anonymous = '00000000-0000-0000-0000-000000000000';
        expect(db.updateDeletedProjectCollaborator).toHaveBeenCalledWith('p1', 'u9', anonymous);
        expect(db.updateDeletedProjectCollaborator).toHaveBeenCalledWith('p2', 'u9', anonymous);
    });
});
