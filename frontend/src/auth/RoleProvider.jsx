import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Navigate } from 'react-router-dom';

/**
 * Higher-Order Component/Provider to restrict routes based on roles
 * Or render alternative components based on standard user vs admin.
 */
export const RoleProvider = ({ allowedRoles, children }) => {
    const { authRole } = useAppContext();

    if (!allowedRoles.includes(authRole)) {
        return <Navigate to="/" replace />;
    }

    return children;
};
