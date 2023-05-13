import { query } from '#src/utils';

export const testimonials = async () => {
    const testimonials = await query(`SELECT * from htic WHERE "pk"='testimonial' ORDER BY "sk" ASC`);
    return testimonials;
};
