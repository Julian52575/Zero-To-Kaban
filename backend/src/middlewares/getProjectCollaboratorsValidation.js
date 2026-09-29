const {
getProjectCollaboratorsParamsSchema,
} = require('../schemas/getProjectCollaboratorsSchema');

function validateGetProjectCollaborators(req, res, next) {
const result = getProjectCollaboratorsParamsSchema.safeParse(req.params);

if (!result.success) {
    return res.status(400).json({
        error: 'Invalid project id.',
        details: result.error.issues,
    });
}

req.params = result.data;

next();

}

module.exports = validateGetProjectCollaborators;
