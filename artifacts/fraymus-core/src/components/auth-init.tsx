import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { setAuthTokenGetter } from '@workspace/api-client-react';

export function AuthInit() {
  const { getToken } = useAuth();
  
  useEffect(() => {
    // Set the token getter so all generated hooks will automatically
    // attach the Authorization: Bearer <token> header.
    setAuthTokenGetter(() => getToken());
  }, [getToken]);
  
  return null;
}
