import { event } from "#src/utils";

export const ip = async () => {
    const ip = event?.headers?.['cloudfront-viewer-address']?.split(':')?.[0];
    return { ip };
};
