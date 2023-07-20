import { event } from "#src/utils/event";
import { github, calendar } from "#src/routes/internal";

export const internalRouter = async () => {
    if (event.path.endsWith('/github')) {
        return github();
    }
    else if (event.path.endsWith('/calendar')) {
        return calendar();
    }
}