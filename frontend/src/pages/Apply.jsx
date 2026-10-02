import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getErrorMessage, getFieldErrors } from '../api/client';
import { getLevels, getProgrammes, submitApplication } from '../api/public';
import FormField from '../components/FormField';
import { CheckIcon, WhatsAppIcon } from '../components/Icons';
import PageHero from '../components/PageHero';
import Seo from '../components/Seo';
import { ErrorMessage, Loader } from '../components/Status';
import { useSiteInfo, whatsappLink } from '../context/SiteInfoContext';
import useApi from '../hooks/useApi';
import { EMAIL_PATTERN, isValidPhone } from '../utils/format';

const STEPS = [
  { title: 'Personal details', fields: ['full_name', 'email', 'phone', 'country', 'county_or_city'] },
  { title: 'Programme & level', fields: ['programme_id', 'level'] },
  {
    title: 'Education & background',
    fields: ['highest_education', 'church_or_organisation', 'how_did_you_hear', 'message'],
  },
  { title: 'Review & submit', fields: ['confirm'] },
];

const EDUCATION_OPTIONS = [
  'Primary (KCPE / equivalent)',
  'Secondary (KCSE / equivalent)',
  'Certificate',
  'Diploma',
  "Bachelor's degree",
  "Master's degree or higher",
  'Other',
];

const HEARD_OPTIONS = [
  'WhatsApp',
  'Facebook',
  'Church / Pastor',
  'Friend or family',
  'Poster or flyer',
  'Google / website',
  'Other',
];

const INITIAL_VALUES = {
  full_name: '',
  email: '',
  phone: '',
  country: 'Kenya',
  county_or_city: '',
  programme_id: '',
  level: '',
  highest_education: '',
  church_or_organisation: '',
  how_did_you_hear: '',
  message: '',
  confirm: false,
  website: '', // honeypot: must stay empty
};

/** Client-side validation for one step (the server validates again). */
function validateStep(stepIndex, values) {
  const errors = {};
  if (stepIndex === 0) {
    if (values.full_name.trim().length < 3) errors.full_name = 'Please enter your full name.';
    if (!values.email.trim()) errors.email = 'Email address is required.';
    else if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Enter a valid email address, e.g. name@example.com.';
    if (!values.phone.trim()) errors.phone = 'Phone number is required.';
    else if (!isValidPhone(values.phone))
      errors.phone = 'Enter a valid phone number, e.g. 0712 345 678 or +254 712 345 678.';
    if (values.country.trim().length < 2) errors.country = 'Country is required.';
    if (values.county_or_city.trim().length < 2) errors.county_or_city = 'County or city is required.';
  }
  if (stepIndex === 1) {
    if (!values.programme_id) errors.programme_id = 'Please choose a programme.';
    if (!values.level) errors.level = 'Please choose a level.';
  }
  if (stepIndex === 2) {
    if (!values.highest_education) errors.highest_education = 'Please choose your highest level of education.';
    if (values.message.length > 2000) errors.message = 'Message must be 2000 characters or fewer.';
  }
  if (stepIndex === 3) {
    if (!values.confirm) errors.confirm = 'Please confirm that your details are correct.';
  }
  return errors;
}

