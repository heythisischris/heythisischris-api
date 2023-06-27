import { event } from "#src/utils/event";
import { contact, age, test, empty, ip } from "#src/routes/public";

export const publicRouter = async () => {
    if (event.path.endsWith('/contact')) {
        return contact();
    }
    else if (event.path.endsWith('/age')) {
        return age();
    }
    else if (event.path.endsWith('/test')) {
        return test();
    }
    else if (event.path.endsWith('/ip')) {
        return ip();
    }
    else {
        return empty();
    }
}