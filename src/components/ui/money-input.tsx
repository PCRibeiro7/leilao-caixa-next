"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useReducer } from "react";

type TextInputProps = {
    initialValue: number;
    onChange: (newValue: number) => void;
    label: string;
};

// Brazilian currency config
const moneyFormatter = Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

export default function MoneyInput(props: TextInputProps) {
    const { onChange, initialValue } = props;

    const initialFormattedValue = moneyFormatter.format(initialValue);

    const [value, setValue] = useReducer((_: unknown, next: string) => {
        const digits = next.replace(/\D/g, "");
        return moneyFormatter.format(Number(digits) / 100);
    }, initialFormattedValue);

    function handleChange(formattedValue: string) {
        const digits = formattedValue.replace(/\D/g, "");
        const realValue = Number(digits) / 100;
        onChange(realValue);
    }

    return (
        <div>
            <Label>{props.label}</Label>
            <Input
                type="text"
                startAdornment="R$"
                onChange={(ev) => {
                    setValue(ev.target.value);
                    handleChange(ev.target.value);
                }}
                value={value}
            />
        </div>
    );
}
