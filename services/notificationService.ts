
import { DisasterEvent, User, DisasterType, SeverityLevel } from '../types';
import { disasterService } from './disasterService';

const SENT_ALERTS_KEY = 'aura_sent_alerts';

export const notificationService = {
  // Check new disasters against user preferences
  checkAndSendAlerts(disasters: DisasterEvent[], user: User): string[] {
    // SECURITY CHECK: Email must be verified
    if (!user.preferences.notificationsEnabled || !user.preferences.email || !user.preferences.emailVerified) {
        return [];
    }

    const sentAlerts = JSON.parse(localStorage.getItem(SENT_ALERTS_KEY) || '[]');
    const newAlerts: string[] = [];

    disasters.forEach(event => {
        // Skip if already alerted
        if (sentAlerts.includes(event.id)) return;

        // Check criteria
        const isSeverityMatch = this.checkSeverity(event.severity, user.preferences.minSeverity);
        const isTypeMatch = user.preferences.subscribedTypes.includes(event.type);
        const isZoneMatch = disasterService.checkEventInZones(event, user.preferences.watchZones);

        if ((isSeverityMatch && isTypeMatch) || isZoneMatch) {
            this.sendEmail(user.preferences.email, event, isZoneMatch ? `Watch Zone: ${isZoneMatch}` : undefined);
            sentAlerts.push(event.id);
            newAlerts.push(event.title);
        }
    });

    localStorage.setItem(SENT_ALERTS_KEY, JSON.stringify(sentAlerts));
    return newAlerts;
  },

  checkSeverity(eventSeverity: SeverityLevel, minSeverity: SeverityLevel): boolean {
    const levels = [SeverityLevel.LOW, SeverityLevel.MODERATE, SeverityLevel.HIGH, SeverityLevel.CRITICAL];
    return levels.indexOf(eventSeverity) >= levels.indexOf(minSeverity);
  },

  // Simulate Email Sending
  sendEmail(to: string, event: DisasterEvent, context?: string) {
    console.log(`
      [EMAIL SERVICE SIMULATION]
      To: ${to}
      Subject: AURA ALERT - ${event.title}
      Body: 
      Warning: ${event.severity} severity ${event.type} detected in ${event.country}.
      ${context ? `Triggered by ${context}` : ''}
      Impact prediction: ${event.description}
    `);
    
    // In a real app, you would call an API like SendGrid or AWS SES here
    // await fetch('/api/send-email', { ... })
  }
};
