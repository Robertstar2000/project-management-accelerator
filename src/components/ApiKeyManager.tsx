import React from 'react';
import { LlmProviderModal } from './LlmProviderModal';
import { User, LlmProviderId } from '../types';

interface ApiKeyManagerProps {
    isOpen?: boolean;
    onClose?: () => void;
    currentUser?: User | null;
    initialProvider?: LlmProviderId;
}

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({
    isOpen = false,
    onClose = () => {},
    currentUser,
    initialProvider
}) => {
    return (
        <LlmProviderModal
            isOpen={isOpen}
            onClose={onClose}
            currentUser={currentUser}
            initialProvider={initialProvider}
        />
    );
};

export default ApiKeyManager;
