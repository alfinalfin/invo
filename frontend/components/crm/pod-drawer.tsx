"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Copy } from "lucide-react";
import { formatCompactDate } from "../../lib/crm";

import type { LeadStatus } from "../../lib/crm";

type PodDrawerProps = {
  lead: any; // Keep `any` for raw Firebase data
  open: boolean;
  onClose: () => void;
  onSave: (
    leadId: string,
    patch: {
      status: LeadStatus;
      notes: string;
      podDeliveryDate?: string;
      podDriverName?: string;
      podVehicleReg?: string;
      podPieces?: string;
      podWeight?: string;
      podDimensions?: string;
      podGoodsDescription?: string;
      podNotes?: string;
      podGoodsItems?: string;
    }
  ) => Promise<void>;
};

export function PodDrawer({ lead, open, onClose, onSave }: PodDrawerProps) {
  const [isPending, startTransition] = useTransition();

  const [podDraft, setPodDraft] = useState({
    refId: "",
    clientName: "",
    collectionDetails: "",
    deliveryDetails: "",
    podDeliveryDate: "",
    podDriverName: "",
    podVehicleReg: "",
    podPieces: "",
    podWeight: "",
    podDimensions: "",
    podGoodsDescription: "",
    podNotes: "",
  });

  const [goodsItems, setGoodsItems] = useState<{pieces: string, weight: string, dimensions: string}[]>([]);

  const [toastMsg, setToastMsg] = useState("");
  const [showToastBar, setShowToastBar] = useState(false);

  useEffect(() => {
    if (lead) {
      setPodDraft({
        refId: lead.id || "",
        clientName: lead.company || lead.name || "",
        collectionDetails: lead.pickupAddress || "",
        deliveryDetails: lead.deliveryAddress || "",
        podDeliveryDate: lead.podDeliveryDate || "",
        podDriverName: lead.podDriverName || "",
        podVehicleReg: lead.podVehicleReg || "",
        podPieces: lead.podPieces || lead.pieces || "",
        podWeight: lead.podWeight || "",
        podDimensions: lead.podDimensions || lead.weightDimensions || "",
        podGoodsDescription: lead.podGoodsDescription || lead.goodsDescription || "",
        podNotes: lead.podNotes || "",
      });

      let parsedItems = [];
      try {
        if (lead.podGoodsItems) {
           parsedItems = JSON.parse(lead.podGoodsItems);
        }
      } catch (e) {}
      setGoodsItems(parsedItems);
    }
  }, [lead]);

  if (!open) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setShowToastBar(true);
    setTimeout(() => {
      setShowToastBar(false);
    }, 3200);
  };

  const handleSave = () => {
    if (!lead) return;
    startTransition(() => {
      void onSave(lead.id, { 
        status: lead.status,
        notes: lead.notes,
        ...podDraft,
        podGoodsItems: JSON.stringify(goodsItems)
      });
    });
  };

  const saveDraft = () => {
    handleSave();
    showToast('Draft saved successfully.');
  };

  const generatePOD = () => {
    handleSave();
    const slug = podDraft.refId.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'draft';
    const idValue = lead?.id || slug;
    showToast(`POD link ready: ${window.location.host}/pod/${idValue}`);
    navigator.clipboard.writeText(`${window.location.origin}/pod/${idValue}`);
  };

  const generatePdf = () => {
    handleSave();
    const element = document.querySelector('.pod-doc');
    if (!element) return;
    showToast('Starting PDF Download...');
    
    const opt = {
      margin:       0,
      filename:     `POD-${podDraft.refId || 'draft'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    if (!(window as any).html2pdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => {
         (window as any).html2pdf().set(opt).from(element).save();
      };
      document.body.appendChild(script);
    } else {
      (window as any).html2pdf().set(opt).from(element).save();
    }
  };

  const clearAll = () => {
    setPodDraft({
      refId: "",
      clientName: "",
      collectionDetails: "",
      deliveryDetails: "",
      podDeliveryDate: "",
      podDriverName: "",
      podVehicleReg: "",
      podPieces: "",
      podWeight: "",
      podDimensions: "",
      podGoodsDescription: "",
      podNotes: "",
    });
    setGoodsItems([]);
    showToast('Form cleared.');
  };

  const fmtDate = (v?: string) => {
    if (!v) return "—";
    const p = v.split("-");
    if (p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`;
    return v;
  };

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
    <div className="shell overflow-y-auto h-full">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

        .shell { font-family: 'Inter', sans-serif; background: #f0f2f7; min-height: 100vh; padding-bottom: 80px; }

        .topbar { background:#fff;border-bottom:1px solid #e2e6ef; padding:12px 28px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap; }
        .brand { display:flex;align-items:center;gap:10px; }
        .brand-icon { width:36px;height:36px;border-radius:10px;background:#1a56db;display:flex;align-items:center;justify-content:center; }
        .brand-name { font-size:15px;font-weight:800;color:#111;letter-spacing:-0.02em; }
        .brand-tag { font-size:10px;font-weight:700;letter-spacing:0.1em;color:#1a56db;margin-left:3px; }

        .topbar-actions { display:flex;gap:8px;flex-wrap:wrap; align-items:center; }
        .tbtn { font-family:'Inter',sans-serif;font-size:12px;font-weight:700;letter-spacing:0.03em;padding:8px 16px;border-radius:8px;cursor:pointer;border:none;display:inline-flex;align-items:center;gap:6px;transition:all 0.15s; }
        .tbtn-ghost { background:#f0f2f7;color:#444;border:1px solid #dde2ee; }
        .tbtn-ghost:hover { background:#e4e8f3; }
        .tbtn-primary { background:#1a56db;color:#fff; }
        .tbtn-primary:hover { background:#1446c0; }

        .layout { max-width:1240px;margin:28px auto 0;padding:0 24px;display:grid;grid-template-columns:1fr 1fr;gap:28px;align-items:start; }
        @media(max-width:820px) { .layout { grid-template-columns:1fr; } }

        .form-card { background:#fff;border:1px solid #e2e6ef;border-radius:16px;overflow:visible; }
        .form-head { padding:18px 24px;border-bottom:1px solid #edf0f7;display:flex;align-items:center;gap:10px; }
        .form-head-title { font-size:16px;font-weight:800;color:#111;letter-spacing:-0.02em; }
        .form-head-pill { font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;background:#e8effe;color:#1a56db;padding:3px 10px;border-radius:20px;border:1px solid #c7d6f9; }

        .form-body { padding:20px 24px;display:flex;flex-direction:column;gap:16px; }
        .sec-label { font-size:10px;font-weight:700;letter-spacing:0.13em;text-transform:uppercase;color:#aab;display:flex;align-items:center;gap:8px; }
        .sec-label::after { content:'';flex:1;height:1px;background:#edf0f7; }

        .row2 { display:grid;grid-template-columns:1fr 1fr;gap:12px; }
        .row3 { display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px; }

        .field label { display:block;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#888;margin-bottom:5px; }
        .field label .req { color:#1a56db;margin-left:2px; }
        .field input, .field textarea {
          width:100%;font-family:'JetBrains Mono',monospace;font-size:12px;
          background:#fcfcfc;border:1px solid #dde2ee;border-radius:8px;padding:10px 12px;
          color:#111;outline:none;resize:vertical;transition:border-color 0.15s,background 0.15s;
        }
        .field input::placeholder, .field textarea::placeholder { color:#bbc; }
        .field input:focus, .field textarea:focus { border-color:#1a56db;background:#fff;box-shadow:0 0 0 3px rgba(26,86,219,0.08); }
        .field textarea { min-height:66px; }

        .form-foot { padding:14px 24px;border-top:1px solid #edf0f7;display:flex;gap:8px;justify-content:flex-end; }
        .add-item-btn { width:100%;justify-content:center;margin-top:10px;background:#f0f2f7;color:#1a56db;border:2px dashed #c7d6f9;font-weight:700;font-size:13px;padding:10px 16px;border-radius:8px;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all 0.15s; }
        .add-item-btn:hover { background:#e0e8ff;border-color:#1a56db; }
        .item-row { display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;position:relative;border:1px solid #dde2ee;padding:14px 14px 14px 14px;border-radius:10px;background:#fafafa;margin-bottom:4px; }
        .item-remove { position:absolute;top:-8px;right:-8px;background:#ef4444;color:#fff;border:none;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer;line-height:1; }
        .item-remove:hover { background:#dc2626; }
        .prev-lbl { font-size:10px;font-weight:700;letter-spacing:0.13em;text-transform:uppercase;color:#aab;text-align:center;margin-bottom:12px; }

        .pod-doc { background:#fff;border-radius:16px;overflow:hidden;font-family:'Inter',sans-serif;font-size:12px;color:#111;border:1px solid #e2e6ef;box-shadow:0 4px 24px rgba(26,86,219,0.07); }

        .pod-head { background:#1a56db;padding:26px 28px 22px;display:flex;justify-content:space-between;align-items:flex-start;gap:16px;position:relative;overflow:hidden; }
        .pod-head-ring1 { position:absolute;top:-30px;right:30px;width:130px;height:130px;border-radius:50%;border:1px solid rgba(255,255,255,0.15); }
        .pod-head-ring2 { position:absolute;top:10px;right:10px;width:80px;height:80px;border-radius:50%;border:1px solid rgba(255,255,255,0.1); }
        .pod-head-slash { position:absolute;bottom:0;right:0;width:45%;height:100%;background:rgba(255,255,255,0.05);clip-path:polygon(30% 0%,100% 0%,100% 100%,0% 100%); }

        .pod-logo { width:36px;height:36px;background:#fff;border-radius:9px;display:flex;align-items:center;justify-content:center;margin-bottom:10px; }
        .pod-main-title { font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.03em;line-height:1.1; }
        .pod-sub { font-size:10px;color:rgba(255,255,255,0.7);font-family:'JetBrains Mono',monospace;margin-top:5px;letter-spacing:0.06em; }

        .pod-head-right { text-align:right;position:relative;z-index:2; }
        .pod-ref-lbl { font-size:9px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-bottom:3px; }
        .pod-ref-val { font-size:16px;font-weight:800;color:#fff;font-family:'JetBrains Mono',monospace;letter-spacing:0.02em; }
        .pod-status { display:inline-block;margin-top:8px;padding:4px 12px;border-radius:20px;font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;background:rgba(255,255,255,0.2);color:#fff;border:1px solid rgba(255,255,255,0.3); }

        .pod-stripe { height:4px;background:linear-gradient(90deg,#60a5fa,#1a56db,#3b82f6); }

        .pod-body { padding:22px 28px;display:flex;flex-direction:column;gap:18px; }

        .s-head { font-size:9px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#aab;display:flex;align-items:center;gap:8px;margin-bottom:10px; }
        .s-head::after { content:'';flex:1;height:1px;background:#edf0f7; }

        .addr-grid { display:grid;grid-template-columns:1fr 1fr;gap:8px; }
        .addr-box { background:#fafafa;border:1px solid #dde6fb;border-radius:10px;padding:12px 14px; }
        .addr-box.full { grid-column:1/-1; }
        .addr-lbl { font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#1a56db;margin-bottom:5px;display:flex;align-items:center;gap:5px; }
        .lbl-pip { width:5px;height:5px;background:#1a56db;border-radius:50%;flex-shrink:0; }
        .addr-val { font-size:12px;color:#111;line-height:1.55;font-weight:500; }
        .addr-val.mono { font-family:'JetBrains Mono',monospace;font-size:11px; }
        .empty { color:#bbc;font-style:italic;font-size:11px; }
        .whitespace-pre-wrap { white-space: pre-wrap; }

        .chips { display:grid;grid-template-columns:repeat(3,1fr);gap:8px; }
        .chip { background:#fafafa;border:1px solid #dde6fb;border-radius:8px;padding:10px 12px; }
        .chip-lbl { font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#a3a3a3;margin-bottom:4px; }
        .chip-val { font-size:12px;font-weight:700;color:#111;font-family:'JetBrains Mono',monospace; }
        .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .desc-box { background:#fafafa;border:1px solid #dde6fb;border-radius:10px;padding:12px 14px;margin-bottom:8px; }
        .desc-box:last-child { margin-bottom:0; }
        .desc-lbl { font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#1a56db;margin-bottom:5px; }
        .desc-val { font-size:12px;color:#333;line-height:1.6; }

        .items-tbl-wrap { border:1px solid #dde6fb;border-radius:10px;overflow:hidden;margin-bottom:8px; }
        .items-tbl { width:100%;border-collapse:collapse;background:#fafafa; }
        .items-tbl th { background:#f0f4fd;text-align:left;padding:8px 12px;font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#1a56db;border-bottom:1px solid #dde6fb; }
        .items-tbl td { padding:10px 12px;font-size:11px;color:#111;border-bottom:1px solid #dde6fb;font-family:'JetBrains Mono',monospace;font-weight:600; }
        .items-tbl tr:last-child td { border-bottom:none; }

        .sig-grid { display:grid;grid-template-columns:1fr 1fr;gap:10px; }
        .sig-box { border:1.5px dashed #c7d6f9;border-radius:10px;padding:12px 14px;min-height:68px;display:flex;flex-direction:column;justify-content:space-between; }
        .sig-lbl { font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#a3a3a3; }
        .sig-line { border-bottom:1px solid #c7d6f9;margin-top:26px; }
        .sig-name { font-size:10px;color:#aab;margin-top:4px;font-family:'JetBrains Mono',monospace; }

        .pod-foot { background:#1a56db;padding:11px 28px;display:flex;justify-content:space-between;align-items:center;font-size:10px;color:rgba(255,255,255,0.6);font-family:'JetBrains Mono',monospace; }
        .pod-foot-brand { color:#fff;font-weight:700; }

        .toast-bar { margin:14px 24px 0;background:#1a56db;color:#fff;border-radius:10px;padding:11px 16px;font-size:12px;font-weight:700;font-family:'Inter',sans-serif;display:flex;align-items:center;justify-content:space-between;transition:opacity 0.3s; }
        .toast-hidden { opacity:0;pointer-events:none; }
        .toast-x { cursor:pointer;font-size:14px;background:none;border:none;color:#fff;padding:0 0 0 12px; }

        /* Print Styles */
        @media print {
          .shell { background: #fff !important; padding: 0 !important; }
          .layout { display: block; max-width: none; margin: 0; padding: 0; }
          .print-w100 { width: 100% !important; }
          .pod-doc { border: none !important; box-shadow: none !important; border-radius: 0 !important; }
          .print-hidden { display: none !important; }
        }
      `}</style>
      
      <div className="topbar print-hidden">
        <div className="brand">
          <img src="/images/logo.webp" alt="InvoAura Logistics" className="h-8 w-auto object-contain" />
          <div className="brand-name ml-2">InvoAura Logistics <span className="brand-tag">POD</span></div>
        </div>
        <div className="topbar-actions">
          {isPending && <span className="text-sm font-semibold text-[#1a56db] mr-4 animate-pulse">Saving...</span>}
          <button className="tbtn tbtn-ghost" onClick={onClose}>Close</button>
          <button className="tbtn tbtn-ghost" onClick={saveDraft}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1.5 10V7H10.5V10M8.5 1.5H1.5V7H10.5V3L8.5 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
            Save Draft
          </button>
          <button className="tbtn tbtn-primary" onClick={generatePdf}>
             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
             Save & Download PDF
          </button>
          <button className="tbtn tbtn-primary" onClick={generatePOD}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v7.5M3 6L6 9.5 9 6M1.5 11h9" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Generate POD Link
          </button>
        </div>
      </div>

      {/* Toast Bar */}
      <div className={`toast-bar print-hidden ${!showToastBar ? 'toast-hidden' : ''}`}>
        <span>{toastMsg}</span>
        <button className="toast-x" onClick={() => setShowToastBar(false)}>✕</button>
      </div>

      <div className="layout">
        {/* Form Options Panel */}
        <div className="form-card print-hidden">
          <div className="form-head">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2.5" stroke="#1a56db" strokeWidth="1.3"/><path d="M5 6h6M5 9h4" stroke="#1a56db" strokeWidth="1.3" strokeLinecap="round"/></svg>
            <div className="form-head-title">Create POD</div>
            <div className="form-head-pill">Proof of Delivery</div>
          </div>
          <div className="form-body">
            <div className="sec-label">Shipment info</div>
            <div className="row2">
              <div className="field">
                <label>Reference <span className="req">*</span></label>
                <input type="text" value={podDraft.refId} onChange={e => setPodDraft({...podDraft, refId: e.target.value})} placeholder="SHP-2024-0081" />
              </div>
              <div className="field">
                <label>Client Name <span className="req">*</span></label>
                <input type="text" value={podDraft.clientName} onChange={e => setPodDraft({...podDraft, clientName: e.target.value})} placeholder="Enter client name" />
              </div>
            </div>
            <div className="field">
              <label>Collection Address</label>
              <textarea value={podDraft.collectionDetails} onChange={e => setPodDraft({...podDraft, collectionDetails: e.target.value})} rows={2} placeholder="Enter collection address"></textarea>
            </div>
            <div className="field">
              <label>Delivery Address <span className="req">*</span></label>
              <textarea value={podDraft.deliveryDetails} onChange={e => setPodDraft({...podDraft, deliveryDetails: e.target.value})} rows={2} placeholder="Enter delivery address"></textarea>
            </div>
            
            <div className="sec-label">Logistics</div>
            <div className="row2">
              <div className="field">
                <label>Delivery Date</label>
                <input type="date" value={podDraft.podDeliveryDate} onChange={e => setPodDraft({...podDraft, podDeliveryDate: e.target.value})} />
              </div>
              <div className="field">
                <label>Driver Name</label>
                <input type="text" value={podDraft.podDriverName} onChange={e => setPodDraft({...podDraft, podDriverName: e.target.value})} placeholder="Enter driver name" />
              </div>
            </div>
            <div className="row3">
              <div className="field">
                <label>Vehicle Reg</label>
                <input type="text" value={podDraft.podVehicleReg} onChange={e => setPodDraft({...podDraft, podVehicleReg: e.target.value})} placeholder="AB12 CDE" />
              </div>
              <div className="field">
                <label>Pieces</label>
                <input type="text" value={podDraft.podPieces} onChange={e => setPodDraft({...podDraft, podPieces: e.target.value})} placeholder="e.g. 5" />
              </div>
              <div className="field">
                <label>Weight</label>
                <input type="text" value={podDraft.podWeight} onChange={e => setPodDraft({...podDraft, podWeight: e.target.value})} placeholder="25 kg" />
              </div>
            </div>
            <div className="field">
              <label>Dimensions</label>
              <input type="text" value={podDraft.podDimensions} onChange={e => setPodDraft({...podDraft, podDimensions: e.target.value})} placeholder="120 x 80 x 100 cm" />
            </div>
            
            <div className="sec-label">Goods</div>
            <div className="field">
              <label>Goods Description</label>
              <textarea value={podDraft.podGoodsDescription} onChange={e => setPodDraft({...podDraft, podGoodsDescription: e.target.value})} rows={3} placeholder="Enter description of goods"></textarea>
            </div>
            <div className="field">
              <label>Notes / Instructions</label>
              <textarea value={podDraft.podNotes} onChange={e => setPodDraft({...podDraft, podNotes: e.target.value})} rows={2} placeholder="Any additional notes or instructions"></textarea>
            </div>
            <div style={{marginTop:'20px', marginBottom:'8px', display:'flex', alignItems:'center', gap:'8px'}}>
              <span style={{fontSize:'10px',fontWeight:'700',letterSpacing:'0.13em',textTransform:'uppercase',color:'#888'}}>Additional Goods (Line Items)</span>
              <span style={{flex:1,height:'1px',background:'#edf0f7',display:'block'}}></span>
            </div>
            {goodsItems.map((item, i) => (
              <div key={i} className="item-row">
                 <button type="button" className="item-remove" onClick={() => {
                   const c = [...goodsItems]; c.splice(i, 1); setGoodsItems(c);
                 }}>✕</button>
                 <div className="field">
                   <label>Pieces</label>
                   <input type="text" value={item.pieces} onChange={e => { const c = [...goodsItems]; c[i].pieces = e.target.value; setGoodsItems(c); }} placeholder="e.g. 5" />
                 </div>
                 <div className="field">
                   <label>Weight</label>
                   <input type="text" value={item.weight} onChange={e => { const c = [...goodsItems]; c[i].weight = e.target.value; setGoodsItems(c); }} placeholder="25 kg" />
                 </div>
                 <div className="field">
                   <label>Dimensions</label>
                   <input type="text" value={item.dimensions} onChange={e => { const c = [...goodsItems]; c[i].dimensions = e.target.value; setGoodsItems(c); }} placeholder="120x80x100" />
                 </div>
              </div>
            ))}
            <button
              onClick={() => setGoodsItems([...goodsItems, {pieces: '', weight: '', dimensions: ''}])}
              style={{width:'100%',padding:'12px',marginTop:'4px',background:'#1a56db',color:'#fff',border:'none',borderRadius:'8px',fontFamily:'Inter,sans-serif',fontSize:'13px',fontWeight:'700',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',letterSpacing:'0.02em'}}
            >
              <span style={{fontSize:'20px',lineHeight:'1'}}>+</span> Add Line Item
            </button>
          </div>
          <div className="form-foot">
            <button className="tbtn tbtn-ghost" onClick={clearAll}>Clear form</button>
            <button className="tbtn tbtn-primary" onClick={generatePdf}>Save & Download PDF</button>
            <button className="tbtn tbtn-primary" onClick={generatePOD}>Generate POD Link</button>
          </div>
        </div>

        {/* Live Preview Panel */}
        <div className="print-w100">
          <div className="prev-lbl print-hidden">Live Preview</div>
          <div className="pod-doc">
            <div className="pod-head">
              <div className="pod-head-ring1"></div>
              <div className="pod-head-ring2"></div>
              <div className="pod-head-slash"></div>
              <div style={{position:"relative", zIndex:2}}>
                <div className="pod-logo" style={{background: 'transparent', display: 'flex', alignItems: 'center', marginBottom: '15px'}}>
                  <img src="/images/logo.webp" alt="InvoAura Logistics" style={{width: '240px', height: 'auto', objectFit: 'contain'}}/>
                </div>
                <div className="pod-main-title mt-4">Proof of<br/>Delivery</div>
                <div className="pod-sub">ISSUED: {getToday()}</div>
              </div>
              <div className="pod-head-right">
                <div className="text-[9px] text-[rgba(255,255,255,0.85)] text-right leading-relaxed mb-6 font-mono">
                  <div className="font-bold text-white uppercase tracking-wider mb-1 text-[10px]">InvoAura Logistics</div>
                  <div>1 Concourse Way</div>
                  <div>Sheffield</div>
                  <div>S1 2BJ</div>
                  <div>United Kingdom</div>
                  <div className="mt-1 font-bold text-[10px]">020 3773 1185</div>
                </div>
                <div className="pod-ref-lbl">Reference No.</div>
                <div className="pod-ref-val">{podDraft.refId || '—'}</div>
                <div className="pod-status">{lead?.status === 'Converted' ? 'READY' : 'PENDING'}</div>
              </div>
            </div>
            <div className="pod-stripe"></div>
            <div className="pod-body">
              <div>
                <div className="s-head">Addresses</div>
                <div className="addr-grid">
                  <div className="addr-box">
                    <div className="addr-lbl"><span className="lbl-pip"></span>Collected from</div>
                    <div className="addr-val whitespace-pre-wrap">
                      {podDraft.collectionDetails ? podDraft.collectionDetails : <span className="empty">&nbsp;</span>}
                    </div>
                  </div>
                  <div className="addr-box">
                    <div className="addr-lbl"><span className="lbl-pip"></span>Delivered to</div>
                    <div className="addr-val whitespace-pre-wrap">
                      {podDraft.deliveryDetails ? podDraft.deliveryDetails : <span className="empty">&nbsp;</span>}
                    </div>
                  </div>
                  <div className="addr-box full">
                    <div className="addr-lbl"><span className="lbl-pip"></span>Client</div>
                    <div className="addr-val mono">
                      {podDraft.clientName ? podDraft.clientName : <span className="empty">&nbsp;</span>}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="s-head">Logistics</div>
                <div className="chips">
                  <div className="chip"><div className="chip-lbl">Driver</div><div className="chip-val whitespace-pre-wrap truncate">{podDraft.podDriverName || '—'}</div></div>
                  <div className="chip"><div className="chip-lbl">Vehicle</div><div className="chip-val">{podDraft.podVehicleReg || '—'}</div></div>
                  <div className="chip"><div className="chip-lbl">Date</div><div className="chip-val">{fmtDate(podDraft.podDeliveryDate)}</div></div>
                  <div className="chip"><div className="chip-lbl">Pieces</div><div className="chip-val">{podDraft.podPieces || '—'}</div></div>
                  <div className="chip"><div className="chip-lbl">Weight</div><div className="chip-val">{podDraft.podWeight || '—'}</div></div>
                  <div className="chip"><div className="chip-lbl">Dims</div><div className="chip-val whitespace-pre-wrap truncate">{podDraft.podDimensions || '—'}</div></div>
                </div>
              </div>
              <div>
                <div className="s-head">Goods</div>
                <div className="desc-box">
                  <div className="desc-lbl">Description</div>
                  <div className="desc-val whitespace-pre-wrap">
                    {podDraft.podGoodsDescription ? podDraft.podGoodsDescription : <span className="empty">&nbsp;</span>}
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
                        {goodsItems.map((item, i) => (
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
                    {podDraft.podNotes ? podDraft.podNotes : <span className="empty">&nbsp;</span>}
                  </div>
                </div>
              </div>
              <div>
                <div className="s-head">Signatures</div>
                <div className="sig-grid">
                  <div className="sig-box">
                    <div className="sig-lbl">Driver Signature</div>
                    <div className="sig-line"></div>
                    <div className="sig-name">Name: {podDraft.podDriverName || '—'}</div>
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
              <span>REF: {podDraft.refId || '—'}</span>
              <span className="pod-foot-brand">InvoAura Logistics</span>
              <span>{getToday()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
