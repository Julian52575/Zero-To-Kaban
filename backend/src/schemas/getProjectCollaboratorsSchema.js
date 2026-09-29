const { z } = require('zod');

const getProjectCollaboratorsParamsSchema = z
    .object({
        id: z.string().uuid(),
    })
    .strict();

module.exports = {
    getProjectCollaboratorsParamsSchema,
};