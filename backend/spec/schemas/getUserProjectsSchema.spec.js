const {
    getUserProjectsParamsSchema,
} = require('../../src/schemas/getUserProjectsSchema');

describe('getUserProjectsParamsSchema', () => {
    const VALID_USER_ID =
        '3f9a4c1e-2b7d-4e8a-9c6f-1d2e3f4a5b6c';

    it('should accept a valid user id', () => {
        const result = getUserProjectsParamsSchema.safeParse({
            id: VALID_USER_ID,
        });

        expect(result.success).toBe(true);

        expect(result.data).toEqual({
            id: VALID_USER_ID,
        });
    });

    it('should reject a missing user id', () => {
        const result = getUserProjectsParamsSchema.safeParse({});

        expect(result.success).toBe(false);
    });

    it('should reject an empty user id', () => {
        const result = getUserProjectsParamsSchema.safeParse({
            id: '',
        });

        expect(result.success).toBe(false);
    });

    it('should reject an invalid uuid', () => {
        const result = getUserProjectsParamsSchema.safeParse({
            id: 'not-a-valid-uuid',
        });

        expect(result.success).toBe(false);
    });

    it('should reject a numeric user id', () => {
        const result = getUserProjectsParamsSchema.safeParse({
            id: 123,
        });

        expect(result.success).toBe(false);
    });

    it('should reject a null user id', () => {
        const result = getUserProjectsParamsSchema.safeParse({
            id: null,
        });

        expect(result.success).toBe(false);
    });

    it('should reject an undefined user id', () => {
        const result = getUserProjectsParamsSchema.safeParse({
            id: undefined,
        });

        expect(result.success).toBe(false);
    });

    it('should reject unknown parameters', () => {
        const result = getUserProjectsParamsSchema.safeParse({
            id: VALID_USER_ID,
            foo: 'bar',
        });

        expect(result.success).toBe(false);
    });

    it('should not mutate a valid user id', () => {
        const input = {
            id: VALID_USER_ID,
        };

        const result = getUserProjectsParamsSchema.safeParse(input);

        expect(result.success).toBe(true);
        expect(result.data.id).toBe(input.id);
    });
});