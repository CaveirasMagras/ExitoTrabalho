import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Client } from '../types';

interface ClientContextData {
  clients: Client[];
  addClient: (client: Client) => void;
  updateClient: (id: string, client: Client) => void;
  deleteClient: (id: string) => void;
}

const ClientContext = createContext<ClientContextData>({} as ClientContextData);

export const ClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const storedClients = await AsyncStorage.getItem('@ExitoControle:clients');
      if (storedClients) {
        setClients(JSON.parse(storedClients));
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const saveClients = async (newClients: Client[]) => {
    try {
      await AsyncStorage.setItem('@ExitoControle:clients', JSON.stringify(newClients));
    } catch (error) {
      console.error('Erro ao salvar clientes:', error);
    }
  };

  const addClient = (client: Client) => {
    const newClients = [...clients, client];
    setClients(newClients);
    saveClients(newClients);
  };

  const updateClient = (id: string, updatedClient: Client) => {
    const newClients = clients.map(client => 
      client.id === id ? updatedClient : client
    );
    setClients(newClients);
    saveClients(newClients);
  };

  const deleteClient = (id: string) => {
    const newClients = clients.filter(client => client.id !== id);
    setClients(newClients);
    saveClients(newClients);
  };

  return (
    <ClientContext.Provider value={{ clients, addClient, updateClient, deleteClient }}>
      {children}
    </ClientContext.Provider>
  );
};

export const useClientContext = () => {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error('useClientContext deve ser usado dentro de um ClientProvider');
  }
  return context;
}; 