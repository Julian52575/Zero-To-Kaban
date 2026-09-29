describe('server', () => {
    let app;
    let db;
    let exitSpy;

    const flush = () => new Promise((resolve) => setImmediate(resolve));

    beforeEach(() => {
        jest.resetModules();

        jest.doMock('../src/app', () => ({ listen: jest.fn() }));
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

        expect(app.listen).toHaveBeenCalledWith(3000, expect.any(Function));

        app.listen.mock.calls[0][1]();
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
        expect(app.listen).not.toHaveBeenCalled();
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
            EVENTS.USER_DELETED,
        ]);

        for (const [eventName, handler] of startConsumeFor.mock.calls) {
            await handler({ id: '1' }, 'event-id');

            expect(console.log).toHaveBeenCalledWith(
                `Handling event: ${eventName} with data: {"id":"1"} and eventId: event-id`
            );
        }
    });
});
