const {
    getUserProjectsParamsSchema,
} = require('../schemas/getUserProjectsSchema');

function validateGetUserProjects(req, res, next) {
    const result = getUserProjectsParamsSchema.safeParse(
        req.params
    );

    if (!result.success) {
        return res.status(400).json({
            error: 'Invalid user id.',
            details: result.error.issues,
        });
    }

    req.params = result.data;

    next();
}

module.exports = validateGetUserProjects;