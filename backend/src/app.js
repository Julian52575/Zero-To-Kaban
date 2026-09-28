const express = require('express');

const getTasks = require('./routes/task/getTasks');
const getTask = require('./routes/task/getTask');
const addTask = require('./routes/task/addTask');
const updateTask = require('./routes/task/updateTask');
const deleteTask = require('./routes/task/deleteTask');

const getItems = require("./routes/item/getItems");
const getItem = require("./routes/item/getItem");
const addItem = require('./routes/item/addItem');
const updateItem = require('./routes/item/updateItem');
const deleteItem = require('./routes/item/deleteItem');

const getProjects = require('./routes/project/getProjects');
const getUserProjects = require('./routes/project/getUserProjects');
const getProjectCollaborators = require('./routes/project/getProjectCollaborators');
const getProject = require('./routes/project/getProject');
const createProject = require('./routes/project/createProject');
const updateProject = require('./routes/project/updateProject');
const deleteProject = require('./routes/project/deleteProject');

const { getColumns } = require('./controllers/ColumnController');

const {
    validateCreateProject,
    validateUpdateProject,
} = require('./middlewares/projectValidation');

const requireUser = require('./middlewares/requireUser');


const app = express();

app.disable('x-powered-by');
app.use(express.json());

const apiRouter = express.Router();
apiRouter.get('/health', (req, res) => res.json({ ok: true }));
apiRouter.use(requireUser);

apiRouter.get('/items', getItems);
apiRouter.get('/items/:id', getItem);
apiRouter.post('/items', addItem);
apiRouter.put('/items/:id', updateItem);
apiRouter.patch('/items/:id', updateItem);
apiRouter.delete('/items/:id', deleteItem);


apiRouter.get('/users/:id/projects', getUserProjects);
apiRouter.get('/projects', getProjects);
apiRouter.get('/projects/:id', getProject);
apiRouter.get('/projects/:id/collaborators', getProjectCollaborators);
apiRouter.post('/projects', validateCreateProject, createProject);
apiRouter.delete('/projects/:id', deleteProject);
apiRouter.put('/projects/:id', validateUpdateProject, updateProject);
apiRouter.patch('/projects/:id', validateUpdateProject, updateProject);

apiRouter.get('/projects/:projectId/tasks', getTasks);
apiRouter.get('/projects/:projectId/tasks/:id', getTask);
apiRouter.post('/projects/:projectId/tasks', addTask);
apiRouter.put('/projects/:projectId/tasks/:id', updateTask);
apiRouter.patch('/projects/:projectId/tasks/:id', updateTask);
apiRouter.delete('/projects/:projectId/tasks/:id', deleteTask);
apiRouter.get('/projects/:projectId/columns', getColumns);


app.use(apiRouter);

module.exports = app;