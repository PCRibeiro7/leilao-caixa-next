export function cleanString(input: string): string {
    return input.replace(/[^a-z0-9 ,.?!]/gi, "");
}

export function getPropertyNumber(fullAddress: string): number | undefined {
    const addressWithoutDotsAndCommas = fullAddress.replace(/\.|,/g, "");

    const numberAsString =
        addressWithoutDotsAndCommas.indexOf(" N ") !== -1
            ? addressWithoutDotsAndCommas.split(" N ")[1].split(" ")[0].trim()
            : undefined;

    let number: number | undefined = undefined;
    if (numberAsString) {
        number = Number(numberAsString);
        if (isNaN(number)) {
            number = undefined;
        }
    }
    return number;
}

export function removeUnnecessaryInfoFromStreet(street: string): string {
    let cleaned = street.split("N ")[0].split("ANTIGA ")[0].split("QUADRA ")[0].split("ANT ")[0];
    const prefixes = [
        "R",
        "Rua",
        "Av",
        "Avenida",
        "Pca",
        "Praca",
        "Al",
        "Alameda",
        "Trav",
        "Travessa",
        "Rod",
        "Rodovia",
        "Estr",
        "Estrada",
        "Apto",
    ];
    cleaned = cleaned.replaceAll(".", "");
    for (const prefix of prefixes) {
        const upper = prefix.toUpperCase();
        cleaned = cleaned.replaceAll(` ${upper} `, " ");
        cleaned = cleaned.replaceAll(`,${upper} `, ",");
    }
    return cleaned.trim();
}

export function getFullState(state: string): string {
    switch (state) {
        case "RJ":
            return "Rio de Janeiro";
        case "SP":
            return "São Paulo";
        default:
            throw new Error(`Unknown state: ${state}`);
    }
}

export type FormattedAddress = {
    street?: string;
    county?: string;
    city: string;
    state: string;
};

export function formatAddress(
    property: { street: string; number?: number; city: string; state: string; neighborhood: string },
    attemptCount: number,
): FormattedAddress {
    switch (attemptCount) {
        case 0:
            return {
                street: `${property.number ? `${property.number} ` : ""}${property.street}`,
                city: property.city,
                state: property.state,
                county: property.neighborhood,
            };
        case 1: {
            const street = removeUnnecessaryInfoFromStreet(property.street);
            return {
                street: `${property.number ? `${property.number} ` : ""}${street}`,
                city: property.city,
                state: property.state,
                county: property.neighborhood,
            };
        }
        case 2:
            return {
                street: removeUnnecessaryInfoFromStreet(property.street),
                city: property.city,
                state: property.state,
            };
        case 3:
            return {
                county: property.neighborhood,
                city: property.city,
                state: property.state,
            };
        case 4:
            return {
                city: property.city,
                state: property.state,
            };
        default:
            throw new Error("Invalid precision");
    }
}

export function buildFullAddressString(address: FormattedAddress): string {
    return [address.street, address.county, address.city, address.state].filter(Boolean).join(", ");
}

export function parseLocaleNumber(stringNumber: string, locale: string) {
    const thousandSeparator = Intl.NumberFormat(locale)
        .format(11111)
        .replace(/\p{Number}/gu, "");
    const decimalSeparator = Intl.NumberFormat(locale)
        .format(1.1)
        .replace(/\p{Number}/gu, "");

    return parseFloat(
        stringNumber
            .replace(new RegExp("\\" + thousandSeparator, "g"), "")
            .replace(new RegExp("\\" + decimalSeparator), "."),
    );
}
