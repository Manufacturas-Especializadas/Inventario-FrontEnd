export const normalizeProductText = (value: string | null) =>
    (value ?? "").trim().toLocaleLowerCase("es");
