"use client";

import { motion } from "framer-motion";

const manifestoLines = [
  "Personalised, professional, punctual.",
  "Complete peace of mind from booking to delivery.",
  "Collected and delivered A to B, safely, securely, on time, every time.",
];

export function ManifestoSection() {
  return (
    <section id="about" className="section-shell py-20 sm:py-24">
      <div className="panel-glass relative overflow-hidden p-8 sm:p-10 lg:p-14">
        <div className="absolute left-0 top-8 h-40 w-40 rounded-full bg-radial-cobalt blur-3xl" />
        <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-radial-ember blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[0.45fr_1fr] lg:items-start">
          <div>
            <div className="eyebrow">The Aura Promise</div>
            <h2 className="section-heading mt-5 max-w-md text-balance">
              Calm, cinematic logistics with a human edge.
            </h2>
          </div>

          <div className="space-y-4">
            {manifestoLines.map((line, index) => (
              <motion.p
                key={line}
                initial={{ opacity: 0, y: 24, filter: "blur(12px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, amount: 0.45 }}
                transition={{ duration: 0.55, delay: index * 0.12 }}
                className="text-2xl font-semibold leading-tight text-white sm:text-3xl lg:text-4xl"
                style={{
                  textShadow:
                    index === 1 ? "0 0 30px rgba(46, 91, 255, 0.28)" : "none",
                }}
              >
                {line}
              </motion.p>
            ))}
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.55, delay: 0.42 }}
              className="max-w-2xl text-base leading-8 text-slate-300"
            >
              INVO AURA is built for businesses that want responsive courier
              coverage without the noise: one premium operations layer, one
              visible chain of communication, and one dependable route from
              pickup to proof of delivery.
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  );
}
