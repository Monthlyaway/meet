'use client';

import { useState } from 'react';
import styles from '../styles/ChannelSidebar.module.css';

interface CreateChannelButtonProps {
  onCreateChannel: (displayName: string) => Promise<void>;
}

export function CreateChannelButton({ onCreateChannel }: CreateChannelButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  console.log('🆕 CreateChannelButton: Rendering button', { isModalOpen });

  const openModal = () => {
    console.log('🆕 CreateChannelButton: Opening modal');
    setIsModalOpen(true);
    setChannelName('');
    setError('');
  };

  const closeModal = () => {
    console.log('🆕 CreateChannelButton: Closing modal');
    setIsModalOpen(false);
    setChannelName('');
    setError('');
    setIsLoading(false);
  };

  const validateChannelName = (name: string): string | null => {
    if (!name.trim()) {
      return 'Channel name is required';
    }
    if (name.trim().length < 2) {
      return 'Channel name must be at least 2 characters';
    }
    if (name.trim().length > 50) {
      return 'Channel name must be less than 50 characters';
    }
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(name.trim())) {
      return 'Channel name can only contain letters, numbers, spaces, hyphens, and underscores';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = channelName.trim();
    const validationError = validateChannelName(trimmedName);

    if (validationError) {
      setError(validationError);
      return;
    }

    console.log('🆕 CreateChannelButton: Creating channel', { channelName: trimmedName });

    setIsLoading(true);
    setError('');

    try {
      await onCreateChannel(trimmedName);
      console.log('🆕 CreateChannelButton: Channel created successfully');
      closeModal();
    } catch (error) {
      console.error('🆕 CreateChannelButton: Error creating channel', error);
      setError('Failed to create channel. Please try again.');
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setChannelName(value);

    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  return (
    <>
      <button
        className={styles.createChannelButton}
        onClick={openModal}
        type="button"
      >
        <span className={styles.createChannelIcon}>+</span>
        Create Channel
      </button>

      {isModalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={handleOverlayClick}
          onKeyDown={handleKeyDown}
        >
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Create New Channel</h3>
              <p>Add a new team channel to organize discussions</p>
            </div>

            <form className={styles.modalForm} onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="channelName">Channel Name</label>
                <input
                  id="channelName"
                  type="text"
                  value={channelName}
                  onChange={handleInputChange}
                  placeholder="e.g., Design Team"
                  autoFocus
                  disabled={isLoading}
                />
                {error && (
                  <div className={styles.errorMessage}>{error}</div>
                )}
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={closeModal}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isLoading || !channelName.trim()}
                >
                  {isLoading ? 'Creating...' : 'Create Channel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}