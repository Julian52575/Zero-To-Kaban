const { z } = require('zod');

const getUserProjectsParamsSchema = z
    .object({
        id: z
            .string()
            .uuid({
                error: 'Invalid user id.',
            }),
    })
    .strict();

module.exports = {
    getUserProjectsParamsSchema,
};