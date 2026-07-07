import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";

const CONTACT_ITEMS = [
  {
    icon: Mail,
    title: "Email",
    info: "hello@schededu.com",
  },
  {
    icon: Phone,
    title: "Phone",
    info: "+94 11 234 5678",
  },
  {
    icon: MapPin,
    title: "Office",
    info: "Colombo 03, Western Province, Sri Lanka",
  },
  {
    icon: Clock,
    title: "Hours",
    info: "Monday – Friday, 9:00 AM – 5:30 PM",
  },
];

function Field({ label, placeholder, type = "text", className = "" }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-[0.8rem] font-semibold text-slate-800 tracking-wide">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        className="px-3.5 py-2.5 border border-slate-300 rounded-lg text-[0.875rem] text-slate-800 bg-white outline-none focus:border-blue-600 transition-colors placeholder-slate-400"
      />
    </div>
  );
}

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <section id="contact" className="py-24 px-[5%] bg-slate-50">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start max-w-[1100px] mx-auto">
        {/* Info */}
        <div>
          <p className="text-xs font-semibold tracking-[0.15em] uppercase text-blue-600 mb-3">
            Get in touch
          </p>
          <h2 className="font-syne font-bold text-[clamp(1.9rem,3.5vw,2.8rem)] leading-[1.15] tracking-[-0.5px] text-slate-800 mb-4">
            Questions? We're here.
          </h2>
          <p className="text-[1.05rem] text-slate-500 leading-[1.7] mb-10">
            Whether you're evaluating for your institution or need a custom
            deployment, our team is ready to help.
          </p>

          <div className="flex flex-col gap-5">
            {CONTACT_ITEMS.map(({ icon: Icon, title, info }) => (
              <div key={title} className="flex gap-3.5 items-start">
                <div className="w-10 h-10 bg-white border border-slate-300 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon size={17} className="text-blue-600" />
                </div>
                <div>
                  <h4 className="text-[0.85rem] font-semibold text-slate-800 mb-0.5">
                    {title}
                  </h4>
                  <p className="text-[0.85rem] text-slate-500 leading-[1.5]">
                    {info}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-300 rounded-2xl p-9"
        >
          <h3 className="font-syne font-bold text-[1.15rem] text-slate-800 mb-6">
            Send a message
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <Field label="First Name" placeholder="Amal" />
            <Field label="Last Name" placeholder="Perera" />
          </div>

          <div className="flex flex-col gap-4 mb-0">
            <Field
              label="Email"
              placeholder="amal@university.edu"
              type="email"
            />
            <Field
              label="Institution"
              placeholder="University of Colombo"
            />
          </div>

          {/* Select */}
          <div className="flex flex-col gap-1.5 mt-4 mb-4">
            <label className="text-[0.8rem] font-semibold text-slate-800 tracking-wide">
              Enquiry Type
            </label>
            <select className="px-3.5 py-2.5 border border-slate-300 rounded-lg text-[0.875rem] text-slate-800 bg-white outline-none focus:border-blue-600 transition-colors cursor-pointer">
              <option>General Enquiry</option>
              <option>Request a Demo</option>
              <option>Pricing &amp; Plans</option>
              <option>Technical Support</option>
              <option>Partnership</option>
            </select>
          </div>

          {/* Textarea */}
          <div className="flex flex-col gap-1.5 mb-5">
            <label className="text-[0.8rem] font-semibold text-slate-800 tracking-wide">
              Message
            </label>
            <textarea
              rows={4}
              placeholder="Tell us about your institution's needs…"
              className="px-3.5 py-2.5 border border-slate-300 rounded-lg text-[0.875rem] text-slate-800 bg-white outline-none focus:border-blue-600 transition-colors resize-none placeholder-slate-400"
            />
          </div>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-blue-600 text-white border-none rounded-lg font-semibold text-[0.9rem] tracking-wide transition-colors duration-200 hover:bg-blue-700 cursor-pointer"
          >
            {submitted ? (
              "✅ Message Sent!"
            ) : (
              <>
                Send Message
                <Send size={15} />
              </>
            )}
          </button>
        </form>
      </div>
    </section>
  );
}