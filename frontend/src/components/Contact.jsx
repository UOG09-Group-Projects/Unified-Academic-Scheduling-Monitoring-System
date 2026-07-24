import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Clock, Send, Check, AlertCircle } from "lucide-react";
import { Input, Select, Textarea } from "./ui/Field";
import Button from "./ui/Button";
import Card from "./ui/Card";
import contactService from "../services/contactService";

const CONTACT_ITEMS = [
  { icon: Mail, title: "Email", info: "hello@lightlearn.app" },
  { icon: Phone, title: "Phone", info: "+94 11 234 5678" },
  { icon: MapPin, title: "Office", info: "Colombo 03, Western Province, Sri Lanka" },
  { icon: Clock, title: "Hours", info: "Monday – Friday, 9:00 AM – 5:30 PM" },
];

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);

    setSending(true);
    setError(null);
    try {
      await contactService.submit({
        first_name: data.get("firstName"),
        last_name: data.get("lastName"),
        email: data.get("email"),
        institution_name: data.get("institution"),
        enquiry_type: data.get("enquiryType"),
        message: data.get("message"),
      });
      form.reset();
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" className="py-28 px-[5%] bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start max-w-[1100px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-xs font-semibold tracking-[0.15em] uppercase text-brand-700 mb-3">
            Get in touch
          </p>
          <h2 className="font-display font-bold text-[clamp(1.9rem,3.5vw,2.75rem)] leading-[1.15] tracking-tight text-ink mb-4">
            Questions? We're here.
          </h2>
          <p className="text-[1.05rem] text-ink-faint leading-[1.7] mb-10">
            Whether you're evaluating for your institution or need a custom
            deployment, our team is ready to help.
          </p>

          <div className="flex flex-col gap-5">
            {CONTACT_ITEMS.map(({ icon: Icon, title, info }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="flex gap-3.5 items-start"
              >
                <div className="w-10 h-10 bg-brand-50 border border-ink/[0.08] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon size={17} className="text-brand-700" />
                </div>
                <div>
                  <h4 className="text-[0.85rem] font-semibold text-ink mb-0.5">{title}</h4>
                  <p className="text-[0.85rem] text-ink-faint leading-[1.5]">{info}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card padding="p-9">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <h3 className="font-display font-bold text-[1.15rem] text-ink mb-1">
                Send a message
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <Input name="firstName" label="First Name" placeholder="Amal" required />
                <Input name="lastName" label="Last Name" placeholder="Perera" required />
              </div>

              <Input name="email" label="Email" type="email" placeholder="amal@university.edu" required />
              <Input name="institution" label="Institution" placeholder="University of Colombo" />

              <Select name="enquiryType" label="Enquiry Type" defaultValue="GENERAL">
                <option value="GENERAL">General Enquiry</option>
                <option value="DEMO">Request a Demo</option>
                <option value="PRICING">Pricing & Plans</option>
                <option value="SUPPORT">Technical Support</option>
                <option value="PARTNERSHIP">Partnership</option>
              </Select>

              <Textarea name="message" label="Message" rows={4} placeholder="Tell us about your institution's needs…" required />

              {error && (
                <p className="flex items-center gap-1.5 text-sm text-danger">
                  <AlertCircle size={14} /> {error}
                </p>
              )}

              <Button type="submit" variant="brand" size="lg" className="w-full mt-1" disabled={sending}>
                {submitted ? (
                  <span className="flex items-center gap-2"><Check size={16} /> Message sent!</span>
                ) : (
                  <span className="flex items-center gap-2">
                    {sending ? "Sending…" : "Send message"} {!sending && <Send size={15} />}
                  </span>
                )}
              </Button>
            </form>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
