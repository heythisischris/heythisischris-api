import { setEvent } from '#src/utils/event';
import { publicRouter, internalRouter } from '#src/routes';

export const handler = async (rawEvent) => {
    console.log(`heythisischris init`);
    const event = setEvent(rawEvent);

    if (event.path.startsWith('/public/')) {
        return publicRouter();
    }
    else if (event.path.startsWith('/internal/')) {
        return internalRouter();
    }
};
