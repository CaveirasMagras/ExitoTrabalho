import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, FAB, useTheme, List, IconButton, TextInput, Button, Portal, Modal, Checkbox, Menu } from 'react-native-paper';
import { Client } from '../types';
import { useClientContext } from '../contexts/ClientContext';
import NotificationService from '../services/NotificationService';

interface PayrollStatus {
  [key: string]: boolean; // key format: "clientId_month_year"
}

const PayrollChecklist = () => {
  const theme = useTheme();
  const { clients, addClient, updateClient, deleteClient: removeClient } = useClientContext();
  const [payrollStatus, setPayrollStatus] = useState<PayrollStatus>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [sindicatoMenuVisible, setSindicatoMenuVisible] = useState(false);
  const [newClient, setNewClient] = useState<Omit<Client, 'id'>>({
    name: '',
    email: '',
    phone: '',
    cnpj: '',
    address: '',
    payrollSent: false,
    union: {
      name: '',
      baseDate: ''
    }
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
        union: {
          name: newClient.union?.name || '',
          baseDate: newClient.union?.baseDate || ''
        }
      };
      addClient(client);
      setNewClient({
        name: '',
        email: '',
        phone: '',
        cnpj: '',
        address: '',
        payrollSent: false,
        union: {
          name: '',
          baseDate: ''
        }
      });
      setModalVisible(false);
    }
  };

  const handleEditClient = () => {
    if (editingClient && editingClient.name.trim()) {
      updateClient(editingClient.id, {
        ...editingClient,
        union: {
          name: editingClient.union?.name || '',
          baseDate: editingClient.union?.baseDate || ''
        }
      });
      setDetailsModalVisible(false);
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
    removeClient(clientId);
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

  // Função para obter sindicatos únicos
  const getUniqueUnions = () => {
    const unions = clients
      .filter(client => client.union?.name && client.union.name.trim() !== '')
      .map(client => ({
        name: client.union?.name || '',
        baseDate: client.union?.baseDate || ''
      }));

    // Remove duplicatas mantendo apenas o primeiro de cada nome
    const uniqueUnions = unions.reduce((acc, current) => {
      const exists = acc.find(item => item.name === current.name);
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, [] as { name: string; baseDate: string }[]);

    return uniqueUnions;
  };

  const getMonthName = (month: string) => {
    const monthNumber = parseInt(month);
    if (isNaN(monthNumber) || monthNumber < 1 || monthNumber > 12) return '';
    return months[monthNumber - 1];
  };

  const handleSelectUnion = (union: { name: string; baseDate: string }) => {
    setNewClient(prev => ({
      ...prev,
      union: {
        name: union.name,
        baseDate: union.baseDate
      }
    }));
    setSindicatoMenuVisible(false);
  };

  useEffect(() => {
    // Verifica notificações ao iniciar o app
    NotificationService.checkUnionNotifications(clients);
    // Agenda verificação mensal
    NotificationService.scheduleMonthlyCheck();
  }, [clients]);

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
                    description={`${client.cnpj ? `CNPJ: ${client.cnpj} | ` : ''}${client.union?.name ? `Sindicato: ${client.union.name}` : ''}`}
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
            <Text variant="titleLarge" style={styles.modalTitle}>Novo Cliente</Text>
            <View style={styles.formSection}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Informações Básicas</Text>
              <TextInput
                label="Nome"
                value={newClient.name}
                onChangeText={(text) => setNewClient({ ...newClient, name: text })}
                style={styles.input}
                mode="outlined"
              />
              <TextInput
                label="CNPJ"
                value={newClient.cnpj}
                onChangeText={(text) => setNewClient({ ...newClient, cnpj: text })}
                style={styles.input}
                mode="outlined"
              />
              <TextInput
                label="Endereço"
                value={newClient.address}
                onChangeText={(text) => setNewClient({ ...newClient, address: text })}
                style={styles.input}
                mode="outlined"
              />
              <TextInput
                label="Telefone"
                value={newClient.phone}
                onChangeText={(text) => setNewClient({ ...newClient, phone: text })}
                style={styles.input}
                mode="outlined"
                keyboardType="phone-pad"
              />
              <TextInput
                label="Email"
                value={newClient.email}
                onChangeText={(text) => setNewClient({ ...newClient, email: text })}
                style={styles.input}
                mode="outlined"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.formSection}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Informações do Sindicato</Text>
              <View style={styles.unionSelector}>
                <TextInput
                  label="Nome do Sindicato"
                  value={newClient.union?.name}
                  onChangeText={(text) => setNewClient({ 
                    ...newClient, 
                    union: { ...newClient.union, name: text }
                  })}
                  style={[styles.input, { flex: 1 }]}
                  mode="outlined"
                  right={
                    <TextInput.Icon
                      icon="menu-down"
                      onPress={() => setSindicatoMenuVisible(true)}
                    />
                  }
                />
                <Portal>
                  <Modal
                    visible={sindicatoMenuVisible}
                    onDismiss={() => setSindicatoMenuVisible(false)}
                    contentContainerStyle={styles.unionMenu}
                  >
                    <ScrollView>
                      <Text variant="titleMedium" style={styles.modalTitle}>Selecione um Sindicato</Text>
                      {getUniqueUnions().length === 0 ? (
                        <Text style={styles.emptyText}>Nenhum sindicato cadastrado</Text>
                      ) : (
                        getUniqueUnions().map((union, index) => (
                          <List.Item
                            key={index}
                            title={union.name}
                            description={`Data Base: ${getMonthName(union.baseDate)}`}
                            onPress={() => handleSelectUnion(union)}
                            left={props => <List.Icon {...props} icon="office-building" />}
                          />
                        ))
                      )}
                    </ScrollView>
                  </Modal>
                </Portal>
              </View>
              <TextInput
                label="Data Base"
                value={newClient.union?.baseDate}
                onChangeText={(text) => {
                  // Se o texto estiver vazio, permite apagar
                  if (text === '') {
                    setNewClient({ 
                      ...newClient, 
                      union: { ...newClient.union, baseDate: '' }
                    });
                    return;
                  }
                  // Aceita apenas números e limita a 2 dígitos
                  const numbersOnly = text.replace(/[^0-9]/g, '');
                  if (numbersOnly.length <= 2) {
                    const month = parseInt(numbersOnly);
                    if (month >= 1 && month <= 12) {
                      setNewClient({ 
                        ...newClient, 
                        union: { ...newClient.union, baseDate: numbersOnly }
                      });
                    }
                  }
                }}
                style={styles.input}
                mode="outlined"
                placeholder="Mês (1-12)"
                keyboardType="numeric"
                maxLength={2}
              />
            </View>

            <View style={styles.modalButtons}>
              <Button mode="outlined" onPress={() => setModalVisible(false)} style={styles.button}>
                Cancelar
              </Button>
              <Button mode="contained" onPress={handleAddClient} style={styles.button}>
                Adicionar
              </Button>
            </View>
          </ScrollView>
        </Modal>

        <Modal
          visible={detailsModalVisible}
          onDismiss={() => setDetailsModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          {editingClient && (
            <ScrollView>
              <Text variant="titleLarge" style={styles.modalTitle}>Editar Cliente</Text>
              <View style={styles.formSection}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Informações Básicas</Text>
                <TextInput
                  label="Nome"
                  value={editingClient.name}
                  onChangeText={(text) => setEditingClient({ ...editingClient, name: text })}
                  style={styles.input}
                  mode="outlined"
                />
                <TextInput
                  label="CNPJ"
                  value={editingClient.cnpj}
                  onChangeText={(text) => setEditingClient({ ...editingClient, cnpj: text })}
                  style={styles.input}
                  mode="outlined"
                />
                <TextInput
                  label="Endereço"
                  value={editingClient.address}
                  onChangeText={(text) => setEditingClient({ ...editingClient, address: text })}
                  style={styles.input}
                  mode="outlined"
                />
                <TextInput
                  label="Telefone"
                  value={editingClient.phone}
                  onChangeText={(text) => setEditingClient({ ...editingClient, phone: text })}
                  style={styles.input}
                  mode="outlined"
                  keyboardType="phone-pad"
                />
                <TextInput
                  label="Email"
                  value={editingClient.email}
                  onChangeText={(text) => setEditingClient({ ...editingClient, email: text })}
                  style={styles.input}
                  mode="outlined"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.formSection}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Informações do Sindicato</Text>
                <TextInput
                  label="Nome do Sindicato"
                  value={editingClient.union?.name}
                  onChangeText={(text) => setEditingClient({ 
                    ...editingClient, 
                    union: { ...editingClient.union, name: text }
                  })}
                  style={styles.input}
                  mode="outlined"
                />
                <TextInput
                  label="Data Base"
                  value={editingClient.union?.baseDate}
                  onChangeText={(text) => {
                    // Se o texto estiver vazio, permite apagar
                    if (text === '') {
                      setEditingClient({ 
                        ...editingClient, 
                        union: { ...editingClient.union, baseDate: '' }
                      });
                      return;
                    }
                    // Aceita apenas números e limita a 2 dígitos
                    const numbersOnly = text.replace(/[^0-9]/g, '');
                    if (numbersOnly.length <= 2) {
                      const month = parseInt(numbersOnly);
                      if (month >= 1 && month <= 12) {
                        setEditingClient({ 
                          ...editingClient, 
                          union: { ...editingClient.union, baseDate: numbersOnly }
                        });
                      }
                    }
                  }}
                  style={styles.input}
                  mode="outlined"
                  placeholder="Mês (1-12)"
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>

              <View style={styles.modalButtons}>
                <Button mode="outlined" onPress={() => setDetailsModalVisible(false)} style={styles.button}>
                  Cancelar
                </Button>
                <Button mode="contained" onPress={handleEditClient} style={styles.button}>
                  Salvar
                </Button>
              </View>
            </ScrollView>
          )}
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
    padding: 16,
    backgroundColor: 'white',
    elevation: 2,
  },
  title: {
    marginBottom: 8,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: {
    marginHorizontal: 16,
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  cardTitle: {
    marginBottom: 16,
  },
  clientItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  completedClient: {
    backgroundColor: '#e3f2fd',
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
    maxHeight: '90%',
  },
  modalTitle: {
    marginBottom: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 10,
    color: '#666',
  },
  input: {
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    paddingBottom: 20,
  },
  button: {
    marginLeft: 10,
    minWidth: 100,
  },
  unionSelector: {
    position: 'relative',
    marginBottom: 12,
  },
  unionMenu: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 20,
    color: '#666',
  },
});

export default PayrollChecklist; 