import { Input } from '../ui/Field';

const FIELDS = [
  { label: 'Username', name: 'username', type: 'text', placeholder: 'john_doe' },
  { label: 'Email', name: 'email', type: 'email', placeholder: 'john@example.com' },
  { label: 'Password', name: 'password', type: 'password', placeholder: '••••••••' },
  { label: 'Confirm password', name: 'confirm_password', type: 'password', placeholder: '••••••••' },
];

const OwnerForm = ({ values = {}, onChange, passwordHint }) => (
  <div className="pt-5 border-t border-ink/[0.06]">
    <h3 className="text-xs font-semibold text-ink-faint uppercase tracking-widest mb-4">
      Owner details
    </h3>

    <div className="grid grid-cols-2 gap-4">
      {FIELDS.map(({ label, name, type, placeholder }) => (
        <Input
          key={name}
          label={name === 'password' && passwordHint ? `${label} (optional)` : label}
          type={type}
          name={name}
          value={values?.[name] || ''}
          onChange={onChange}
          placeholder={name === 'password' && passwordHint ? passwordHint : placeholder}
        />
      ))}
    </div>
  </div>
);

export default OwnerForm;
