const { z } = require("zod");

const userDeletedSchema = z.object({
    userId: z.string(),
});

module.exports = userDeletedSchema;
