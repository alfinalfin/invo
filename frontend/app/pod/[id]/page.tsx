"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { ref as databaseRef, get } from "firebase/database";

import { PODDocument } from "../../../components/crm/pod-document";
import { AuthGate } from "../../../components/crm/auth-gate";
import { db, rtdb, leadsCollectionName, realtimeLeadsPath, hasRealtimeDatabaseConfig } from "../../../lib/firebase";
import { mapFirestoreLead, mapRealtimeLeads } from "../../../lib/firebase-leads";

export default function PodPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function fetchLead() {
      try {
        if (rtdb && hasRealtimeDatabaseConfig) {
          const snapshot = await get(databaseRef(rtdb, `${realtimeLeadsPath}/${id}`));
          if (snapshot.exists()) {
            const mapped = mapRealtimeLeads({ [id as string]: snapshot.val() });
            setLead(mapped[0] || null);
          } else {
            setError("POD not found.");
          }
        } else if (db) {
          const snapshot = await getDoc(doc(db, leadsCollectionName, id as string));
          if (snapshot.exists()) {
            setLead(mapFirestoreLead(snapshot as any));
          } else {
            setError("POD not found.");
          }
        } else {
          setError("Database not configured.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load POD details. You may need to be logged in.");
      } finally {
        setLoading(false);
      }
    }

    fetchLead();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
         <p className="text-slate-500 font-medium">Loading Document...</p>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
         <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
            <p className="text-red-500 font-medium mb-2">Error Loading Document</p>
            <p className="text-slate-500 text-sm">{error}</p>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 sm:p-12 print:p-0 print:bg-white text-black font-sans">
       <div className="max-w-[816px] mx-auto mb-6 flex justify-end print:hidden">
          <button 
            onClick={() => window.print()}
            className="bg-black text-white px-5 py-2.5 rounded-full font-semibold text-sm transition hover:bg-black/80"
          >
            Print PDF
          </button>
       </div>
       <PODDocument 
         lead={lead} 
         podData={{
            podDeliveryDate: lead.podDeliveryDate,
            podDriverName: lead.podDriverName,
            podVehicleReg: lead.podVehicleReg,
            podPieces: lead.podPieces,
            podWeight: lead.podWeight,
            podDimensions: lead.podDimensions,
            podGoodsDescription: lead.podGoodsDescription,
            podNotes: lead.podNotes,
         }}
       />
    </div>
  );
}
