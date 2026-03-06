/**
 * ARTIFACT: Motor de Cálculo Tributário (TaxEngine) - Mobile Version
 * Objetivo: Calcular INSS e IRRF baseados em tabelas dinâmicas (JSON).
 * Versão TypeScript do TaxEngine.js Desktop.
 */

export interface TaxBracket {
    limit: number;
    rate: number;
    deduction?: number;
}

export interface TaxResult {
    value: number;
    rate?: number;
    deduction?: number;
    effectiveRate?: number;
}

export interface NetSalaryResult {
    gross: number;
    inss: number;
    irrf: number;
    net: number;
    details: {
        baseIRRF: number;
        deductionDependants: number;
    }
}

export interface PayrollSettings {
    inss_brackets: TaxBracket[];
    irrf_brackets: TaxBracket[];
    company_taxes: any;
    dependant_deduction: number;
}

export const TaxEngine = {
    /**
     * Calcula o INSS Progressivo
     */
    calculateINSS(grossSalary: number, brackets: TaxBracket[]): TaxResult {
        let remainingSalary = grossSalary;
        let totalTax = 0;
        let previousLimit = 0;

        // Sort brackets by limit just in case
        const sortedBrackets = [...brackets].sort((a, b) => a.limit - b.limit);

        for (const bracket of sortedBrackets) {
            if (remainingSalary <= 0) break;

            const salaryInBracket = Math.min(grossSalary, bracket.limit);
            const portion = Math.max(0, salaryInBracket - previousLimit);

            totalTax += portion * bracket.rate;
            previousLimit = bracket.limit;

            if (grossSalary <= bracket.limit) break;
        }

        return {
            value: Number(totalTax.toFixed(2)),
            effectiveRate: (totalTax / grossSalary) || 0
        };
    },

    /**
     * Calcula IRRF
     */
    calculateIRRF(baseCalc: number, brackets: TaxBracket[]): TaxResult {
        if (baseCalc <= 0) return { value: 0, rate: 0, deduction: 0 };

        const sortedBrackets = [...brackets].sort((a, b) => a.limit - b.limit);
        let selectedBracket: TaxBracket | null = null;

        // Find the matching bracket
        for (const bracket of sortedBrackets) {
            if (baseCalc <= bracket.limit) {
                selectedBracket = bracket;
                break;
            }
        }

        // If above last bracket
        if (!selectedBracket) selectedBracket = sortedBrackets[sortedBrackets.length - 1];

        const deduction = selectedBracket.deduction || 0;
        const tax = (baseCalc * selectedBracket.rate) - deduction;

        return {
            value: Number(Math.max(0, tax).toFixed(2)),
            rate: selectedBracket.rate, 
            deduction: deduction
        };
    },

    /**
     * Calcula Salário Líquido Completo
     */
    calculateNetSalary(gross: number, dependantsCount: number, settings: PayrollSettings): NetSalaryResult {
        // 1. INSS
        const inss = this.calculateINSS(gross, settings.inss_brackets);

        // 2. Base IRRF
        const deductionDependants = dependantsCount * settings.dependant_deduction;
        const baseIRRF = gross - inss.value - deductionDependants;

        // 3. IRRF
        const irrf = this.calculateIRRF(baseIRRF, settings.irrf_brackets);

        // 4. Net
        const net = gross - inss.value - irrf.value;

        return {
            gross,
            inss: inss.value,
            irrf: irrf.value,
            net: Number(net.toFixed(2)),
            details: {
                baseIRRF: Number(baseIRRF.toFixed(2)),
                deductionDependants: Number(deductionDependants.toFixed(2))
            }
        };
    }
};
