// src/hooks/useClients.ts
import { useState, useEffect } from 'react';
import { clientStore } from '../models/ClientObserver';
import { Client } from '../models/Clients';

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>(clientStore.getClients());

  useEffect(() => {
    const handleUpdate = (newClients: Client[]) => setClients(newClients);
    
    clientStore.subscribe(handleUpdate);
    return () => clientStore.unsubscribe(handleUpdate);
  }, []);

  return clients;
};

export default useClients;