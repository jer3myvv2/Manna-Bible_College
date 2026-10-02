import { useState } from 'react';
import FormField from '../../components/FormField';

const CATEGORIES = ['Theology', 'Psychology'];

const EMPTY = {
  title: '',
  short_title: '',
  slug: '',
  category: 'Theology',
  tagline: '',
  description: '',
  accreditation_note: '',
  hero_image: '',
  is_active: true,
};

/** Create / edit form for a programme's own fields. */
export default function ProgrammeForm({ initial, onSubmit, submitLabel = 'Save programme', busy = false, fieldErrors = {} }) {
  const [values, setValues] = useState(() => ({ ...EMPTY, ...pick(initial) }));

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setValues((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(values);
  };

  const idPrefix = initial?.id ? `programme-${initial.id}` : 'programme-new';

  return (
    <form className="admin-form" onSubmit={handleSubmit} noValidate>
      <div className="form-grid">
        <FormField
          id={`${idPrefix}-title`}
          name="title"
          label="Full title"
          hint="e.g. Certificate | Diploma in Christian Ministry"
          required
          value={values.title}
          onChange={handleChange}
          error={fieldErrors.title}
          className="span-2"
        />
        <FormField
          id={`${idPrefix}-short_title`}
          name="short_title"
          label="Short title"
          hint="e.g. Christian Ministry"
          required
          value={values.short_title}
          onChange={handleChange}
          error={fieldErrors.short_title}
        />
        <FormField
          id={`${idPrefix}-slug`}
          name="slug"
          label="URL slug"
          hint="Lowercase words and hyphens. Left blank, it is made from the short title."
          value={values.slug}
          onChange={handleChange}
          error={fieldErrors.slug}
        />
        <FormField
          id={`${idPrefix}-category`}
          name="category"
          label="Category"
          as="select"
          required
          value={values.category}
          onChange={handleChange}
          error={fieldErrors.category}
        >
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </FormField>
        <FormField
          id={`${idPrefix}-accreditation_note`}
          name="accreditation_note"
          label="Accreditation note"
          hint="e.g. TVET Accredited or TVET CDACC"
          value={values.accreditation_note}
          onChange={handleChange}
          error={fieldErrors.accreditation_note}
        />
        <FormField
          id={`${idPrefix}-tagline`}
          name="tagline"
          label="Tagline"
          value={values.tagline}
          onChange={handleChange}
          error={fieldErrors.tagline}
          className="span-2"
        />
        <FormField
          id={`${idPrefix}-description`}
          name="description"
          label="Description"
          as="textarea"
          rows={4}
          value={values.description}
          onChange={handleChange}
          error={fieldErrors.description}
          className="span-2"
        />
        <FormField
          id={`${idPrefix}-hero_image`}
          name="hero_image"
          label="Hero image path"
          hint="A file in frontend/public/images, e.g. /images/programme-christian-ministry.svg"
          value={values.hero_image}
          onChange={handleChange}
          error={fieldErrors.hero_image}
          className="span-2"
        />
      </div>
      <label className="toggle">
        <input type="checkbox" name="is_active" checked={values.is_active} onChange={handleChange} /> Active (shown on the
        website)
      </label>
      <div className="form-actions form-actions-end">
        <button type="submit" className="btn btn-gold" disabled={busy}>
          {busy ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

function pick(programme) {
  if (!programme) return {};
  const result = {};
  Object.keys(EMPTY).forEach((key) => {
    if (programme[key] !== undefined && programme[key] !== null) result[key] = programme[key];
  });
  return result;
}
