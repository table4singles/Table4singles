// Cena especial con precio del restaurante: el comensal paga ese precio + 10 % de gestión.
// El restaurante solo ve su precio; el 10 % lo ve únicamente el comensal.
export const SPECIAL_FEE_RATE = 0.1

export interface DinerPrice { price: number; fee: number; total: number }

const eur = (cents: number) => String(Number((cents / 100).toFixed(2)))

export function dinerPrice(opts: { isSpecial?: boolean; depositAmount?: number | null; priceBy?: string | null }): DinerPrice {
  const special = !!(opts.isSpecial && opts.depositAmount)
  const cents = special ? Math.round(Number(opts.depositAmount) * 100) : 200
  const feeCents = special && opts.priceBy !== 'admin' ? Math.round(cents * SPECIAL_FEE_RATE) : 0
  return { price: Number(eur(cents)), fee: Number(eur(feeCents)), total: Number(eur(cents + feeCents)) }
}
