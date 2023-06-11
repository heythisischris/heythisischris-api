import { event } from "#src/utils/event";
import { github } from "#src/routes/internal";

export const internalRouter = async () => {
    if (event.path.endsWith('/github')) {
        return github();
    }
}