export default function Apply() {
  const [searchParams] = useSearchParams();
  const { info } = useSiteInfo();
  const programmes = useApi(() => getProgrammes(), []);
  const levels = useApi(getLevels, []);

  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [result, setResult] = useState(null);
  const headingRef = useRef(null);
  const formRef = useRef(null);
  const lastFocused = useRef({ step: 0, result: null });

  // Pre-select the programme (?programme=slug) and level (?level=5) from the URL.
  useEffect(() => {
    if (!programmes.data || !levels.data) return;
    const slug = searchParams.get('programme');
    const levelParam = searchParams.get('level');
    setValues((current) => {
      const next = { ...current };
      const match = slug ? programmes.data.find((programme) => programme.slug === slug) : null;
      if (match && !current.programme_id) next.programme_id = String(match.id);
      if (levelParam && !current.level && levels.data.some((level) => String(level.level_number) === levelParam)) {
        next.level = levelParam;
      }
      return next;
    });
  }, [programmes.data, levels.data, searchParams]);

  // Move keyboard / screen-reader focus to the step heading when the step changes
  // (not on first load; safe under React StrictMode's double effect run).
  useEffect(() => {
    if (lastFocused.current.step === step && lastFocused.current.result === result) return;
    lastFocused.current = { step, result };
    headingRef.current?.focus();
  }, [step, result]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setValues((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const focusFirstError = (stepErrors) => {
    const first = Object.keys(stepErrors)[0];
    if (!first) return;
    window.requestAnimationFrame(() => {
      const element = formRef.current?.querySelector(`[name="${first}"]`);
      element?.focus();
    });
  };

  const goNext = () => {
    const stepErrors = validateStep(step, values);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length) {
      focusFirstError(stepErrors);
      return;
    }
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const goBack = () => setStep((current) => Math.max(current - 1, 0));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (step < STEPS.length - 1) {
      goNext();
      return;
    }
    // Re-check every step before sending.
    for (let index = 0; index < STEPS.length; index += 1) {
      const stepErrors = validateStep(index, values);
      if (Object.keys(stepErrors).length) {
        setErrors(stepErrors);
        setStep(index);
        focusFirstError(stepErrors);
        return;
      }
    }

    setSubmitting(true);
    setSubmitError('');
    try {
      const { confirm, ...payload } = values; // eslint-disable-line no-unused-vars
      const response = await submitApplication({
        ...payload,
        programme_id: Number(values.programme_id),
        level: Number(values.level),
      });
      setResult(response);
      window.scrollTo(0, 0);
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      if (Object.keys(fieldErrors).length) {
        setErrors(fieldErrors);
        const stepWithError = STEPS.findIndex((item) => item.fields.some((field) => fieldErrors[field]));
        if (stepWithError >= 0) setStep(stepWithError);
        focusFirstError(fieldErrors);
      }
      setSubmitError(getErrorMessage(error, 'We could not submit your application. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProgramme = programmes.data?.find((programme) => String(programme.id) === values.programme_id);
  const selectedLevel = levels.data?.find((level) => String(level.level_number) === values.level);

  // ------------------------------------------------------------------ success
  if (result) {
    const chat = whatsappLink(
      info,
      `Hello, I have just applied for the ${result.programme} (Level ${result.level}). My reference number is ${result.reference}.`,
    );
    return (
      <>
        <Seo title="Application received" noIndex />
        <PageHero eyebrow="Apply / Enroll" title="Thank you for applying!" />
        <section className="section">
          <div className="container narrow">
            <div className="success-card" role="status">
              <span className="success-icon" aria-hidden="true">
                <CheckIcon size={36} strokeWidth={2.4} />
              </span>
              <h2 ref={headingRef} tabIndex={-1}>
                Your application has been received
              </h2>
              <p>Your reference number is</p>
              <p className="reference-number">{result.reference}</p>
              <p>
                Please keep this number. We will contact you about the next steps for the{' '}
                <strong>{result.programme}</strong> (Level {result.level}).
              </p>
              <div className="success-actions">
                {chat ? (
                  <a className="btn btn-whatsapp btn-lg" href={chat} target="_blank" rel="noopener noreferrer">
                    <WhatsAppIcon size={22} /> Chat with us on WhatsApp
                  </a>
                ) : null}
                <Link to="/" className="btn btn-outline btn-lg">
                  Back to home
                </Link>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  // ------------------------------------------------------------------ form
  const loadingOptions = programmes.loading || levels.loading;
  const optionsError = programmes.error || levels.error;

  return (
    <>
      <Seo
        title="Apply / Enroll"
        description="Apply online for a Certificate or Diploma programme with Manna College & Manna Bible Institute in four simple steps."
      />
      <PageHero
        eyebrow="Enroll today"
        title="Apply / Enroll"
        lead="Complete the four short steps below. It takes about five minutes."
      />

      <section className="section">
        <div className="container narrow">
          <ol className="stepper">
            {STEPS.map((item, index) => (
              <li
                key={item.title}
                className={`stepper-item ${index === step ? 'is-current' : ''} ${index < step ? 'is-done' : ''}`}
                aria-current={index === step ? 'step' : undefined}
              >
                <span className="stepper-dot" aria-hidden="true">
                  {index < step ? <CheckIcon size={16} strokeWidth={3} /> : index + 1}
                </span>
                <span className="stepper-label">{item.title}</span>
              </li>
            ))}
          </ol>

          <form ref={formRef} className="form-card" onSubmit={handleSubmit} noValidate>
            <h2 ref={headingRef} tabIndex={-1} className="form-step-title">
              <span className="sr-only">
                Step {step + 1} of {STEPS.length}:{' '}
              </span>
              {STEPS[step].title}
            </h2>

            {/* Honeypot: hidden from people, often filled in by spam bots */}
            <div className="hp-field" aria-hidden="true">
              <label htmlFor="website">Leave this field empty</label>
              <input
                id="website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={values.website}
                onChange={handleChange}
              />
            </div>

            {step === 0 ? (
              <div className="form-grid">
                <FormField
                  id="full_name"
                  label="Full name"
                  required
                  autoComplete="name"
                  value={values.full_name}
                  onChange={handleChange}
                  error={errors.full_name}
                  className="span-2"
                />
                <FormField
                  id="email"
                  label="Email address"
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  value={values.email}
                  onChange={handleChange}
                  error={errors.email}
                />
                <FormField
                  id="phone"
                  label="Phone / WhatsApp number"
                  type="tel"
                  required
                  autoComplete="tel"
                  inputMode="tel"
                  hint="e.g. 0712 345 678 or +254 712 345 678"
                  value={values.phone}
                  onChange={handleChange}
                  error={errors.phone}
                />
                <FormField
                  id="country"
                  label="Country"
                  required
                  autoComplete="country-name"
                  value={values.country}
                  onChange={handleChange}
                  error={errors.country}
                />
                <FormField
                  id="county_or_city"
                  label="County or city"
                  required
                  autoComplete="address-level2"
                  value={values.county_or_city}
                  onChange={handleChange}
                  error={errors.county_or_city}
                />
              </div>
            ) : null}

            {step === 1 ? (
              <>
                {loadingOptions ? <Loader label="Loading programmes…" /> : null}
                {optionsError ? (
                  <ErrorMessage
                    error={optionsError}
                    onRetry={() => {
                      programmes.reload();
                      levels.reload();
                    }}
                  />
                ) : null}
                {programmes.data && levels.data ? (
                  <>
                    <fieldset
                      className={`choice-group ${errors.programme_id ? 'has-error' : ''}`}
                      aria-describedby={errors.programme_id ? 'programme_id-error' : undefined}
                    >
                      <legend className="form-label">
                        Programme <span className="form-required" aria-hidden="true">*</span>
                      </legend>
                      <div className="choice-grid">
                        {programmes.data.map((programme) => (
                          <label key={programme.id} className="choice-card">
                            <input
                              type="radio"
                              name="programme_id"
                              value={String(programme.id)}
                              checked={values.programme_id === String(programme.id)}
                              onChange={handleChange}
                            />
                            <span className="choice-card-body">
                              <span className="choice-card-title">{programme.title}</span>
                              <span className="choice-card-sub">
                                {programme.level_label}
                                {programme.accreditation_note ? ` · ${programme.accreditation_note}` : ''}
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                      {errors.programme_id ? (
                        <p id="programme_id-error" className="form-error">
                          {errors.programme_id}
                        </p>
                      ) : null}
                    </fieldset>

                    <fieldset
                      className={`choice-group ${errors.level ? 'has-error' : ''}`}
                      aria-describedby={errors.level ? 'level-error' : undefined}
                    >
                      <legend className="form-label">
                        Level <span className="form-required" aria-hidden="true">*</span>
                      </legend>
                      <div className="choice-grid choice-grid-3">
                        {levels.data.map((level) => (
                          <label key={level.id} className="choice-card">
                            <input
                              type="radio"
                              name="level"
                              value={String(level.level_number)}
                              checked={values.level === String(level.level_number)}
                              onChange={handleChange}
                            />
                            <span className="choice-card-body">
                              <span className="choice-card-title">
                                Level {level.level_number}: {level.award}
                              </span>
                              <span className="choice-card-sub">Module {level.modules_required}</span>
                            </span>
                          </label>
                        ))}
                      </div>
                      {errors.level ? (
                        <p id="level-error" className="form-error">
                          {errors.level}
                        </p>
                      ) : null}
                    </fieldset>
                  </>
                ) : null}
              </>
            ) : null}

            {step === 2 ? (
              <div className="form-grid">
                <FormField
                  id="highest_education"
                  label="Highest level of education"
                  as="select"
                  required
                  value={values.highest_education}
                  onChange={handleChange}
                  error={errors.highest_education}
                >
                  <option value="">Select…</option>
                  {EDUCATION_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </FormField>
                <FormField
                  id="how_did_you_hear"
                  label="How did you hear about us?"
                  as="select"
                  value={values.how_did_you_hear}
                  onChange={handleChange}
                  error={errors.how_did_you_hear}
                >
                  <option value="">Select…</option>
                  {HEARD_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </FormField>
                <FormField
                  id="church_or_organisation"
                  label="Church or organisation"
                  autoComplete="organization"
                  value={values.church_or_organisation}
                  onChange={handleChange}
                  error={errors.church_or_organisation}
                  className="span-2"
                />
                <FormField
                  id="message"
                  label="Anything else you would like us to know?"
                  as="textarea"
                  rows={4}
                  maxLength={2000}
                  value={values.message}
                  onChange={handleChange}
                  error={errors.message}
                  className="span-2"
                />
              </div>
            ) : null}

            {step === 3 ? (
              <div className="review">
                <ReviewSection title="Personal details" onEdit={() => setStep(0)}>
                  <ReviewRow label="Full name" value={values.full_name} />
                  <ReviewRow label="Email" value={values.email} />
                  <ReviewRow label="Phone" value={values.phone} />
                  <ReviewRow label="Country" value={values.country} />
                  <ReviewRow label="County / City" value={values.county_or_city} />
                </ReviewSection>
                <ReviewSection title="Programme & level" onEdit={() => setStep(1)}>
                  <ReviewRow label="Programme" value={selectedProgramme?.title} />
                  <ReviewRow
                    label="Level"
                    value={
                      selectedLevel
                        ? `Level ${selectedLevel.level_number}: ${selectedLevel.award} (Module ${selectedLevel.modules_required})`
                        : ''
                    }
                  />
                </ReviewSection>
                <ReviewSection title="Education & background" onEdit={() => setStep(2)}>
                  <ReviewRow label="Highest education" value={values.highest_education} />
                  <ReviewRow label="Church / Organisation" value={values.church_or_organisation} />
                  <ReviewRow label="How you heard about us" value={values.how_did_you_hear} />
                  <ReviewRow label="Message" value={values.message} />
                </ReviewSection>

                <div className={`form-check ${errors.confirm ? 'has-error' : ''}`}>
                  <input
                    id="confirm"
                    name="confirm"
                    type="checkbox"
                    checked={values.confirm}
                    onChange={handleChange}
                    aria-invalid={errors.confirm ? 'true' : undefined}
                    aria-describedby={errors.confirm ? 'confirm-error' : undefined}
                  />
                  <label htmlFor="confirm">
                    I confirm that the information above is correct and I agree to be contacted about my application.
                  </label>
                </div>
                {errors.confirm ? (
                  <p id="confirm-error" className="form-error">
                    {errors.confirm}
                  </p>
                ) : null}
              </div>
            ) : null}

            {submitError ? (
              <div className="alert alert-error" role="alert">
                {submitError}
              </div>
            ) : null}

            <div className="form-actions">
              {step > 0 ? (
                <button type="button" className="btn btn-outline" onClick={goBack} disabled={submitting}>
                  Back
                </button>
              ) : (
                <span />
              )}
              {step < STEPS.length - 1 ? (
                <button type="submit" className="btn btn-maroon">
                  Continue
                </button>
              ) : (
                <button type="submit" className="btn btn-gold" disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit application'}
                </button>
              )}
            </div>
          </form>
        </div>
      </section>
    </>
  );
}

function ReviewSection({ title, onEdit, children }) {
  return (
    <section className="review-section">
      <div className="review-section-head">
        <h3>{title}</h3>
        <button type="button" className="btn btn-link" onClick={onEdit}>
          Edit<span className="sr-only"> {title}</span>
        </button>
      </div>
      <dl>{children}</dl>
    </section>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="review-row">
      <dt>{label}</dt>
      <dd>{value || <span className="muted">Not provided</span>}</dd>
    </div>
  );
}
