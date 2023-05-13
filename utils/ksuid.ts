import KSUID from "ksuid";

export const generateId = () => {
    return KSUID.randomSync().string;
};
export const idToDate = (string) => {
    return KSUID.parse(string).date;
};