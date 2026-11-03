import { db } from "@/lib/db";
import { formatDate, formatNumber } from "@/lib/utils";

const METHOD = { CARD: "💳 Carte", ORANGE_MONEY: "🟠 Orange Money", MTN_MOMO: "🟡 MTN MoMo", PAYPAL: "🅿️ PayPal" };

export default async function AdminPaymentsPage() {
  const payments = await db.payment.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { user: { select: { name: true, email: true } }, course: { select: { title: true } } } });
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="border-b border-line text-xs font-extrabold uppercase tracking-wider text-muted">
          <tr>
            <th className="p-4">Référence</th>
            <th className="p-4">Client</th>
            <th className="p-4">Cours</th>
            <th className="p-4">Moyen</th>
            <th className="p-4">Date</th>
            <th className="p-4 text-right">Montant</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id} className="border-b border-line last:border-0 hover:bg-surface-2/50">
              <td className="p-4 font-mono text-xs font-bold">{p.reference}</td>
              <td className="p-4"><span className="font-bold">{p.user.name}</span><span className="block text-xs text-muted">{p.user.email}</span></td>
              <td className="max-w-56 truncate p-4">{p.course.title}</td>
              <td className="p-4">{METHOD[p.method]}</td>
              <td className="p-4 text-muted">{formatDate(p.createdAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
              <td className="p-4 text-right">
                <span className="font-extrabold">{formatNumber(p.amountXaf)} FCFA</span>
                {p.currency !== "XAF" && <span className="block text-xs text-muted">payé en {p.currency}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
