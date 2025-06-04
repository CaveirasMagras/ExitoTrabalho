import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, FAB, useTheme, List, IconButton, TextInput, Button, Portal, Modal, Checkbox, Menu } from 'react-native-paper';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  cnpj: string;
  isProLabore: boolean;
}

interface PayrollStatus {
  [key: string]: boolean; // key format: "clientId_month_year"
}

const PayrollChecklist = () => {
  const theme = useTheme();
  const [clients, setClients] = useState<Client[]>([]);
  const [payrollStatus, setPayrollStatus] = useState<PayrollStatus>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [newClient, setNewClient] = useState<Omit<Client, 'id'>>({
    name: '',
    email: '',
    phone: '',
    cnpj: '',
    isProLabore: false,
  });
  const [currentDate, setCurrentDate] = useState(new Date());

  const months = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];

  const currentMonth = months[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear().toString();

  const getStatusKey = (clientId: string) => {
    return `${clientId}_${currentMonth}_${currentYear}`;
  };

  const changeMonth = (increment: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + increment);
    setCurrentDate(newDate);
  };

  const handleAddClient = () => {
    if (newClient.name.trim()) {
      const client: Client = {
        id: Date.now().toString(),
        ...newClient,
      };
      setClients([...clients, client]);
      setNewClient({
        name: '',
        email: '',
        phone: '',
        cnpj: '',
        isProLabore: false,
      });
      setModalVisible(false);
    }
  };

  const handleEditClient = () => {
    if (editingClient) {
      setClients(clients.map(client => 
        client.id === editingClient.id ? editingClient : client
      ));
      setDetailsModalVisible(false);
      setEditingClient(null);
    }
  };

  const togglePayrollStatus = (clientId: string) => {
    const statusKey = getStatusKey(clientId);
    setPayrollStatus(prev => ({
      ...prev,
      [statusKey]: !prev[statusKey]
    }));
  };

  const deleteClient = (clientId: string) => {
    setClients(clients.filter(client => client.id !== clientId));
    const newStatus = { ...payrollStatus };
    Object.keys(newStatus).forEach(key => {
      if (key.startsWith(`${clientId}_`)) {
        delete newStatus[key];
      }
    });
    setPayrollStatus(newStatus);
    setDetailsModalVisible(false);
    setMenuVisible(null);
  };

  const isPayrollSent = (clientId: string) => {
    return payrollStatus[getStatusKey(clientId)] || false;
  };

  const openClientDetails = (client: Client) => {
    setEditingClient({ ...client });
    setDetailsModalVisible(true);
    setMenuVisible(null);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Folhas de Pagamento
          </Text>
          <View style={styles.monthSelector}>
            <IconButton
              icon="chevron-left"
              size={24}
              onPress={() => changeMonth(-1)}
            />
            <Text variant="titleLarge" style={styles.monthText}>
              {currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1)}/{currentYear}
            </Text>
            <IconButton
              icon="chevron-right"
              size={24}
              onPress={() => changeMonth(1)}
            />
          </View>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Checklist de Clientes
            </Text>
            {clients.length === 0 ? (
              <Text variant="bodyMedium">Nenhum cliente adicionado</Text>
            ) : (
              clients.map(client => {
                const sent = isPayrollSent(client.id);
                return (
                  <List.Item
                    key={client.id}
                    title={client.name}
                    description={`${client.cnpj ? `CNPJ: ${client.cnpj} | ` : ''}${client.isProLabore ? 'Pró-Labore' : 'Folha Completa'}`}
                    left={props => (
                      <List.Icon
                        {...props}
                        icon={sent ? 'check-circle' : 'checkbox-blank-circle-outline'}
                        color={sent ? theme.colors.primary : undefined}
                      />
                    )}
                    onPress={() => togglePayrollStatus(client.id)}
                    right={props => (
                      <Menu
                        visible={menuVisible === client.id}
                        onDismiss={() => setMenuVisible(null)}
                        anchor={
                          <IconButton
                            {...props}
                            icon="dots-vertical"
                            size={20}
                            onPress={() => setMenuVisible(client.id)}
                          />
                        }
                      >
                        <Menu.Item
                          onPress={() => openClientDetails(client)}
                          title="Editar"
                          leadingIcon="pencil"
                        />
                        <Menu.Item
                          onPress={() => deleteClient(client.id)}
                          title="Excluir"
                          leadingIcon="delete"
                        />
                      </Menu>
                    )}
                    style={[
                      styles.clientItem,
                      sent && styles.completedClient,
                    ]}
                  />
                );
              })
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => setModalVisible(true)}
        size="medium"
      />

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <ScrollView>
            <Text variant="titleLarge" style={styles.modalTitle}>
              Adicionar Cliente
            </Text>
            <TextInput
              label="Nome do Cliente"
              value={newClient.name}
              onChangeText={(text) => setNewClient(prev => ({ ...prev, name: text }))}
              style={styles.input}
              mode="outlined"
            />
            <TextInput
              label="Email"
              value={newClient.email}
              onChangeText={(text) => setNewClient(prev => ({ ...prev, email: text }))}
              style={styles.input}
              mode="outlined"
              keyboardType="email-address"
            />
            <TextInput
              label="Telefone"
              value={newClient.phone}
              onChangeText={(text) => setNewClient(prev => ({ ...prev, phone: text }))}
              style={styles.input}
              mode="outlined"
              keyboardType="phone-pad"
            />
            <TextInput
              label="CNPJ"
              value={newClient.cnpj}
              onChangeText={(text) => setNewClient(prev => ({ ...prev, cnpj: text }))}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />
            <View style={styles.checkboxContainer}>
              <Checkbox
                status={newClient.isProLabore ? 'checked' : 'unchecked'}
                onPress={() => setNewClient(prev => ({ ...prev, isProLabore: !prev.isProLabore }))}
              />
              <Text style={styles.checkboxLabel}>Apenas Pró-Labore</Text>
            </View>
            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => setModalVisible(false)}
                style={styles.modalButton}
              >
                Cancelar
              </Button>
              <Button
                mode="contained"
                onPress={handleAddClient}
                style={styles.modalButton}
              >
                Adicionar
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>

      <Portal>
        <Modal
          visible={detailsModalVisible}
          onDismiss={() => {
            setDetailsModalVisible(false);
            setEditingClient(null);
          }}
          contentContainerStyle={styles.modalContainer}
        >
          <ScrollView>
            <Text variant="titleLarge" style={styles.modalTitle}>
              Detalhes do Cliente
            </Text>
            {editingClient && (
              <>
                <TextInput
                  label="Nome do Cliente"
                  value={editingClient.name}
                  onChangeText={(text) => setEditingClient(prev => prev ? { ...prev, name: text } : null)}
                  style={styles.input}
                  mode="outlined"
                />
                <TextInput
                  label="Email"
                  value={editingClient.email}
                  onChangeText={(text) => setEditingClient(prev => prev ? { ...prev, email: text } : null)}
                  style={styles.input}
                  mode="outlined"
                  keyboardType="email-address"
                />
                <TextInput
                  label="Telefone"
                  value={editingClient.phone}
                  onChangeText={(text) => setEditingClient(prev => prev ? { ...prev, phone: text } : null)}
                  style={styles.input}
                  mode="outlined"
                  keyboardType="phone-pad"
                />
                <TextInput
                  label="CNPJ"
                  value={editingClient.cnpj}
                  onChangeText={(text) => setEditingClient(prev => prev ? { ...prev, cnpj: text } : null)}
                  style={styles.input}
                  mode="outlined"
                  keyboardType="numeric"
                />
                <View style={styles.checkboxContainer}>
                  <Checkbox
                    status={editingClient.isProLabore ? 'checked' : 'unchecked'}
                    onPress={() => setEditingClient(prev => prev ? { ...prev, isProLabore: !prev.isProLabore } : null)}
                  />
                  <Text style={styles.checkboxLabel}>Apenas Pró-Labore</Text>
                </View>
                <View style={styles.modalButtons}>
                  <Button
                    mode="outlined"
                    onPress={() => {
                      setDetailsModalVisible(false);
                      setEditingClient(null);
                    }}
                    style={styles.modalButton}
                  >
                    Cancelar
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleEditClient}
                    style={styles.modalButton}
                  >
                    Salvar
                  </Button>
                </View>
              </>
            )}
          </ScrollView>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  monthText: {
    marginHorizontal: 10,
    color: '#333',
  },
  card: {
    margin: 10,
    elevation: 2,
  },
  cardTitle: {
    marginBottom: 10,
  },
  clientItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  completedClient: {
    opacity: 0.6,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 10,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkboxLabel: {
    marginLeft: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
  },
});

export default PayrollChecklist; 