import { query } from '../utils/query.js';

export const testimonials = async ({ event }) => {
    const testimonials = await query(`SELECT * from htic WHERE "pk"='testimonial' ORDER BY "sk" ASC`);
    return { statusCode: 200, body: JSON.stringify(testimonials), headers: { 'Access-Control-Allow-Origin': '*' } };
};
