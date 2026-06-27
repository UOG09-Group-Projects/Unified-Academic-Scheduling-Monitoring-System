const OwnerForm = ({ values = {}, onChange }) => (
  <div className="mt-5 pt-5 border-t border-gray-200">
    <h3 className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-4">
      Owner details
    </h3>

    <div className="grid grid-cols-2 gap-4">
      {[
        { label: 'Username', name: 'username', type: 'text', placeholder: 'john_doe' },
        { label: 'Email', name: 'email', type: 'email', placeholder: 'john@example.com' },
        { label: 'Password', name: 'password', type: 'password', placeholder: '••••••••' },
        { label: 'Confirm password', name: 'confirm_password', type: 'password', placeholder: '••••••••' },
      ].map(({ label, name, type, placeholder }) => (
        <div key={name}>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {label}
          </label>

          <input
            type={type}
            name={name}
            value={values?.[name] || ''}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:border-blue-400"
          />
        </div>
      ))}
    </div>
  </div>
);
export default OwnerForm;