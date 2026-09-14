export interface SupplierContactErrors {
    email?: string;
    phone?: string;
}

export const validateSupplierContact = (
    email: string,
    phone: string
): SupplierContactErrors => {
    const errors: SupplierContactErrors = {};
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    // Direcciones habituales con dominio completo; no verifica que el buzón exista.
    const emailPattern = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/;

    if (trimmedEmail && (
        trimmedEmail.length > 254 ||
        trimmedEmail.split("@")[0].length > 64 ||
        !emailPattern.test(trimmedEmail)
    )) {
        errors.email = "Ingresa un correo válido, por ejemplo compras@proveedor.com.";
    }

    if (trimmedPhone && !/^[0-9]{10,15}$/.test(trimmedPhone)) {
        errors.phone = "Ingresa de 10 a 15 dígitos, sin letras, espacios ni símbolos.";
    }

    return errors;
};
