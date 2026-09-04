export default function PageHeader({ icon: Icon, title, lead, actions }) {
  return (
    <div className="page-header">
      <div className="page-header-copy">
        {Icon && (
          <span className="page-header-icon" aria-hidden="true">
            <Icon size={20} strokeWidth={1.75} />
          </span>
        )}
        <div>
          <h2>{title}</h2>
          {lead && <p className="page-lead">{lead}</p>}
        </div>
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}
