/**
 * Wraps text that was NOT supplied by the school, so it is easy to find and
 * replace. Once the school approves the wording, remove the wrapper.
 */
export default function PlaceholderNote({ children, as: Tag = 'div' }) {
  return (
    <Tag className="placeholder-content" data-placeholder="true">
      <span className="placeholder-tag">Placeholder text: school to edit</span>
      {children}
    </Tag>
  );
}
