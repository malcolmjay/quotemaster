import React from 'react';
import { Lock, Eye } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { HelpTooltip } from './HelpTooltip';

interface PermissionGuardProps {
  table: string;
  action: 'create' | 'read' | 'update' | 'delete';
  children: React.ReactElement;
  fallback?: React.ReactElement | null;
  showTooltip?: boolean;
  hideIfNoPermission?: boolean;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  table,
  action,
  children,
  fallback = null,
  showTooltip = true,
  hideIfNoPermission = false,
}) => {
  const { hasPermission, loading } = usePermissions();

  if (loading) {
    return null;
  }

  const allowed = hasPermission(table, action);

  if (!allowed) {
    if (hideIfNoPermission) {
      return fallback;
    }

    const disabledChild = React.cloneElement(children, {
      disabled: true,
      className: `${children.props.className || ''} opacity-50 cursor-not-allowed`,
      onClick: undefined,
    });

    if (showTooltip) {
      return (
        <HelpTooltip content={`You don't have permission to ${action} ${table}`}>
          {disabledChild}
        </HelpTooltip>
      );
    }

    return disabledChild;
  }

  return children;
};

interface ReadOnlyBadgeProps {
  table: string;
  className?: string;
}

export const ReadOnlyBadge: React.FC<ReadOnlyBadgeProps> = ({ table, className = '' }) => {
  const { getTablePermissions, loading } = usePermissions();

  if (loading) return null;

  const perms = getTablePermissions(table);

  if (!perms || !perms.can_read) return null;

  const isReadOnly = perms.can_read && !perms.can_create && !perms.can_update && !perms.can_delete;

  if (!isReadOnly) return null;

  return (
    <HelpTooltip content="You have read-only access to this section. Contact an administrator to request additional permissions.">
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300 ${className}`}
      >
        <Eye className="w-3 h-3 mr-1" />
        Read Only
      </span>
    </HelpTooltip>
  );
};

interface PermissionBadgeProps {
  table: string;
  compact?: boolean;
  className?: string;
}

export const PermissionBadge: React.FC<PermissionBadgeProps> = ({
  table,
  compact = false,
  className = ''
}) => {
  const { getTablePermissions, loading, isAdmin } = usePermissions();

  if (loading) return null;

  if (isAdmin) {
    return (
      <HelpTooltip content="You have full administrative access to all features">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300 ${className}`}
        >
          <Lock className="w-3 h-3 mr-1" />
          Admin
        </span>
      </HelpTooltip>
    );
  }

  const perms = getTablePermissions(table);

  if (!perms || !perms.can_read) {
    return (
      <HelpTooltip content="You don't have access to this section">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300 ${className}`}
        >
          <Lock className="w-3 h-3 mr-1" />
          No Access
        </span>
      </HelpTooltip>
    );
  }

  const isReadOnly = perms.can_read && !perms.can_create && !perms.can_update && !perms.can_delete;
  const isFullAccess = perms.can_create && perms.can_read && perms.can_update && perms.can_delete;

  if (isFullAccess) {
    if (compact) return null;
    return (
      <HelpTooltip content="You have full access: create, read, update, and delete">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300 ${className}`}
        >
          Full Access
        </span>
      </HelpTooltip>
    );
  }

  if (isReadOnly) {
    return (
      <HelpTooltip content="You have read-only access. Contact an administrator for additional permissions.">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300 ${className}`}
        >
          <Eye className="w-3 h-3 mr-1" />
          Read Only
        </span>
      </HelpTooltip>
    );
  }

  const actions = [];
  if (perms.can_create) actions.push('Create');
  if (perms.can_read) actions.push('Read');
  if (perms.can_update) actions.push('Update');
  if (perms.can_delete) actions.push('Delete');

  return (
    <HelpTooltip content={`You have permission to: ${actions.join(', ')}`}>
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-300 ${className}`}
      >
        Limited Access
      </span>
    </HelpTooltip>
  );
};
