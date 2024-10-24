"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TextInputProps = {
    label: string;
    onChange: (newValue: number) => void;
    value: number;
};

const countDecimals = function (value: number) {
    if (Math.floor(value) === value) return 0;
    return value.toString().split(".")[1].length || 0;
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
    const maskedValue = moneyFormatter.format(Number(digits) / 10 ** countDecimals(value));

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
