import prisma from '../config/database';

export class SettingsService {
    // Get settings (create default if not exists)
    async getSettings() {
        let settings = await prisma.systemSettings.findUnique({
            where: { id: 1 }
        });

        if (!settings) {
            settings = await prisma.systemSettings.create({
                data: {
                    id: 1, 
                    allowRegistration: true,
                    maintenanceMode: false,
                    maxUploadSize: 5242880 
                }
            });
        }
        return settings;
    }

    // Update settings
    async updateSettings(data: {
        allowRegistration?: boolean;
        maintenanceMode?: boolean;
        supportEmail?: string;
        maxUploadSize?: number;
    }) {
        // Ensure record exists
        await this.getSettings();

        return await prisma.systemSettings.update({
            where: { id: 1 },
            data
        });
    }
}

export const settingsService = new SettingsService();
