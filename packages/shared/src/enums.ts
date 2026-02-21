// Rollen für RBAC
export enum Role {
  ADMIN = 'ADMIN',       // Alles erlaubt
  BAECKER = 'BAECKER',   // Bestellungen sehen, Status ändern
  LIEFERANT = 'LIEFERANT', // Lieferaufträge sehen, Status ändern
  KUNDE = 'KUNDE'        // Menü sehen, bestellen, eigene Bestellungen
}

// Bestellstatus
export enum OrderStatus {
  PENDING = 'PENDING',           // Gerade erstellt
  CONFIRMED = 'CONFIRMED',       // Bestätigt
  IN_PRODUCTION = 'IN_PRODUCTION', // In Zubereitung (Bäcker)
  READY = 'READY',               // Fertig zur Abholung/Lieferung
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY', // Unterwegs (Lieferant)
  DELIVERED = 'DELIVERED',       // Geliefert
  PICKED_UP = 'PICKED_UP',       // Abgeholt
  CANCELLED = 'CANCELLED'        // Storniert
}

// Liefermethode
export enum DeliveryMethod {
  PICKUP = 'PICKUP',     // Selbstabholung
  DELIVERY = 'DELIVERY'  // Lieferung
}
