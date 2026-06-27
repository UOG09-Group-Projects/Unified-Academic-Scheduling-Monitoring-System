const ViewInstitutionModal = ({ institution, onClose }) => {
  if (!institution) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}>
      <div className="bg-white rounded-xl w-[460px] max-w-[95vw] shadow-xl"
        onClick={e => e.stopPropagation()}>

        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-medium">Institution Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>

        <div className="px-5 py-4 space-y-3">
          {institution.logo && (
            <img src={institution.logo} alt="Logo"
              className="w-16 h-16 rounded-lg object-cover mb-2" />
          )}
          {[
            ['ID', institution.id],
            ['Name', institution.name],
            ['Owner', institution.owner?.username],
            ['Email', institution.owner?.email],
            ['Created', new Date(institution.created_at).toLocaleDateString()],
          ].map(([label, val]) => (
            <div key={label} className="flex gap-3 text-sm">
              <span className="w-32 text-gray-400 font-medium shrink-0">{label}</span>
              <span className="text-gray-800">{val}</span>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewInstitutionModal;