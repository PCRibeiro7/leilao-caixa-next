"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TextInputProps = {
    label: string;
    onChange: (newValue: number) => void;
    value: number;
};

// Brazilian currency config
const moneyFormatter = Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

export default function MoneyInput(props: TextInputProps) {
    const { onChange, value } = props;

    const digits = `${value}`.replace(/\D/g, "");
    const maskedValue = moneyFormatter.format(Number(digits) / 100);

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
                    handleChange(ev.target.value);
                }}
                value={maskedValue}
            />
        </div>
    );
}
