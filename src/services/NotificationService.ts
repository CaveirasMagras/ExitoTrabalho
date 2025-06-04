import notifee, { AndroidImportance, TriggerType, RepeatFrequency } from '@notifee/react-native';
import { Client } from '../types';

class NotificationService {
  async checkUnionNotifications(clients: Client[]) {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // Mês atual (1-12)

    // Filtra clientes com sindicato no mês atual
    const relevantClients = clients.filter(client => {
      if (!client.union?.baseDate) return false;
      const baseMonth = parseInt(client.union.baseDate);
      return baseMonth === currentMonth;
    });

    if (relevantClients.length > 0) {
      // Cria canal para Android
      await notifee.createChannel({
        id: 'unions',
        name: 'Sindicatos',
        importance: AndroidImportance.HIGH,
      });

      // Envia notificação
      await notifee.displayNotification({
        title: 'Aviso de Sindicatos',
        body: `Existem ${relevantClients.length} cliente(s) com data base do sindicato neste mês: ${relevantClients.map(c => c.name).join(', ')}`,
        android: {
          channelId: 'unions',
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
          },
        },
      });
    }
  }

  async scheduleMonthlyCheck() {
    // Agenda verificação para o primeiro dia do próximo mês às 9h
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 9, 0, 0);

    await notifee.createTriggerNotification(
      {
        title: 'Verificação de Sindicatos',
        body: 'Verificando sindicatos com data base neste mês...',
        android: {
          channelId: 'unions',
          importance: AndroidImportance.HIGH,
        },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: nextMonth.getTime(),
      }
    );
  }
}

export default new NotificationService(); 