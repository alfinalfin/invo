export type FaqItem = {
  question: string;
  answer: string;
};

export const faqItems: FaqItem[] = [
  {
    question: "Do you provide large vehicles?",
    answer:
      "Yes. We source everything from agile vans to larger dedicated vehicles, depending on payload, dimensions, and delivery urgency.",
  },
  {
    question: "What is your fastest service?",
    answer:
      "Our fastest option is a dedicated same-day response with rapid dispatch planning, live updates, and direct point-to-point movement.",
  },
  {
    question: "How much notice do you need?",
    answer:
      "For urgent jobs, we can usually begin dispatch planning immediately. Larger or specialist vehicles benefit from more notice, especially for time-specific windows.",
  },
  {
    question: "What are your rates?",
    answer:
      "Pricing is tailored to route length, urgency, vehicle type, load profile, and any handling requirements. That keeps quotes accurate instead of generic.",
  },
  {
    question: "Can individuals use your services, or is it for businesses only?",
    answer:
      "Our focus is business logistics, but we can also support private clients when the shipment suits a dedicated courier workflow.",
  },
];
