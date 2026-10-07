import { useQuery } from "@tanstack/react-query";
import { reservationService } from "@/services/reservation.service";
import { cancellationService } from "@/services/cancellation.service";

/** Loads a reservation (by PNR) with its passengers and cancellation record. */
export function useTicket(pnr: string, asAdmin = false) {
  return useQuery({
    queryKey: ["ticket", pnr, asAdmin],
    queryFn: async () => {
      const reservation = await reservationService.getReservationByPNR(pnr);
      if (!reservation) return null;
      const [passengers, cancellation] = await Promise.all([
        reservationService.getPassengers(reservation, asAdmin),
        reservation.bookingStatus === "CANCELLED" ? cancellationService.getForReservation(reservation.id) : Promise.resolve(null),
      ]);
      return { reservation, passengers, cancellation };
    },
  });
}
