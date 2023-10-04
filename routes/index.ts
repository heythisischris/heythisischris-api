import { router } from "#src/utils";
import * as publicRoutes from "./public";
import * as internalRoutes from "./internal";

export const publicRouter = async () => {
    return router(publicRoutes);
};

export const internalRouter = async () => {
    return router(internalRoutes);
};