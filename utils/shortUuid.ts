import { randomUUID } from 'crypto';

export const shortUuid = () => {
    return Buffer.from(randomUUID().slice(0, 8).replace(/-/g, ''), 'hex').toString('base64').replace('==', '').replace(/\+/g, '-').replace(/\//g, '_');
};
