export default function ThemeToggle({ preference, onChange }) {
  const options = [
    { id: 'system', label: 'Auto' },
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
  ];

  return (
    <div className="theme-switch" role="group" aria-label="Color theme">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className={preference === option.id ? 'active' : ''}
          aria-pressed={preference === option.id}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
