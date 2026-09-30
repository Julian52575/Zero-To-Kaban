const {
getProjectCollaboratorsParamsSchema,
} = require('../../src/schemas/getProjectCollaboratorsSchema');

describe('getProjectCollaboratorsParamsSchema', () => {
it('should accept a valid UUID', () => {
const result = getProjectCollaboratorsParamsSchema.safeParse({
id: '3f9a4c1e-2b7d-4e8a-9c6f-1d2e3f4a5b6c',
});

    expect(result.success).toBe(true);
});

it('should reject an invalid UUID', () => {
    const result = getProjectCollaboratorsParamsSchema.safeParse({
        id: 'invalid-id',
    });

    expect(result.success).toBe(false);
});

it('should reject a missing id', () => {
    const result = getProjectCollaboratorsParamsSchema.safeParse({});

    expect(result.success).toBe(false);
});

it('should reject a non-string id', () => {
    const result = getProjectCollaboratorsParamsSchema.safeParse({
        id: 123,
    });

    expect(result.success).toBe(false);
});

it('should reject extra parameters', () => {
    const result = getProjectCollaboratorsParamsSchema.safeParse({
        id: '3f9a4c1e-2b7d-4e8a-9c6f-1d2e3f4a5b6c',
        extra: 'unexpected',
    });

    expect(result.success).toBe(false);
});

});
