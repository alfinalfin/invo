import React from "react";
import { formatCompactDate } from "../../lib/crm";

type PODDocumentProps = {
  lead: any;
  podData: any;
};

export function PODDocument({ lead, podData }: PODDocumentProps) {
  const fmtDate = (v?: string) => {
    if (!v) return "—";
    const p = v.split("-");
    if (p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`;
    return v;
  };

  let goodsItems = [];
  try {
    const raw = podData?.podGoodsItems || lead?.podGoodsItems;
    if (raw) goodsItems = JSON.parse(raw);
  } catch (e) {}

  const getToday = () => {
    const d = new Date();
    return (
      d.getDate().toString().padStart(2, "0") +
      "/" +
      (d.getMonth() + 1).toString().padStart(2, "0") +
      "/" +
      d.getFullYear()
    );
  };

  return (
    <div className="pod-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

        .pod-container {
          font-family: 'Inter', sans-serif;
          width: 100%;
          max-width: 816px;
          margin: auto;
        }

        @media print {
          .pod-container {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: none !important;
          }
          .pod-doc {
            box-shadow: none !important;
            border: none !important;
          }
        }

        .pod-doc {
          background:#fff;border-radius:16px;overflow:hidden;font-family:'Inter',sans-serif;font-size:12px;color:#111;border:1px solid #e2e6ef;box-shadow:0 4px 24px rgba(26,86,219,0.07);
        }

        .pod-head {
          background:#1a56db;padding:26px 28px 22px;display:flex;justify-content:space-between;align-items:flex-start;gap:16px;position:relative;overflow:hidden;
        }
        .pod-head-ring1 {
          position:absolute;top:-30px;right:30px;width:130px;height:130px;border-radius:50%;border:1px solid rgba(255,255,255,0.12);
        }
        .pod-head-ring2 {
          position:absolute;top:10px;right:10px;width:80px;height:80px;border-radius:50%;border:1px solid rgba(255,255,255,0.08);
        }
        .pod-head-slash {
          position:absolute;bottom:0;right:0;width:45%;height:100%;background:rgba(255,255,255,0.04);clip-path:polygon(30% 0%,100% 0%,100% 100%,0% 100%);
        }

        .pod-logo {
          background:transparent;display:flex;align-items:center;margin-bottom:15px;
        }
        .pod-main-title {
          font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.03em;line-height:1.1;
        }
        .pod-sub {
          font-size:10px;color:rgba(255,255,255,0.7);font-family:'JetBrains Mono',monospace;margin-top:5px;letter-spacing:0.06em;
        }

        .pod-head-right {
          text-align:right;position:relative;z-index:2;
        }
        .pod-ref-lbl {
          font-size:9px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-bottom:3px;
        }
        .pod-ref-val {
          font-size:16px;font-weight:800;color:#fff;font-family:'JetBrains Mono',monospace;letter-spacing:0.02em;
        }
        .pod-status {
          display:inline-block;margin-top:8px;padding:4px 12px;border-radius:20px;font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;background:rgba(255,255,255,0.2);color:#fff;border:1px solid rgba(255,255,255,0.3);
        }

        .pod-stripe {
          height:4px;background:linear-gradient(90deg,#60a5fa,#1a56db,#3b82f6);
        }

        .pod-body {
          padding:22px 28px;display:flex;flex-direction:column;gap:18px;
        }

        .s-head {
          font-size:9px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#aab;display:flex;align-items:center;gap:8px;margin-bottom:10px;
        }
        .s-head::after {
          content:'';flex:1;height:1px;background:#edf0f7;
        }

        .addr-grid {
          display:grid;grid-template-columns:1fr 1fr;gap:8px;
        }
        .addr-box {
          background:#fafafa;border:1px solid #dde6fb;border-radius:10px;padding:12px 14px;
        }
        .addr-box.full {
          grid-column:1/-1;
        }
        .addr-lbl {
          font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#1a56db;margin-bottom:5px;display:flex;align-items:center;gap:5px;
        }
        .lbl-pip {
          width:5px;height:5px;background:#1a56db;border-radius:50%;flex-shrink:0;
        }
        .addr-val {
          font-size:12px;color:#111;line-height:1.55;font-weight:500;
        }
        .addr-val.mono {
          font-family:'JetBrains Mono',monospace;font-size:11px;
        }
        .empty {
          color:#bbc;font-style:italic;font-size:11px;
        }
        .whitespace-pre-wrap {
          white-space: pre-wrap;
        }

        .chips {
          display:grid;grid-template-columns:repeat(3,1fr);gap:8px;
        }
        .chip {
          background:#fafafa;border:1px solid #dde6fb;border-radius:8px;padding:10px 12px;
        }
        .chip-lbl {
          font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#a3a3a3;margin-bottom:4px;
        }
        .chip-val {
          font-size:12px;font-weight:700;color:#111;font-family:'JetBrains Mono',monospace;
        }
        .truncate {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .desc-box {
          background:#fafafa;border:1px solid #dde6fb;border-radius:10px;padding:12px 14px;margin-bottom:8px;
        }
        .desc-box:last-child {
          margin-bottom:0;
        }
        .desc-lbl {
          font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#1a56db;margin-bottom:5px;
        }
        .desc-val {
          font-size:12px;color:#333;line-height:1.6;
        }

        .items-tbl-wrap { border:1px solid #dde6fb;border-radius:10px;overflow:hidden;margin-bottom:8px; }
        .items-tbl { width:100%;border-collapse:collapse;background:#fafafa; }
        .items-tbl th { background:#f0f4fd;text-align:left;padding:8px 12px;font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#1a56db;border-bottom:1px solid #dde6fb; }
        .items-tbl td { padding:10px 12px;font-size:11px;color:#111;border-bottom:1px solid #dde6fb;font-family:'JetBrains Mono',monospace;font-weight:600; }
        .items-tbl tr:last-child td { border-bottom:none; }

        .sig-grid {
          display:grid;grid-template-columns:1fr 1fr;gap:10px;
        }
        .sig-box {
          border:1.5px dashed #c7d6f9;border-radius:10px;padding:12px 14px;min-height:68px;display:flex;flex-direction:column;justify-content:space-between;
        }
        .sig-lbl {
          font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#a3a3a3;
        }
        .sig-line {
          border-bottom:1px solid #c7d6f9;margin-top:26px;
        }
        .sig-name {
          font-size:10px;color:#aab;margin-top:4px;font-family:'JetBrains Mono',monospace;
        }

        .pod-foot {
          background:#1a56db;padding:11px 28px;display:flex;justify-content:space-between;align-items:center;font-size:10px;color:rgba(255,255,255,0.6);font-family:'JetBrains Mono',monospace;
        }
        .pod-foot-brand {
          color:#fff;font-weight:700;
        }
      `}</style>

      <div className="pod-doc">
        <div className="pod-head">
          <div className="pod-head-ring1"></div>
          <div className="pod-head-ring2"></div>
          <div className="pod-head-slash"></div>
          <div style={{ position: "relative", zIndex: 2 }}>
            <div className="pod-logo">
              <div style={{ background:'#fff', borderRadius:'8px', width:'32px', height:'32px', display:'flex', alignItems:'center', justifyContent:'center', marginRight:'8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
              </div>
              <span style={{ fontSize:'22px', fontWeight:800, color:'#fff', letterSpacing:'-0.02em' }}>InvoAura CRM</span>
            </div>
            <div className="pod-main-title mt-4">
              Proof of<br />Delivery
            </div>
            <div className="pod-sub">ISSUED: {getToday()}</div>
          </div>
          <div className="pod-head-right">
            <div className="text-[9px] text-[rgba(255,255,255,0.85)] text-right leading-relaxed mb-6 font-mono">
              <div className="font-bold text-white uppercase tracking-wider mb-1 text-[10px]">InvoAura CRM</div>
              <div>1 Concourse Way</div>
              <div>Sheffield</div>
              <div>S1 2BJ</div>
              <div>United Kingdom</div>
              <div className="mt-1 font-bold text-[10px]">020 3773 1185</div>
            </div>
            <div className="pod-ref-lbl">Reference No.</div>
            <div className="pod-ref-val">{lead.id || "—"}</div>
            <div className="pod-status">{lead.status === 'Converted' ? 'READY' : 'PENDING'}</div>
          </div>
        </div>
        <div className="pod-stripe"></div>
        <div className="pod-body">
          <div>
            <div className="s-head">Addresses</div>
            <div className="addr-grid">
              <div className="addr-box">
                <div className="addr-lbl">
                  <span className="lbl-pip"></span>Collected from
                </div>
                <div className="addr-val whitespace-pre-wrap">
                  {podData.collectionDetails || lead.pickupAddress ? (
                    podData.collectionDetails || lead.pickupAddress
                  ) : (
                    <span className="empty">Not specified</span>
                  )}
                </div>
              </div>
              <div className="addr-box">
                <div className="addr-lbl">
                  <span className="lbl-pip"></span>Delivered to
                </div>
                <div className="addr-val whitespace-pre-wrap">
                  {podData.deliveryDetails || lead.deliveryAddress ? (
                    podData.deliveryDetails || lead.deliveryAddress
                  ) : (
                    <span className="empty">Not specified</span>
                  )}
                </div>
              </div>
              <div className="addr-box full">
                <div className="addr-lbl">
                  <span className="lbl-pip"></span>Client
                </div>
                <div className="addr-val mono">
                  {podData.clientName || lead.company || lead.name ? (
                    podData.clientName || lead.company || lead.name
                  ) : (
                    <span className="empty">Not specified</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div>
            <div className="s-head">Logistics</div>
            <div className="chips">
              <div className="chip">
                <div className="chip-lbl">Driver</div>
                <div className="chip-val whitespace-pre-wrap truncate">{podData.podDriverName || "—"}</div>
              </div>
              <div className="chip">
                <div className="chip-lbl">Vehicle</div>
                <div className="chip-val">{podData.podVehicleReg || "—"}</div>
              </div>
              <div className="chip">
                <div className="chip-lbl">Date</div>
                <div className="chip-val">{fmtDate(podData.podDeliveryDate)}</div>
              </div>
              <div className="chip">
                <div className="chip-lbl">Pieces</div>
                <div className="chip-val">
                  {podData.podPieces || lead.pieces || "—"}
                </div>
              </div>
              <div className="chip">
                <div className="chip-lbl">Weight</div>
                <div className="chip-val">{podData.podWeight || "—"}</div>
              </div>
              <div className="chip">
                <div className="chip-lbl">Dims</div>
                <div className="chip-val whitespace-pre-wrap truncate">
                  {podData.podDimensions || lead.weightDimensions || "—"}
                </div>
              </div>
            </div>
          </div>
          <div>
            <div className="s-head">Goods</div>
            <div className="desc-box">
              <div className="desc-lbl">Description</div>
              <div className="desc-val whitespace-pre-wrap">
                {podData.podGoodsDescription || lead.goodsDescription ? (
                  podData.podGoodsDescription || lead.goodsDescription
                ) : (
                  <span className="empty">No description provided</span>
                )}
              </div>
            </div>
            {goodsItems && goodsItems.length > 0 && (
              <div className="items-tbl-wrap">
                <table className="items-tbl">
                  <thead>
                    <tr>
                      <th>Pieces</th>
                      <th>Weight</th>
                      <th>Dimensions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {goodsItems.map((item: any, i: number) => (
                      <tr key={i}>
                        <td>{item.pieces || '—'}</td>
                        <td>{item.weight || '—'}</td>
                        <td>{item.dimensions || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="desc-box">
              <div className="desc-lbl">Notes / Instructions</div>
              <div className="desc-val whitespace-pre-wrap">
                {podData.podNotes ? (
                  podData.podNotes
                ) : (
                  <span className="empty">None</span>
                )}
              </div>
            </div>
          </div>
          <div>
            <div className="s-head">Signatures</div>
            <div className="sig-grid">
              <div className="sig-box">
                <div className="sig-lbl">Driver Signature</div>
                <div className="sig-line"></div>
                <div className="sig-name">
                  Name: {podData.podDriverName || "—"}
                </div>
              </div>
              <div className="sig-box">
                <div className="sig-lbl">Recipient Signature</div>
                <div className="sig-line"></div>
                <div className="sig-name">Name: _______________</div>
              </div>
            </div>
          </div>
        </div>
        <div className="pod-foot">
          <span>REF: {lead.id || "—"}</span>
          <span className="pod-foot-brand">InvoAura CRM</span>
          <span>{getToday()}</span>
        </div>
      </div>
    </div>
  );
}
