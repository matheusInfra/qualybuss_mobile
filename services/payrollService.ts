import { TaxEngine, PayrollSettings } from '../lib/TaxEngine';
import { supabase } from '../lib/supabase';

// Fallback Settings if DB fetch fails (Safety net)
const DEFAULT_SETTINGS: PayrollSettings = {
    inss_brackets: [
        { limit: 1412.00, rate: 0.075 },
        { limit: 2666.68, rate: 0.09 },
        { limit: 4000.03, rate: 0.12 },
        { limit: 7786.02, rate: 0.14 }
    ],
    irrf_brackets: [
        { limit: 2259.20, rate: 0, deduction: 0 },
        { limit: 2826.65, rate: 0.075, deduction: 169.44 },
        { limit: 3751.05, rate: 0.15, deduction: 381.44 },
        { limit: 4664.68, rate: 0.225, deduction: 662.77 },
        { limit: 9999999, rate: 0.275, deduction: 896.00 }
    ],
    company_taxes: { fgts: 0.08 },
    dependant_deduction: 189.59
};

export const payrollService = {
    async getMySalaryData(userId: string, userEmail?: string) {
        try {
            // 1. Fetch Settings & User Profile
            // STRATEGY: Try User ID first (Strong Link), then Email (Soft Link/Legacy)
            
            const settingsPromise = supabase.from('payroll_settings').select('*').eq('active', true).single();
            
            // Attempt 1: By User ID
            let userRes = await supabase.from('collaborators').select('id, salary, dependents').eq('user_id', userId).single();
            
            // Attempt 2: By Email (if ID failed and email provided)
            if (!userRes.data && userEmail) {
                console.log(`[Payroll] User ID lookup failed. Trying email fallback: ${userEmail}`);
                userRes = await supabase.from('collaborators').select('id, salary, dependents').eq('corporate_email', userEmail).single();
            }

            const [settingsRes] = await Promise.all([settingsPromise]);

            // Handle Settings
            const settings = settingsRes.data || DEFAULT_SETTINGS;
            
            // Handle User Data
            if (!userRes.data) {
                console.warn('Collaborator not found for Auth ID:', userId, 'or Email:', userEmail);
                return {
                    gross: 0, 
                    net: 0, 
                    inss: 0, 
                    irrf: 0, 
                    benefitsCost: 0, 
                    benefits: [], 
                    referenceDate: new Date() 
                };
            }

            const collaborator = userRes.data;
            const grossSalary = collaborator.salary || 0;
            const dependants = collaborator.dependents || 0;
            const collaboratorId = collaborator.id; // Correct PK for benefits lookup

            // 2. Fetch Benefits using the Correct Collaborator ID
            const benefitsRes = await supabase
                .from('collaborator_benefits')
                .select('*, benefit:benefits_catalog(*)')
                .eq('collaborator_id', collaboratorId)
                .eq('active', true);

            // 2. Run Calculations
            const calculations = TaxEngine.calculateNetSalary(grossSalary, dependants, settings);

            // 3. Process Benefits
            const rawBenefits = benefitsRes.data || [];
            let totalBenefitsCost = 0;
            
            const processedBenefits = rawBenefits.map((item: any) => {
                const b = item.benefit; // Joined catalog data
                let cost = 0;
                
                // Override logic would go here (if item.custom_value exists)
                
                // Integrity Update: Handle Custom Values (Mirroring Desktop Logic)
                if (b.cost_type === 'FIXED') {
                    // Logic: Value * Copart (Default or Custom)
                    const value = item.custom_value ? Number(item.custom_value) : Number(b.value);
                    const copart = item.custom_coparticipation ?? b.default_coparticipation ?? 0;
                    cost = value * copart;
                } else {
                    // Logic: Salary * Percentage
                    const percentage = item.custom_value ? Number(item.custom_value) : Number(b.value);
                    cost = grossSalary * percentage;
                }
                
                totalBenefitsCost += cost;
                
                return {
                    id: b.id,
                    name: b.name,
                    category: b.category,
                    value: cost, // User's share
                    fullValue: b.value
                };
            });

            // --- NOVA ENGINE (SERVER-SIDE SEGURA) ---
            try {
                const rpcRes = await supabase.rpc('get_collaborator_payroll_details', { p_collaborator_id: collaboratorId });
                if (!rpcRes.error && rpcRes.data && rpcRes.data.net !== undefined) {
                    console.log('[Payroll] Sucesso ao usar a RPC Segura do Supabase.');
                    return {
                        gross: rpcRes.data.gross,
                        net: rpcRes.data.finalNet, // Usa finalNet que já subtraiu convenios
                        inss: rpcRes.data.inss,
                        irrf: rpcRes.data.irrf,
                        benefitsCost: rpcRes.data.benefitsCost,
                        benefits: processedBenefits, // Retorna os detalhes reprocessados pro UI mostrar nomes
                        referenceDate: new Date()
                    };
                }
            } catch (rpcErr) {
                console.warn('[Payroll] RPC de impostos falhou ou não existe. Usando Fallback Local.', rpcErr);
            }

            // --- FALLBACK (CLIENT-SIDE ANTIGO) ---
            const finalNet = calculations.net - totalBenefitsCost;

            return {
                gross: calculations.gross,
                net: Number(finalNet.toFixed(2)),
                inss: calculations.inss,
                irrf: calculations.irrf,
                benefitsCost: Number(totalBenefitsCost.toFixed(2)),
                benefits: processedBenefits,
                referenceDate: new Date()
            };

        } catch (error) {
            console.error('Error calculating salary:', error);
            throw error;
        }
    }
};
