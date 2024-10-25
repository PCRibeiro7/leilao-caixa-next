
// Turn enum into array
export default function ToArray(enumme: object) {
    const allEnumProps = Object.values(enumme);
    return allEnumProps;
}
