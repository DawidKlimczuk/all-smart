import { DeviceAdapter, UnifiedDevice } from "./types";
import { DeviceType, IntegrationType } from "@prisma/client";

export class MockDeviceAdapter implements DeviceAdapter {
  private devices: UnifiedDevice[] = [
    {
      id: "demo-plug-1",
      name: "Smart Plug (Pralka)",
      type: DeviceType.SMART_PLUG,
      roomName: "Łazienka",
      isOnline: true,
      state: true,
      currentPowerW: 2150.0,
      integrationType: IntegrationType.TUYA_CLOUD,
    },
    {
      id: "demo-light-1",
      name: "Główne Oświetlenie LED",
      type: DeviceType.LIGHT,
      roomName: "Salon",
      isOnline: true,
      state: true,
      currentPowerW: 45.0,
      brightness: 85,
      integrationType: IntegrationType.LOCAL_LAN,
    },
    {
      id: "demo-heat-1",
      name: "Pompa Ciepła Split",
      type: DeviceType.HEAT_PUMP,
      roomName: "Kotłownia",
      isOnline: true,
      state: true,
      currentPowerW: 1420.0,
      currentTemp: 21.5,
      targetTemp: 22.5,
      integrationType: IntegrationType.HOME_ASSISTANT,
    },
    {
      id: "demo-pv-1",
      name: "Falownik PV 6kW",
      type: DeviceType.PV_INVERTER,
      roomName: "Garaż",
      isOnline: true,
      state: true,
      currentPowerW: -3850.0,
      integrationType: IntegrationType.LOCAL_LAN,
    },
  ];

  async fetchDevices(): Promise<UnifiedDevice[]> {
    return this.devices;
  }

  async toggleDevice(id: string, currentState: boolean): Promise<boolean> {
    const dev = this.devices.find((d) => d.id === id);
    if (dev) {
      dev.state = !currentState;
      return true;
    }
    return false;
  }

  async setBrightness(id: string, value: number): Promise<boolean> {
    const dev = this.devices.find((d) => d.id === id);
    if (dev) {
      dev.brightness = value;
      dev.currentPowerW = Math.round((value / 100) * 55 + 5);
      return true;
    }
    return false;
  }

  async setTemperature(id: string, value: number): Promise<boolean> {
    const dev = this.devices.find((d) => d.id === id);
    if (dev) {
      dev.targetTemp = value;
      const diff = Math.max(0, value - (dev.currentTemp || 20));
      dev.currentPowerW = Math.round(800 + diff * 350);
      return true;
    }
    return false;
  }
}