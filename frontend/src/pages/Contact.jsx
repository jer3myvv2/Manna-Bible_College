import { useState } from 'react';
import { getErrorMessage, getFieldErrors } from '../api/client';
import { submitContact } from '../api/public';
import ClassTimeBox from '../components/ClassTimeBox';
import FormField from '../components/FormField';
import { CheckIcon, GlobeIcon, MailIcon, PhoneIcon, WhatsAppIcon } from '../components/Icons';
import PageHero from '../components/PageHero';
import Seo from '../components/Seo';
import { ErrorMessage, Loader } from '../components/Status';
import { useSiteInfo, whatsappLink } from '../context/SiteInfoContext';
import { EMAIL_PATTERN, isValidPhone } from '../utils/format';

const INITIAL = { name: '', email: '', phone: '', subject: '', message: '', website: '' };

function validate(values) {
  const errors = {};
  if (values.name.trim().length < 2) errors.name = 'Please enter your name.';
  if (!values.email.trim()) errors.email = 'Email address is required.';
  else if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Enter a valid email address, e.g. name@example.com.';
  if (values.phone.trim() && !isValidPhone(values.phone))
    errors.phone = 'Enter a valid phone number, e.g. 0712 345 678 or +254 712 345 678.';
  if (values.subject.trim().length < 3) errors.subject = 'Please enter a subject.';
  if (values.message.trim().length < 10) errors.message = 'Please write a message of at least 10 characters.';
  return errors;
}

export default function Contact() {
  const { info, loading, error, reload } = useSiteInfo();
  const [values, setValues] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ sending: false, sent: false, error: '' });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) {
      event.currentTarget.querySelector(`[name="${Object.keys(found)[0]}"]`)?.focus();
      return;
    }
    setStatus({ sending: true, sent: false, error: '' });
    try {
      await submitContact(values);
      setValues(INITIAL);
      setStatus({ sending: false, sent: true, error: '' });
    } catch (err) {
      setErrors(getFieldErrors(err));
      setStatus({ sending: false, sent: false, error: getErrorMessage(err, 'We could not send your message.') });
    }
  };

  return (
    <>
      <Seo
        title="Contact Us"
        description="Call, WhatsApp or email Manna College & Manna Bible Institute about our online Certificate and Diploma programmes."
      />
      <PageHero eyebrow="Get in touch" title="Contact Us" lead="We would love to hear from you. Call, WhatsApp or send us a message." />

      <section className="section">
        <div className="container contact-grid">
          <div className="contact-info">
            {loading ? <Loader label="Loading contact details…" /> : null}
            {error ? <ErrorMessage error={error} onRetry={reload} /> : null}
            {info ? (
              <>
                <h2 className="section-title section-title-sm">Contact details</h2>
                <ul className="contact-cards">
                  <li className="contact-card">
                    <PhoneIcon size={26} />
                    <div>
                      <h3>Call us</h3>
                      <a href={info.phone_href}>{info.phone}</a>
                    </div>
                  </li>
                  <li className="contact-card">
                    <WhatsAppIcon size={26} />
                    <div>
                      <h3>WhatsApp</h3>
                      <a href={info.whatsapp_url} target="_blank" rel="noopener noreferrer">
                        {info.whatsapp}
                      </a>
                    </div>
                  </li>
                  <li className="contact-card">
                    <MailIcon size={26} />
                    <div>
                      <h3>Email</h3>
                      {info.emails.map((email) => (
                        <a key={email} href={`mailto:${email}`} className="block-link">
                          {email}
                        </a>
                      ))}
                    </div>
                  </li>
                  <li className="contact-card">
                    <GlobeIcon size={26} />
                    <div>
                      <h3>Websites</h3>
                      {info.websites.map((site) => (
                        <a key={site.url} href={site.url} target="_blank" rel="noopener noreferrer" className="block-link">
                          {site.label}
                        </a>
                      ))}
                    </div>
                  </li>
                </ul>
                <div className="contact-quick">
                  <a className="btn btn-maroon" href={info.phone_href}>
                    <PhoneIcon size={20} /> Call now
                  </a>
                  <a
                    className="btn btn-whatsapp"
                    href={whatsappLink(info, 'Hello, I have a question about your programmes.')}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <WhatsAppIcon size={20} /> WhatsApp us
                  </a>
                  <a className="btn btn-outline" href={`mailto:${info.emails[0]}`}>
                    <MailIcon size={20} /> Email us
                  </a>
                </div>
                <ClassTimeBox />
              </>
            ) : null}
          </div>

          <div>
            <form className="form-card" onSubmit={handleSubmit} noValidate aria-labelledby="contact-form-heading">
              <h2 id="contact-form-heading" className="form-step-title">
                Send us a message
              </h2>

              {status.sent ? (
                <div className="alert alert-success" role="status">
                  <CheckIcon size={20} strokeWidth={2.6} /> Thank you! Your message has been sent. We will get back to
                  you soon.
                </div>
              ) : null}

              <div className="hp-field" aria-hidden="true">
                <label htmlFor="contact-website">Leave this field empty</label>
                <input
                  id="contact-website"
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={values.website}
                  onChange={handleChange}
                />
              </div>

              <div className="form-grid">
                <FormField
                  id="name"
                  label="Your name"
                  required
                  autoComplete="name"
                  value={values.name}
                  onChange={handleChange}
                  error={errors.name}
                />
                <FormField
                  id="email"
                  label="Email address"
                  type="email"
                  required
                  autoComplete="email"
                  value={values.email}
                  onChange={handleChange}
                  error={errors.email}
                />
                <FormField
                  id="phone"
                  label="Phone number"
                  type="tel"
                  autoComplete="tel"
                  value={values.phone}
                  onChange={handleChange}
                  error={errors.phone}
                />
                <FormField
                  id="subject"
                  label="Subject"
                  required
                  value={values.subject}
                  onChange={handleChange}
                  error={errors.subject}
                />
                <FormField
                  id="message"
                  label="Message"
                  as="textarea"
                  rows={5}
                  required
                  maxLength={3000}
                  value={values.message}
                  onChange={handleChange}
                  error={errors.message}
                  className="span-2"
                />
              </div>

              {status.error ? (
                <div className="alert alert-error" role="alert">
                  {status.error}
                </div>
              ) : null}

              <div className="form-actions form-actions-end">
                <button type="submit" className="btn btn-gold" disabled={status.sending}>
                  {status.sending ? 'Sending…' : 'Send message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
