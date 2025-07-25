import { useState, useEffect, useCallback } from 'react';
import { SecureEntityOperations } from './secureEntityOperations';
import { useAccount } from './AccountContext';

export const useSecureEntityOperations = (entityClass) => {
  const { accountId, loading: accountLoading } = useAccount();
  const [secureOps, setSecureOps] = useState(null);

  useEffect(() => {
    if (!accountLoading && accountId) {
      setSecureOps(new SecureEntityOperations(entityClass));
    }
  }, [entityClass, accountId, accountLoading]);

  return {
    secureOps,
    loading: accountLoading || !secureOps,
    accountId
  };
};

export const useSecureEntityList = (entityClass, sortBy = '-created_date', limit = null) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { secureOps, loading: opsLoading } = useSecureEntityOperations(entityClass);

  const loadData = useCallback(async () => {
    if (!secureOps) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await secureOps.secureList(sortBy, limit);
      setData(result);
    } catch (err) {
      setError(err.message);
      console.error('Error loading secure entity list:', err);
    } finally {
      setLoading(false);
    }
  }, [secureOps, sortBy, limit]);

  useEffect(() => {
    if (!opsLoading && secureOps) {
      loadData();
    }
  }, [opsLoading, secureOps, loadData]);

  return {
    data,
    loading: loading || opsLoading,
    error,
    reload: loadData
  };
};

export { SecureEntityOperations } from './secureEntityOperations';