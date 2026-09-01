import { DeviceType, IntegrationType } from "@prisma/client";

export interface UnifiedDevice {
  id: string;
  name: string;
  type: DeviceType;
  roomName: string;
  isOnline: boolean;
  state: boolean;
  currentPowerW: number;
  targetTemp?: number;
  currentTemp?: number;
  brightness?: number;
  integrationType: IntegrationType;
}

export interface DeviceAdapter {
  fetchDevices(): Promise<UnifiedDevice[]>;
  toggleDevice(id: string, currentState: boolean): Promise<boolean>;
  setBrightness?(id: string, value: number): Promise<boolean>;
  setTemperature?(id: string, value: number): Promise<boolean>;
}