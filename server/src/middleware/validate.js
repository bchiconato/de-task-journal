/**
 * @fileoverview Request body validation middleware using Zod schemas
 * @module middleware/validate
 */

/**
 * @function validate
 * @description Express middleware factory that validates request bodies against Zod schemas
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @returns {import('express').RequestHandler} Express middleware function
 * @example
 *   router.post('/endpoint', validate(MySchema), handler);
 */
export const validate = (schema) => (req, res, next) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: 'invalid_request',
      details: parsed.error.flatten(),
    });
  }
  req.valid = parsed.data;
  next();
};
