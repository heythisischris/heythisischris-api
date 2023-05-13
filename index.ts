import { setEvent } from '#src/utils/event';
import { publicRouter } from '#src/routers/publicRouter';

export const handler = async (event) => {
    console.log(`heythisischris init`);
    setEvent(event);
    if (event.rawPath) {
        return publicRouter();
    }
};
